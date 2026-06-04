# AI Workflow Chatbot — Architecture & RAG Design

This document explains why we need a RAG (Retrieval-Augmented Generation) system and a Vector Database (`pgvector`) for our AI Workflow Chatbot, how it works, and the tech stack required.

---

## 1. Why Do We Need RAG & pgvector?

Currently, the chatbot gets the entire list of available nodes and the current workflow graph stuffed directly into the LLM system prompt.

While this works for 5–10 basic nodes, it breaks at scale:

1. **Prompt Bloat & Cost**: Putting detailed schemas, fields, descriptions, and connection rules for hundreds of nodes (like Composio apps, WhatsApp triggers, Playwright actions) into every chat message wastes thousands of tokens.
2. **Context Confusion**: When the LLM is flooded with too many options, it gets confused, hallucinate configs, and fails to build accurate connections.
3. **Execution Rules & Examples**: To make the chatbot "smart" enough to modify existing workflows or build complex logic (like Loops and Filters), it needs to see real-world workflow JSON templates. Storing these templates in a database and retrieving them via RAG is the only way to scale.

### How RAG Solves This:

When you ask the chatbot: *"Fetch a joke and send it to ice.age.2442@gmail.com at 5 PM"*

1. **Semantic Search (RAG)**: The chatbot queries the vector database using your prompt.
2. **Smart Retrieval**: It retrieves only the relevant nodes (e.g., `Schedule`, `HTTP Request`, `Resend`) and successful connection examples from the database.
3. **Clean Prompting**: It injects *only* these relevant specs into the LLM, making the chatbot highly accurate, fast, and extremely cost-effective.

---

## 2. Tech Stack for AI Workflow Chatbot

To build a chatbot that can reason, design, connect, and iteratively modify workflows, we need the following stack:

| Technology                         | Role                 | Description                                                                                                                                            |
| :--------------------------------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pgvector**                 | Vector Storage       | A PostgreSQL extension that stores vector embeddings of our node specs, schemas, and workflow examples. No external Vector DB needed!                  |
| **FastAPI + SQLAlchemy**     | Backend Core         | Handles vector search queries using SQL operators (`<=>` cosine distance) via pgvector.                                                              |
| **LangChain / LangGraph**    | Agentic Reasoning    | Chained reasoning steps: (1) analyze current graph, (2) retrieve nodes from pgvector, (3) generate a JSON edit proposal, (4) self-correct connections. |
| **NVIDIA Embeddings API**    | Embedding Generation | Converts natural language specs and user prompts into vector representations (coordinates) for search.                                                 |
| **JSON Merge Patch / Diffs** | Graph Modification   | Logic that allows the LLM to output precise changes (add, modify, delete) to the*existing* React Flow graph instead of rebuilding it from scratch.   |

---

## 3. How the "Thinking" Workflow Chatbot Operates

```
 [User Prompt] 
 "Add a filter after the HTTP node to check if the joke is clean"
       │
       ▼
 [Embedding Model] ──► Convert prompt to coordinates
       │
       ▼
 [pgvector DB] ──────► Retrieve: 1. Filter Node schema
                       2. Loop/Filter connection examples
       │
       ▼
 [LLM Agent] ────────► Receives: 1. Retrieved specs
                       2. Current canvas JSON graph
       │
       ▼
 [JSON Edit Proposal]► Outputs exact React Flow diff:
                       - Add node: "filter-1"
                       - Delete edge: "http-1 -> resend-1"
                       - Add edges: "http-1 -> filter-1", "filter-1 -> resend-1"
```

---

## 4. Key Benefits of This Architecture

- **Infinite Nodes**: We can add 1,000+ app connectors without slowing down the chatbot.
- **Iterative Edits**: The chatbot understands the context of what you currently have on the canvas and modifies it step-by-step.
- **Bulletproof Configurations**: Accurate fields and defaults are retrieved directly from the indexed node documentation.
