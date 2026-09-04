"""
loop.py — Orchestrated self-correction execution loop.

Uses LangGraph checkpointer (thread_id) for full persistent state across HTTP requests.
Each call passes only the new message; LangGraph appends it to the saved thread automatically.
"""
import logging
from sqlalchemy.orm import Session
from langchain_core.messages import AIMessage, HumanMessage

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
    history: list,  # kept for signature compat; state managed by checkpointer via thread_id
    session_id: str,
    db: Session,
) -> tuple[str, list]:
    """
    Run the agent with self-correction harness.
    LangGraph checkpointer resumes the full thread (all tool calls, node IDs) via thread_id.

    Returns:
        (reply_text, final_messages)
    """
    # thread_id tells LangGraph which saved state to resume
    config = {
        "configurable": {
            "thread_id": session_id,
            "session_id": session_id,
            "db": db,
        }
    }

    from core.config import settings
    logger.info(f"🤖 [AI PLANNER] Starting workflow generation loop using Model: '{settings.OPENROUTER_MODEL}'")

    # Only the new user message — LangGraph appends to the thread automatically
    input_messages = {"messages": [HumanMessage(content=user_prompt)]}
    final_messages = []

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"[Harness] Attempt {attempt}/{MAX_RETRIES}")

        await emit_canvas_patch(session_id, "agent_step", {
            "text": f"Thinking... (attempt {attempt})"
        })

        try:
            result = await agent.ainvoke(input_messages, config=config)
            final_messages = result.get("messages", [])
            # Subsequent retry attempts pass empty — LangGraph manages thread internally
            input_messages = {"messages": []}
        except Exception as e:
            err_str = str(e)
            from ai.planner.parser import has_xml_tool_calls, parse_xml_tool_calls
            if has_xml_tool_calls(err_str):
                logger.info("[Harness] OpenRouter tool_use_failed detected — recovering XML tool calls...")
                parsed_calls = parse_xml_tool_calls(err_str)
                import inspect
                for call in parsed_calls:
                    func_name = call.get("name")
                    func_args = call.get("args", {})
                    if hasattr(tools, func_name):
                        tool_func = getattr(tools, func_name)
                        try:
                            if hasattr(tool_func, "ainvoke"):
                                await tool_func.ainvoke(func_args, config=config)
                            elif inspect.iscoroutinefunction(tool_func):
                                await tool_func(**func_args, config=config)
                            else:
                                tool_func(**func_args)
                        except Exception as tool_err:
                            logger.error(f"[Harness] Error executing recovered tool {func_name}: {tool_err}")
            else:
                raise e

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

        # Inject correction into thread for next attempt
        correction_text = (
            f"Your previous output had the following issue:\n\n{error}\n\n"
            "Please fix this now. Re-read the STRICT RULES and call the missing tools. "
            "Do NOT add new nodes. Only fix what is broken."
        )
        input_messages = {"messages": [HumanMessage(content=correction_text)]}

    return _extract_reply(final_messages), final_messages
