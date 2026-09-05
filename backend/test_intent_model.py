import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from ai.planner.chat_router import route_message, classify_intent


async def run_diagnostics():
    active_intent_model = (
        settings.OPENROUTER_MODEL2.strip()
        or settings.OPENROUTER_CHAT_MODEL.strip()
        or "openrouter/free"
    )
    print("=" * 80)
    print("      NODERIFT INTENT CLASSIFICATION & DUAL-MODEL EVALUATION TEST")
    print("=" * 80)
    print(f"[CONFIG] Active Intent Model (OPENROUTER_MODEL2): {active_intent_model}")
    print(f"[CONFIG] Active Heavy Builder Model               : {settings.OPENROUTER_MODEL or settings.OPENROUTER_MODEL1}")
    print("=" * 80)

    test_cases = [
        # (Prompt, Expected_Intent)
        ("hello how are you", "CONVERSATION"),
        ("hello who are you", "CONVERSATION"),
        ("hi", "CONVERSATION"),
        ("hey, what's up?", "CONVERSATION"),
        ("good morning!", "CONVERSATION"),
        ("hello what can you do for me", "CONVERSATION"),
        ("what is Noderift?", "CONVERSATION"),
        ("thanks a lot!", "CONVERSATION"),
        ("build a workflow where I'll get a joke from https://v2.jokeapi.dev/joke/Any everyday at 6pm and create an excel sheet", "BUILD_REQUEST"),
        ("create a webhook node and connect it to python code node", "BUILD_REQUEST"),
        ("fetch emails from Gmail and save to excel", "BUILD_REQUEST"),
        ("every day at 9am query database and send whatsapp message", "BUILD_REQUEST"),
    ]

    passed_count = 0
    convo_routed = 0
    build_routed = 0

    print("\n--- RUNNING PROMPT EVALUATION SUITE ---\n")

    for idx, (prompt, expected) in enumerate(test_cases, 1):
        intent = await classify_intent(prompt)
        reply, should_build = await route_message(prompt, [])

        actual_intent = "BUILD_REQUEST" if should_build else "CONVERSATION"
        is_correct = actual_intent == expected

        if is_correct:
            passed_count += 1

        if should_build:
            build_routed += 1
            model_used = settings.OPENROUTER_MODEL
        else:
            convo_routed += 1
            model_used = active_intent_model

        status_str = "PASSED [OK]" if is_correct else "MISMATCH [FAIL]"
        print(f"  |-- Classified Intent  : {intent}")
        print(f"  |-- Active Model Used  : {model_used}")
        print(f"  |-- Final Decision     : {'BUILD_REQUEST (Will wake 70B Builder)' if should_build else 'CONVERSATION (Handled by Intent Model)'}")
        safe_reply = reply.encode('ascii', 'ignore').decode('ascii') if reply else ""
        print(f"  |-- Model Response     : {safe_reply[:120] if safe_reply else '[Handed off to 70B Builder Agent]'}")
        print(f"  +-- Test Status        : {status_str}")
        print("-" * 80)

    print("\n" + "=" * 80)
    print("                    EVALUATION SUMMARY REPORT")
    print("=" * 80)
    print(f" Total Prompts Tested        : {len(test_cases)}")
    print(f" Handled by Intent Model    : {convo_routed} ({convo_routed/len(test_cases)*100:.1f}%) [70B Builder Saved]")
    print(f" Handled by 70B Builder      : {build_routed} ({build_routed/len(test_cases)*100:.1f}%)")
    print(f" Classification Accuracy     : {passed_count}/{len(test_cases)} ({passed_count/len(test_cases)*100:.1f}%)")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_diagnostics())
