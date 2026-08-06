# Test script to inspect database users, credentials, and verify Gmail OAuth mappings
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.user import User
from models.credential import Credential
from services.gmail_service import get_user_gmail_credential


def check_db_credentials():
    db = SessionLocal()
    try:
        print("=== USERS TABLE ===")
        users = db.query(User).all()
        for u in users:
            print(f"User ID: '{u.id}' | Email: '{u.email}' | Name: '{u.name}'")

        print("\n=== CREDENTIALS TABLE ===")
        creds = db.query(Credential).all()
        for c in creds:
            print(f"Cred ID: '{c.id}' | User ID: '{c.user_id}' | Name: '{c.name}' | Type: '{c.type}'")
            gmail_cred = get_user_gmail_credential(db, c.user_id)
            print(f"   -> decrypted Gmail credential for User ID '{c.user_id}': {bool(gmail_cred)}")

    except Exception as e:
        print(f"❌ DB check failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    check_db_credentials()
