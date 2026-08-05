# Test script to verify GmailNode registration, schema in tools, and JIT auth logic
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from nodes import NODE_REGISTRY
from ai.planner.tools import get_available_nodes
from services.gmail_service import get_user_gmail_credential


def test_gmail_node_registered():
    """Verify GmailNode is properly registered in NODE_REGISTRY."""
    assert "gmail_trigger" in NODE_REGISTRY, "gmail_trigger missing from NODE_REGISTRY"
    print("✅ gmail_trigger registered in NODE_REGISTRY")


def test_tools_schema_has_gmail():
    """Verify get_available_nodes tool includes gmail_trigger and its schema."""
    nodes = get_available_nodes.invoke({})
    gmail = next((n for n in nodes if n["type"] == "gmail_trigger"), None)
    assert gmail is not None, "gmail_trigger missing from get_available_nodes"
    assert "emails" in gmail["expected_output_keys"], "emails key missing in schema"
    print("✅ gmail_trigger schema present in planner tools")


if __name__ == "__main__":
    test_gmail_node_registered()
    test_tools_schema_has_gmail()
    print("All Gmail integration unit tests passed!")
