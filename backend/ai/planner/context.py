"""
context.py — Context initializer for each planner run.

Builds the structured initial messages passed to the agent,
including the user goal and any pre-run state injection.
"""
from typing import Any
from langchain_core.messages import HumanMessage, SystemMessage


def build_initial_messages(user_prompt: str, history: list) -> list:
    """
    Construct the message list for a new agent invocation.
    Prepends the user prompt as a HumanMessage to existing history.
    """
    new_message = HumanMessage(content=user_prompt)
    return list(history) + [new_message]


def build_correction_message(error: str) -> HumanMessage:
    """
    Inject a structured correction hint back into the conversation
    when guardrails catch a semantic failure.
    """
    content = (
        f"Your previous output had the following issue:\n\n"
        f"{error}\n\n"
        "Please fix this now. Re-read the STRICT RULES and call the missing tools. "
        "Do NOT add new nodes. Only fix what is broken."
    )
    return HumanMessage(content=content)
