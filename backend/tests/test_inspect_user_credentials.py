# Diagnostic script to inspect credentials for ALL users in DB
import sys
import os
import json
from cryptography.fernet import Fernet

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from core.config import settings
from models.user import User
from models.credential import Credential


def inspect_all_user_credentials():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"📌 Total users in DB: {len(users)}")
        fernet = Fernet(settings.SECRET_KEY.encode())

        for u in users:
            creds = db.query(Credential).filter(Credential.user_id == u.id).all()
            print(f"\n==========================================")
            print(f"User ID: '{u.id}' | Email: '{u.email}' | Name: '{u.name}'")
            print(f"Stored Credentials Count: {len(creds)}")
            for idx, c in enumerate(creds, 1):
                print(f"   [{idx}] Name: '{c.name}' | Type: '{c.type}' | ID: '{c.id}'")
                try:
                    decrypted = json.loads(fernet.decrypt(c.encrypted_data.encode()).decode())
                    print(f"       -> Provider: {decrypted.get('provider')}, Email: {decrypted.get('email')}, Has Refresh Token: {bool(decrypted.get('refresh_token'))}")
                except Exception as err:
                    print(f"       -> Decryption error: {err}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    inspect_all_user_credentials()
