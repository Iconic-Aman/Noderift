"""
chat_router.py — Dual-model chat router.

The lightweight 8B model does two things:
1. Classifies intent: CONVERSATION or BUILD_REQUEST
2. Handles the reply itself if CONVERSATION (no tools, no 70B model wakes up)

Only if intent == BUILD_REQUEST does control pass to the heavy agent loop.
"""
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

logger = logging.getLogger("uvicorn")

CHAT_SYSTEM_PROMPT = """You are Noderift's friendly AI workflow assistant named "Nodi".

Your job is to:
1. Greet users warmly
2. Understand what automation they want to build
3. Ask smart clarifying questions (max 1 at a time, never more)
4. Once clear, confirm and hand off to the workflow builder

STRICT RULES:
- Be concise and friendly. No corporate speak.
- NEVER ask more than 1 question at a time.
- NEVER make up features or node types that don't exist.
- If the user greets you or asks general questions → respond naturally.
- If the user wants to build something → ask ONE clarifying question if needed, then say you're ready to build.
- If the request is crystal clear (e.g. "fetch emails from X and save to excel") → respond with exactly: READY_TO_BUILD
- Do NOT explain what you're going to do step by step. Be brief.

Noderift can automate:
- Gmail (read emails, filter by sender)
- Webhooks (receive HTTP events)
- Schedules (run on cron)
- HTTP requests (call any API)
- AI agents (LLM-powered steps)
- Database queries
- WhatsApp / Email sending
- Code execution (Python)
- Playwright (browser automation)
- Filters, loops, conditions, variables
"""

INTENT_SYSTEM_PROMPT = """You are an intent classifier. Given a user message, respond with ONLY one word:
- CONVERSATION — if the user is greeting, asking general questions, or having small talk
- BUILD_REQUEST — if the user is asking to build, create, automate, or modify a workflow

Rules:
- If message contains words like "build", "create", "automate", "add", "fetch", "send", "save", "connect", "make", "when X then Y" → BUILD_REQUEST
- If message is a greeting, question about features, or unclear → CONVERSATION
- Respond with ONLY the single word. Nothing else."""

# Fast-path: obvious conversation starters — never need LLM to classify
_CONVERSATION_PATTERNS = [
    "hi", "hello", "hey", "how are you", "how r u", "sup", "what's up", "whats up",
    "good morning", "good evening", "good afternoon", "good night",
    "who are you", "what are you", "what can you do", "what is noderift",
    "help", "what do you do", "tell me about", "explain", "thanks", "thank you",
    "ok", "okay", "cool", "great", "nice", "awesome", "got it", "sure",
    "what's new", "interesting", "bye", "goodbye", "see you",
]

def _is_obvious_conversation(message: str) -> bool:
    """Fast keyword check — skip LLM classifier for obvious greetings/chit-chat."""
    lower = message.lower().strip()
    # Very short messages with no build keywords
    build_keywords = ["build", "create", "automate", "add node", "fetch", "send email",
                      "save", "connect", "schedule", "webhook", "when ", "trigger",
                      "gmail", "excel", "database", "http", "workflow", "run", "deploy"]
    has_build_keyword = any(kw in lower for kw in build_keywords)
    if has_build_keyword:
        return False
    return any(lower.startswith(pat) or lower == pat for pat in _CONVERSATION_PATTERNS)


def _get_chat_llm(api_key: str = "", base_url: str = "", model: str = ""):
    from core.config import settings
    resolved_key = api_key or settings.OPENROUTER_API_KEY
    resolved_base = base_url or settings.OPENROUTER_API_URL or "https://openrouter.ai/api/v1"
    resolved_model = (
        model
        or settings.OPENROUTER_MODEL2.strip()
        or settings.OPENROUTER_CHAT_MODEL.strip()
        or "openrouter/free"
    )

    logger.info(f"[ChatRouter] 🤖 Intent/Chat Model: '{resolved_model}'")
    return ChatOpenAI(
        model=resolved_model,
        api_key=resolved_key,
        base_url=resolved_base,
        temperature=0.7,
    )


async def classify_intent(user_message: str, api_key: str = "", base_url: str = "", model: str = "") -> str:
    """Returns 'BUILD_REQUEST' or 'CONVERSATION'."""
    # Fast-path: skip LLM for obvious conversations
    if _is_obvious_conversation(user_message):
        logger.info(f"[ChatRouter] Fast-path CONVERSATION for: '{user_message[:60]}'")
        return "CONVERSATION"
    try:
        llm = _get_chat_llm(api_key, base_url, model)
        result = await llm.ainvoke([
            SystemMessage(content=INTENT_SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ])
        intent = result.content.strip().upper()
        logger.info(f"[ChatRouter] LLM Intent classified: '{intent}' for: '{user_message[:60]}'")
        if "BUILD" in intent:
            return "BUILD_REQUEST"
        return "CONVERSATION"
    except Exception as e:
        logger.error(f"[ChatRouter] Intent classification failed: {e}. Defaulting to BUILD_REQUEST.")
        return "BUILD_REQUEST"


async def handle_conversation(user_message: str, history: list, api_key: str = "", base_url: str = "", model: str = "") -> str:
    """Handle casual conversation using the lightweight model."""
    try:
        llm = _get_chat_llm(api_key, base_url, model)

        # Build message history for context (last 6 messages max)
        messages = [SystemMessage(content=CHAT_SYSTEM_PROMPT)]
        for msg in history[-6:]:
            if getattr(msg, "type", "") == "human":
                messages.append(HumanMessage(content=msg.content))
            elif getattr(msg, "type", "") == "ai":
                messages.append(AIMessage(content=msg.content))

        messages.append(HumanMessage(content=user_message))

        result = await llm.ainvoke(messages)
        reply = result.content.strip()
        logger.info(f"[ChatRouter] Conversation handled by chat model. Reply length: {len(reply)}")
        return reply
    except Exception as e:
        logger.error(f"[ChatRouter] Conversation handler failed: {e}")
        return "Hey! I'm here to help you build automations. What would you like to automate?"


async def route_message(user_message: str, history: list, api_key: str = "", base_url: str = "", model: str = "") -> tuple[str, bool]:
    """
    Route a user message through the dual-model system.

    Returns:
        (reply_text, should_build)
        - If should_build=True  → caller must run the heavy agent loop
        - If should_build=False → reply_text is the final response from chat model
    """
    logger.info(f"[ChatRouter] ── route_message() called ──")
    logger.info(f"[ChatRouter] Model: '{model}'")
    logger.info(f"[ChatRouter] API URL: '{base_url}'")
    logger.info(f"[ChatRouter] API Key present: {bool(api_key)}")

    intent = await classify_intent(user_message, api_key, base_url, model)
    logger.info(f"[ChatRouter] Final intent decision: {intent}")

    if intent == "CONVERSATION":
        logger.info(f"[ChatRouter] → Handling as CONVERSATION with chat model")
        reply = await handle_conversation(user_message, history, api_key, base_url, model)
        logger.info(f"[ChatRouter] → Chat reply: '{reply[:100]}'")
        if "READY_TO_BUILD" in reply:
            logger.info(f"[ChatRouter] → Chat model said READY_TO_BUILD — escalating to heavy model")
            return "", True
        return reply, False

    # BUILD_REQUEST — pass to heavy model
    logger.info(f"[ChatRouter] → BUILD_REQUEST — heavy model will take over")
    return "", True
