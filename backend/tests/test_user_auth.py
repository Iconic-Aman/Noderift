import sys
import os
from uuid import uuid4
from fastapi.testclient import TestClient


sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from core.database import SessionLocal
from models.user import User
from core.security import hash_password, verify_password

client = TestClient(app)


def test_password_hashing():
    pwd = "supersecretpassword123"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2:sha256:")
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(pwd, "") is False


def test_register_login_flow():
    unique_suffix = str(uuid4())[:8]
    test_username = f"testuser_{unique_suffix}"
    test_email = f"testuser_{unique_suffix}@example.com"
    test_password = "password12345"

    db = SessionLocal()
    try:
        # 1. Register new user
        reg_res = client.post(
            "/api/auth/register",
            json={
                "username": test_username,
                "email": test_email,
                "password": test_password,
                "name": "Test User",
            },
        )
        assert reg_res.status_code == 200, reg_res.text
        data = reg_res.json()
        assert data["status"] == "success"
        assert "token" in data
        user_id = data["token"]
        assert data["user"]["username"] == test_username
        assert data["user"]["email"] == test_email

        # 2. Duplicate username registration should fail
        dup_res = client.post(
            "/api/auth/register",
            json={
                "username": test_username,
                "password": "anotherpassword",
            },
        )
        assert dup_res.status_code == 400

        # 3. Login with username
        login_res = client.post(
            "/api/auth/login",
            json={
                "username": test_username,
                "password": test_password,
            },
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert login_data["token"] == user_id
        assert login_data["user"]["username"] == test_username

        # 4. Login with email
        login_email_res = client.post(
            "/api/auth/login",
            json={
                "username": test_email,
                "password": test_password,
            },
        )
        assert login_email_res.status_code == 200
        assert login_email_res.json()["token"] == user_id

        # 5. Login with invalid password fails
        bad_pwd_res = client.post(
            "/api/auth/login",
            json={
                "username": test_username,
                "password": "wrongpassword",
            },
        )
        assert bad_pwd_res.status_code == 401

        # 6. Test /api/auth/me with Bearer token
        me_res = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {user_id}"},
        )
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["id"] == user_id
        assert me_data["username"] == test_username
        assert me_data["email"] == test_email

    finally:
        # Cleanup
        db.query(User).filter(User.username == test_username).delete()
        db.commit()
        db.close()


if __name__ == "__main__":
    print("Running test_password_hashing...")
    test_password_hashing()
    print("test_password_hashing PASSED [OK]")
    print("Running test_register_login_flow...")
    test_register_login_flow()
    print("test_register_login_flow PASSED [OK]")
    print("\nALL AUTH TESTS PASSED! [SUCCESS]")


