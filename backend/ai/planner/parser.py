"""
parser.py — Recovers malformed tool calls from weak models.

Some models (e.g. Llama 8B, Cohere) output raw XML instead of JSON tool calls:
  <function=add_node{"node_type": "code", ...}></function>

This parser intercepts that format and converts it to proper LangChain ToolCall dicts.
"""
import re
import json
from typing import Any


def parse_xml_tool_calls(text: str) -> list[dict[str, Any]]:
    """Extract tool calls from raw XML-style function tags emitted by weak models."""
    pattern = re.compile(
        r"<function=(\w+)([^>]*)>",
        re.DOTALL,
    )
    calls = []
    for match in pattern.finditer(text):
        tool_name = match.group(1)
        raw_args = match.group(2).strip()
        # Unescape common escape sequences
        raw_args = raw_args.replace("\\'", "'").replace('\\"', '"')
        try:
            args = json.loads(raw_args) if raw_args else {}
        except json.JSONDecodeError:
            # Last-ditch: wrap bare value in dict
            args = {"raw": raw_args}
        calls.append({"name": tool_name, "args": args})
    return calls


def has_xml_tool_calls(text: str) -> bool:
    """Return True if text contains XML-style function tags."""
    return bool(re.search(r"<function=\w+", text))
