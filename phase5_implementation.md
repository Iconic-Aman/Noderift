# Phase 5 Implementation Guide — Integrations

This document tracks the steps for integrating Composio, Playwright, logic nodes (Filter, Merge, Loop, Set Variable), credentials mapping, and a live node-testing endpoint.

---

## 1. Node Types & Classes Added

| Node Type | Class Name | Function |
| :--- | :--- | :--- |
| `composio` | `ComposioNode` | Trigger connected app actions via Composio API |
| `playwright` | `PlaywrightNode` | Execute head-less browser automation flows |
| `filter` | `FilterNode` | Assess conditional branching |
| `merge` | `MergeNode` | Aggregate multiple data streams |
| `loop` | `LoopNode` | Run list iteration |
| `set_variable` | `SetVariableNode` | Add variable mapping to execution context |

---

## 2. API Node Testing Endpoint

- **Endpoint**: `POST /api/nodes/test`
- **Request Body**:
  ```json
  {
    "node_type": "http_request",
    "config": { "url": "https://api.github.com", "method": "GET" },
    "inputs": {}
  }
  ```
- **Response**: Returns standard execution logging (duration, status, output data).

---

## 3. UI Credentials Binding

- Allow any action node to link with an existing vault credential.
- Resolve and decrypt the credentials on the backend within `dag_runner.py` before execution starts.
- Pass decrypted values securely into the active node context.

---

## 4. Playwright Setup

Ensure the virtual environment has Playwright installed:
```bash
pip install playwright
playwright install chromium
```
This enables async scraping directly inside workflows.
