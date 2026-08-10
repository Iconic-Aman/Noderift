import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.embeddings import get_embedding
from core.database import SessionLocal
from models.node_vector import NodeEmbedding


async def main():
    db = SessionLocal()
    try:
        print("1. Testing NVIDIA Embeddings API...")
        text_passage = "Webhook: Trigger workflow via HTTP webhook POST request"
        passage_emb = await get_embedding(text_passage, input_type="passage")
        print(f"   Success! Passage embedding size: {len(passage_emb)}")

        # Delete any existing test webhook nodes
        db.query(NodeEmbedding).filter(NodeEmbedding.node_type == "test_webhook").delete()
        db.commit()

        print("2. Inserting test node embedding...")
        test_node = NodeEmbedding(
            node_type="test_webhook",
            label="Test Webhook Trigger",
            description="Trigger workflow via HTTP webhook POST request",
            schema_json={
                "id": "test_webhook",
                "label": "Test Webhook",
                "category": "triggers",
                "configFields": []
            },
            embedding=passage_emb
        )
        db.add(test_node)
        db.commit()
        print("   Success! Test node embedding inserted.")

        print("3. Querying with vector similarity search...")
        query_text = "HTTP trigger"
        query_emb = await get_embedding(query_text, input_type="query")
        
        # Query closest matches using cosine distance
        results = db.query(
            NodeEmbedding,
            NodeEmbedding.embedding.cosine_distance(query_emb).label("distance")
        ).order_by("distance").limit(1).all()

        if results:
            node, distance = results[0]
            print(f"   Success! Found nearest node:")
            print(f"     - Label: {node.label}")
            print(f"     - Node Type: {node.node_type}")
            print(f"     - Description: {node.description}")
            print(f"     - Cosine Distance: {distance:.4f}")
        else:
            print("   Error: No nodes found in database.")

        # # Clean up
        # db.query(NodeEmbedding).filter(NodeEmbedding.node_type == "test_webhook").delete()
        # db.commit()
        # print("4. Clean up complete.")

    except Exception as e:
        db.rollback()
        print(f"Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
