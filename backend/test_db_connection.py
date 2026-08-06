# Test script to verify Supabase PostgreSQL connection and query workflows
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.workflow import Workflow
from sqlalchemy import text


def test_db():
    db = SessionLocal()
    try:
        # Test basic connection
        result = db.execute(text("SELECT 1")).scalar()
        print(f"✅ Supabase connection test successful: SELECT 1 = {result}")

        # Query workflow table
        count = db.query(Workflow).count()
        print(f"✅ Supabase query test successful: Total workflows in DB = {count}")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
    finally:
        local_close(db)


def local_close(db):
    db.close()


if __name__ == "__main__":
    test_db()
