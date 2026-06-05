import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from core.database import SessionLocal
from models.user import User
from models.workflow import Workflow
from api.deps import get_current_user

# Setup TestClient
client = TestClient(app)


def test_chat():
    db = SessionLocal()
    user = None
    temp_user_created = False
    temp_workflow_created = False
    workflow = None
    try:
        # Get or create test user
        user = db.query(User).first()
        if not user:
            user = User(
                email="test_user@noderift.com",
                name="Test User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            temp_user_created = True
            print(f"Created temporary user: {user.email}")
        else:
            print(f"Using existing user: {user.email}")

        # Get or create test workflow
        workflow = db.query(Workflow).filter(Workflow.user_id == user.id).first()
        if not workflow:
            workflow = Workflow(
                user_id=user.id,
                name="Test Workflow",
                description="Temporary test workflow",
                graph={"nodes": [], "edges": []},
                is_active=False
            )
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
            temp_workflow_created = True
            print(f"Created temporary workflow: {workflow.id}")
        else:
            print(f"Using existing workflow: {workflow.id}")

        # Override get_current_user dependency to mock auth
        app.dependency_overrides[get_current_user] = lambda: user

        # Request payload
        payload = {
            "message": "Send a daily joke to email test@example.com",
            "current_graph": {"nodes": [], "edges": []},
            "node_catalog": []
        }

        # Call endpoint
        url = f"/api/workflows/{workflow.id}/ai/chat"
        print(f"Sending POST request to {url}...")
        response = client.post(url, json=payload)

        if response.status_code == 200:
            data = response.json()
            print("\n=== SUCCESS ===")
            print(f"Response Message: {data['message']['content']}")
            print(f"Proposal: {data['proposal']}")
        else:
            print(f"\n=== FAILED ===\nStatus: {response.status_code}\nDetail: {response.text}")

    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        # Cleanup temporary entries
        try:
            if temp_workflow_created and workflow:
                db.query(Workflow).filter(Workflow.id == workflow.id).delete()
                db.commit()
                print("Deleted temporary workflow.")
            if temp_user_created and user:
                db.query(User).filter(User.id == user.id).delete()
                db.commit()
                print("Deleted temporary user.")
        except Exception as clean_err:
            print(f"Cleanup error: {clean_err}")
            
        db.close()
        # Clear dependency overrides
        app.dependency_overrides.clear()


if __name__ == "__main__":
    test_chat()

