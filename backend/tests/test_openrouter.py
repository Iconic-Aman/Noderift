# Test OpenRouter setup from environment variables
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from ai.planner.agent import get_planner_agent


def test_openrouter_config():
    assert settings.OPENROUTER_API_KEY != "", "OPENROUTER_API_KEY must be loaded from .env"
    assert settings.OPENROUTER_MODEL == "meta-llama/llama-3.3-70b-instruct", "OPENROUTER_MODEL setting mismatch"
    assert settings.OPENROUTER_API_URL == "https://openrouter.ai/api/v1", "OPENROUTER_API_URL setting mismatch"
    print("✅ OpenRouter settings verified from .env")


def test_agent_initialization():
    agent = get_planner_agent()
    assert agent is not None, "Failed to initialize planner agent"
    print("✅ Planner agent initialized with OpenRouter model")


if __name__ == "__main__":
    test_openrouter_config()
    test_agent_initialization()
    print("All OpenRouter unit tests passed!")
