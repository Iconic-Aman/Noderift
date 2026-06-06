import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal, Base, engine
from models.node_vector import NodeEmbedding, WorkflowExampleEmbedding
from core.embeddings import get_embedding


NODE_TEMPLATES = [
    {
        "node_type": "webhook",
        "label": "Webhook",
        "description": "Trigger workflow via HTTP webhook POST/GET/PUT/DELETE request",
        "schema_json": {
            "id": "webhook",
            "label": "Webhook",
            "category": "triggers",
            "configFields": [
                {"name": "method", "label": "HTTP Method", "type": "select"},
                {"name": "path", "label": "Path", "type": "text"}
            ]
        }
    },
    {
        "node_type": "schedule",
        "label": "Schedule",
        "description": "Run workflow on a schedule, cron expression, trigger periodically",
        "schema_json": {
            "id": "schedule",
            "label": "Schedule",
            "category": "triggers",
            "configFields": [
                {"name": "cron", "label": "Cron Expression", "type": "text"},
                {"name": "timezone", "label": "Timezone", "type": "text"}
            ]
        }
    },
    {
        "node_type": "slack",
        "label": "Slack",
        "description": "Send a chat message or notification to a Slack channel",
        "schema_json": {
            "id": "slack",
            "label": "Slack",
            "category": "actions",
            "configFields": [
                {"name": "channel", "label": "Channel", "type": "text"},
                {"name": "message", "label": "Message", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "http",
        "label": "HTTP Request",
        "description": "Make HTTP request to any external endpoint, API, GET, POST, PUT, DELETE",
        "schema_json": {
            "id": "http",
            "label": "HTTP Request",
            "category": "actions",
            "configFields": [
                {"name": "url", "label": "URL", "type": "text"},
                {"name": "method", "label": "Method", "type": "select"},
                {"name": "headers", "label": "Headers (JSON)", "type": "textarea"},
                {"name": "body", "label": "Body (JSON)", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "code",
        "label": "Code",
        "description": "Run custom Python code to extract, transform, parse, format, or process data",
        "schema_json": {
            "id": "code",
            "label": "Code",
            "category": "actions",
            "configFields": [
                {"name": "code", "label": "Python Code", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "resend",
        "label": "Resend",
        "description": "Send an email via Resend API",
        "schema_json": {
            "id": "resend",
            "label": "Resend",
            "category": "actions",
            "configFields": [
                {"name": "from", "label": "From", "type": "text"},
                {"name": "to", "label": "To", "type": "text"},
                {"name": "subject", "label": "Subject", "type": "text"},
                {"name": "body", "label": "Body", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "whatsapp",
        "label": "WhatsApp",
        "description": "Send WhatsApp message to phone number",
        "schema_json": {
            "id": "whatsapp",
            "label": "WhatsApp",
            "category": "actions",
            "configFields": [
                {"name": "phone", "label": "Phone Number", "type": "text"},
                {"name": "message", "label": "Message", "type": "textarea"},
                {"name": "credential_id", "label": "Credential", "type": "credential"}
            ]
        }
    },
    {
        "node_type": "ai_agent",
        "label": "AI Agent",
        "description": "Run AI agent with system prompt and task prompt",
        "schema_json": {
            "id": "ai_agent",
            "label": "AI Agent",
            "category": "ai",
            "configFields": [
                {"name": "model", "label": "Model Name", "type": "text"},
                {"name": "system_prompt", "label": "System Prompt", "type": "textarea"},
                {"name": "prompt", "label": "Task Prompt", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "filter",
        "label": "Filter",
        "description": "Filter data or branch based on conditions",
        "schema_json": {
            "id": "filter",
            "label": "Filter",
            "category": "logic",
            "configFields": [
                {"name": "condition", "label": "Condition", "type": "text"}
            ]
        }
    },
    {
        "node_type": "merge",
        "label": "Merge",
        "description": "Merge multiple branches or inputs",
        "schema_json": {
            "id": "merge",
            "label": "Merge",
            "category": "logic",
            "configFields": [
                {"name": "mode", "label": "Mode", "type": "select"}
            ]
        }
    },
    {
        "node_type": "loop",
        "label": "Loop",
        "description": "Iterate over an array of items",
        "schema_json": {
            "id": "loop",
            "label": "Loop",
            "category": "logic",
            "configFields": [
                {"name": "items", "label": "Items", "type": "text"}
            ]
        }
    },
    {
        "node_type": "set_variable",
        "label": "Set Variable",
        "description": "Store a variable in execution state for downstream use",
        "schema_json": {
            "id": "set_variable",
            "label": "Set Variable",
            "category": "logic",
            "configFields": [
                {"name": "name", "label": "Variable Name", "type": "text"},
                {"name": "value", "label": "Value", "type": "text"}
            ]
        }
    },
    {
        "node_type": "playwright",
        "label": "Playwright",
        "description": "Run Playwright web scraper / browser automation script",
        "schema_json": {
            "id": "playwright",
            "label": "Playwright",
            "category": "actions",
            "configFields": [
                {"name": "script", "label": "Automation Script", "type": "textarea"}
            ]
        }
    },
    {
        "node_type": "composio",
        "label": "Composio",
        "description": "Execute Composio action or integration",
        "schema_json": {
            "id": "composio",
            "label": "Composio",
            "category": "actions",
            "configFields": [
                {"name": "action", "label": "Action", "type": "text"},
                {"name": "params", "label": "Parameters (JSON)", "type": "textarea"}
            ]
        }
    }
]

WORKFLOW_EXAMPLES = [
    {
        "name": "Daily Joke Emailer",
        "description": "Every day, fetch a random joke from an API and send it as an email using Resend.",
        "workflow_json": {
            "nodes": [
                {"id": "schedule-1", "type": "schedule", "config": {"cron": "0 17 * * *", "timezone": "Asia/Kolkata"}},
                {"id": "http-1", "type": "http", "config": {"url": "https://official-joke-api.appspot.com/random_joke", "method": "GET"}},
                {"id": "resend-1", "type": "resend", "config": {"from": "onboarding@resend.dev", "to": "user@example.com", "subject": "Daily Joke"}}
            ],
            "edges": [
                {"source": "schedule-1", "target": "http-1"},
                {"source": "http-1", "target": "resend-1"}
            ]
        }
    },
    {
        "name": "Webhook Slack Notifier",
        "description": "Trigger a workflow via an incoming HTTP Webhook POST, then post the message content directly to a Slack channel.",
        "workflow_json": {
            "nodes": [
                {"id": "webhook-1", "type": "webhook", "config": {"method": "POST", "path": "slack-alert"}},
                {"id": "slack-1", "type": "slack", "config": {"channel": "#general", "message": "Received alert: {{body}}"}}
            ],
            "edges": [
                {"source": "webhook-1", "target": "slack-1"}
            ]
        }
    }
]


async def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding Node Embeddings...")
        for node in NODE_TEMPLATES:
            db.query(NodeEmbedding).filter(NodeEmbedding.node_type == node["node_type"]).delete()
            text_to_embed = f"{node['label']}: {node['description']}"
            print(f"Generating embedding for {node['node_type']}...")
            embedding = await get_embedding(text_to_embed, input_type="passage")
            db_node = NodeEmbedding(
                node_type=node["node_type"],
                label=node["label"],
                description=node["description"],
                schema_json=node["schema_json"],
                embedding=embedding
            )
            db.add(db_node)
        
        print("\nSeeding Workflow Example Embeddings...")
        for ex in WORKFLOW_EXAMPLES:
            db.query(WorkflowExampleEmbedding).filter(WorkflowExampleEmbedding.name == ex["name"]).delete()
            text_to_embed = f"{ex['name']}: {ex['description']}"
            print(f"Generating embedding for workflow example '{ex['name']}'...")
            embedding = await get_embedding(text_to_embed, input_type="passage")
            db_ex = WorkflowExampleEmbedding(
                name=ex["name"],
                description=ex["description"],
                workflow_json=ex["workflow_json"],
                embedding=embedding
            )
            db.add(db_ex)
            
        db.commit()
        print("Successfully seeded all embeddings!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed())

