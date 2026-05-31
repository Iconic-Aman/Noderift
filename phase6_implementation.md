
# Phase 6 Agentic Workflow Builder Plan

## Summary

Build Phase 6 as a phased agent system: first a reusable AI backend with chat memory and provider abstraction, then expose it through both an AI Agent node and the AI chat builder.

The first version supports OpenAI-compatible APIs such as NVIDIA by letting users save an API key as a credential, enter a model name, and configure a base URL.

## Key Changes

- Add a generic LLM provider layer using an OpenAI-compatible chat-completions contract.
- Provider inputs: `credential_id`, `base_url`, `model`, `temperature`, and messages.
- The selected credential stores the provider API key.
- Default assumption: "any API" means any OpenAI-compatible API first; non-compatible providers become later adapters.

## Chat Memory

- Add workflow-scoped assistant history.
- Add `ai_chat_sessions` for user, workflow, title, created timestamp, and updated timestamp.
- Add `ai_chat_messages` for session, role, content, metadata, and created timestamp.
- This gives "memory like this chat" without pgvector in v1.

## Backend API

- Add `GET /api/workflows/{workflow_id}/ai/messages`.
- Add `POST /api/workflows/{workflow_id}/ai/chat`.
- Chat endpoint receives user message plus provider config, stores conversation, and returns assistant message plus optional workflow edit proposal.

## AI Agent Node

- Add `AiAgentNode`.
- Node config: provider credential, base URL, model name, system prompt, task prompt, and temperature.
- During workflow execution, the node receives upstream data, calls the LLM, and outputs structured result downstream.
- Register node type as `ai_agent`.
- Keep existing OpenAI/Claude template nodes locked or replace them with one generic AI Agent node.

## AI Chat Builder UI

- Replace the current "coming soon" bubble with a right-side chat panel.
- The user can ask for workflows in natural language, such as "send WhatsApp message every day at 6 PM".
- The assistant can propose canvas changes using existing node templates and the current workflow graph.
- The user must apply, save, and run the workflow manually; chat does not directly execute external send actions in v1.

## Agent Behavior

- The chat builder can inspect the current workflow graph, available node templates, and saved credentials list.
- It should create or edit workflow nodes using existing capabilities: schedule, webhook, HTTP, WhatsApp, Composio, filter, merge, loop, set variable, code, and browser automation.
- If required credentials are missing, it should explain what connection or credential is needed instead of inventing values.
- It should output a clear workflow patch proposal: nodes to add, edges to connect, and config fields to fill.

## Test Plan

- Unit test provider client with mocked OpenAI-compatible responses.
- Test chat memory create/list flow per workflow and per user.
- Test AI chat can propose a schedule plus WhatsApp node from a natural-language request.
- Test missing credential path: assistant asks user to add or select credential.
- Test `AiAgentNode` in `/api/nodes/test` with mocked LLM response.
- Test full workflow execution: upstream data to AI Agent node to downstream Set Variable or HTTP node.
- Manually test frontend: open editor, chat with assistant, apply proposed graph, save, and run.

## Assumptions

- First version supports OpenAI-compatible providers, including NVIDIA-style APIs, through `base_url`, `model`, and credential.
- Chat memory is regular database chat history, not pgvector semantic memory yet.
- Agent chat creates or edits workflows but does not auto-run external send actions.
- Existing nodes remain the source of truth for real actions; the agent orchestrates them instead of replacing them.
