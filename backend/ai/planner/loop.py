"""
loop.py — Orchestrated self-correction execution loop.

Replaces the single agent.ainvoke() call with a multi-turn loop:
1. Invoke agent.
2. Run guardrails to verify graph is correct.
3. If guardrails fail → inject correction message → retry (max MAX_RETRIES).
4. Return final reply text and all messages.
"""
import logging
from sqlalchemy.orm import Session
from langchain_core.messages import AIMessage

from ai.planner.context import build_initial_messages, build_correction_message
from ai.planner.guardrails import verify_graph
from ai.planner.session import emit_canvas_patch

logger = logging.getLogger("uvicorn")
MAX_RETRIES = 3


def _extract_reply(messages: list) -> str:
    """Walk backward through messages to find the last AIMessage with text."""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and msg.content:
            return msg.content if isinstance(msg.content, str) else str(msg.content)
    return "Workflow built on canvas. Check the nodes above."


async def run_agent_loop(
    agent,
    user_prompt: str,
    history: list,
    session_id: str,
    db: Session,
) -> tuple[str, list]:
    """
    Run the agent with self-correction harness.

    Returns:
        (reply_text, final_messages)
    """
    messages = build_initial_messages(user_prompt, history)
    config = {"configurable": {"session_id": session_id, "db": db}}
    final_messages = messages

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"[Harness] Attempt {attempt}/{MAX_RETRIES}")

        await emit_canvas_patch(session_id, "agent_step", {
            "text": f"Thinking... (attempt {attempt})"
        })

        result = await agent.ainvoke({"messages": messages}, config=config)
        final_messages = result.get("messages", messages)

        # Run guardrails
        error = verify_graph(db, session_id)
        if error is None:
            logger.info("[Harness] Guardrails passed.")
            await emit_canvas_patch(session_id, "agent_step", {
                "text": "✓ Workflow verified — all nodes connected."
            })
            break

        logger.warning(f"[Harness] Guardrail failed: {error}")
        await emit_canvas_patch(session_id, "agent_step", {
            "text": f"⚠ Issue found: {error[:80]}... retrying."
        })

        if attempt == MAX_RETRIES:
            logger.error("[Harness] Max retries reached.")
            break

        # Inject correction and continue loop
        correction = build_correction_message(error)
        messages = list(final_messages) + [correction]

    return _extract_reply(final_messages), final_messages
