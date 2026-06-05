"""
create_tables.py — Run once to push all SQLAlchemy models to Supabase.

Usage (from backend/ directory):
    python create_tables.py
"""
import sys
import os

# Make sure backend/ is on the path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from core.config import settings

# Use DATABASE_URL (sync psycopg2 driver — no +asyncpg here)
db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
if not db_url:
    raise RuntimeError("DATABASE_URL is not set in .env")

if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")


print(f"Connecting to: {db_url.split('@')[-1]}")  # hide credentials in log

engine = create_engine(db_url, echo=True)

# Import Base + all models so metadata is populated
from core.database import Base  # noqa: E402  — Base must be imported first
import models  # noqa: E402  — registers all models via __init__.py

def main():
    print("\n=== Creating all tables ===\n")
    # Ensure pgvector extension is enabled
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    
    Base.metadata.create_all(bind=engine)


    # Verify by listing tables
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
        )
        tables = [row[0] for row in result]

    print("\n=== Tables in public schema ===")
    for t in tables:
        print(f"  ✅ {t}")
    print(f"\nDone. {len(tables)} table(s) found.")


if __name__ == "__main__":
    main()
