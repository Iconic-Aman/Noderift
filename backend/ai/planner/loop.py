"""
loop.py — Orchestrated self-correction execution loop.

Uses LangGraph checkpointer (thread_id) for full persistent state across HTTP requests.
Each call passes only the new message; LangGraph appends it to the saved thread automatically.
"""
import logging
from sqlalchemy.orm import Session
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from ai.planner.guardrails import verify_graph
from ai.planner.session import emit_canvas_patch, get_session_graph

logger = logging.getLogger("uvicorn")
MAX_RETRIES = 3


def _extract_reply(messages: list) -> str:
    """Walk backward through messages to find the last AIMessage with text."""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and msg.content:
            return msg.content if isinstance(msg.content, str) else str(msg.content)
    return "Workflow built on canvas. Check the nodes above."


def _log_thread_state(messages: list, session_id: str):
    """Log the current thread history so we can see what the agent remembers."""
    human = sum(1 for m in messages if isinstance(m, HumanMessage))
    ai = sum(1 for m in messages if isinstance(m, AIMessage))
    tool = sum(1 for m in messages if isinstance(m, ToolMessage))
    logger.info(
        f"[Thread:{session_id[:8]}] 📜 History — "
        f"{len(messages)} msgs total | 👤 human={human} 🤖 ai={ai} 🔧 tool={tool}"
    )


def _log_canvas_state(db: Session, session_id: str, label: str = ""):
    """Log current nodes and edges on the canvas."""
    graph = get_session_graph(db, session_id)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    node_summary = [(n["id"], n.get("data", {}).get("node_type", "?")) for n in nodes]
    edge_summary = [(e.get("source", "?"), e.get("target", "?")) for e in edges]
    logger.info(
        f"[Canvas:{session_id[:8]}] {label} "
        f"Nodes({len(nodes)}): {node_summary} | "
        f"Edges({len(edges)}): {edge_summary}"
    )


def _log_agent_tool_calls(messages: list):
    """Log which tools the agent called in the last run."""
    tool_calls = []
    for m in messages:
        if isinstance(m, AIMessage) and getattr(m, "tool_calls", None):
            for tc in m.tool_calls:
                args_preview = str(tc.get("args", {}))[:80]
                tool_calls.append(f"  → {tc['name']}({args_preview})")
    if tool_calls:
        logger.info(f"[Agent] 🔧 Tool calls made:\n" + "\n".join(tool_calls))
    else:
        logger.warning("[Agent] ⚠ No tool calls detected — agent may have responded without acting.")


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
    logger.info(f"━━━ [Loop] thread_id={session_id} | model={settings.OPENROUTER_MODEL} ━━━")
    logger.info(f"[Loop] 💬 User prompt: '{user_prompt[:120]}'")

    # Log canvas state BEFORE agent runs so we can see what it's starting from
    _log_canvas_state(db, session_id, label="BEFORE:")

    # Only the new user message — LangGraph appends to the thread automatically
    input_messages = {"messages": [HumanMessage(content=user_prompt)]}
    final_messages = []

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"[Harness] ── Attempt {attempt}/{MAX_RETRIES} ──")

        await emit_canvas_patch(session_id, "agent_step", {
            "text": f"Thinking... (attempt {attempt})"
        })

        try:
            result = await agent.ainvoke(input_messages, config=config)
            final_messages = result.get("messages", [])

            # Log what the agent remembered (full thread) and what it did
            _log_thread_state(final_messages, session_id)
            _log_agent_tool_calls(final_messages)

            # Subsequent retry attempts pass empty — LangGraph manages thread internally
            input_messages = {"messages": []}
        except Exception as e:
            err_str = str(e)
            logger.error(f"[Harness] ❌ Agent exception (attempt {attempt}): {type(e).__name__}: {err_str[:200]}")
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

        # Log canvas state AFTER agent ran
        _log_canvas_state(db, session_id, label="AFTER:")

        # Run guardrails
        error = verify_graph(db, session_id)
        if error is None:
            logger.info("[Harness] ✅ Guardrails passed.")
            await emit_canvas_patch(session_id, "agent_step", {
                "text": "✓ Workflow verified — all nodes connected."
            })
            break

        logger.warning(f"[Harness] ⚠ Guardrail FAILED (attempt {attempt}): {error}")
        await emit_canvas_patch(session_id, "agent_step", {
            "text": f"⚠ Issue found: {error[:80]}... retrying."
        })

        if attempt == MAX_RETRIES:
            logger.error(
                f"[Harness] 🔴 MAX RETRIES REACHED. Session={session_id}. "
                f"Last guardrail error: {error}"
            )
            _log_canvas_state(db, session_id, label="FINAL FAILED STATE:")
            break

        # Inject correction into thread for next attempt
        correction_text = (
            f"Your previous output had the following issue:\n\n{error}\n\n"
            "Please fix this now. Re-read the STRICT RULES and call the missing tools. "
            "Do NOT add new nodes. Only fix what is broken."
        )
        logger.info(f"[Harness] 💉 Injecting correction into thread: '{error[:80]}'")
        input_messages = {"messages": [HumanMessage(content=correction_text)]}

    return _extract_reply(final_messages), final_messages

