# Test script to verify Gmail OAuth credentials and live Gmail API email fetching
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.user import User
from services.gmail_service import get_user_gmail_credential, refresh_access_token, fetch_gmail_messages


async def test_gmail_live():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("❌ No user found in database.")
            return

        print(f"📌 Checking Gmail credentials for User ID: {user.id} ({user.email})")
        cred = get_user_gmail_credential(db, user.id)

        if not cred:
            print("⚠️ No Gmail credential stored in database yet.")
            print(f"👉 Please open this URL in browser to connect Gmail:")
            print(f"   http://localhost:8000/api/oauth/gmail/start?user_id={user.id}")
            return

        print(f"✅ Gmail Credential found for email: {cred.get('email')}")
        refresh_token = cred.get("refresh_token")
        if not refresh_token:
            print("❌ Refresh token missing from credential blob.")
            return

        print("🔑 Refreshing Google Access Token...")
        access_token = await refresh_access_token(refresh_token)
        print("✅ Access token refreshed successfully!")

        print("\n📬 Fetching emails (query='from:student@internshala.com')...")
        emails = await fetch_gmail_messages(access_token, query="from:student@internshala.com", max_results=5)
        print(f"✅ Successfully fetched {len(emails)} emails!")

        for idx, email in enumerate(emails, 1):
            print(f"\n--- Email #{idx} ---")
            print(f"From: {email.get('from')}")
            print(f"Subject: {email.get('subject')}")
            print(f"Date: {email.get('date')}")
            print(f"Snippet: {email.get('snippet')[:80]}...")
            print(f"Body length: {len(email.get('body', ''))} characters")

    except Exception as e:
        print(f"❌ Gmail test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_gmail_live())
