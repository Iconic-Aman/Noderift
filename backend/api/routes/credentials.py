from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from cryptography.fernet import Fernet

from core.database import get_db
from core.config import settings
from api.deps import get_current_user
from models.user import User
from models.credential import Credential
from schemas.credential import CredentialCreate, Credential as CredentialSchema
from core.security import bearer_scheme
#  add comment to test ci-cd
router = APIRouter(
    prefix="/credentials",
    tags=["credentials"],
    dependencies=[Depends(bearer_scheme)]
)

# SECRET_KEY must be a valid 32-url-safe-base64-encoded bytes key (Fernet format)
_fernet = Fernet(settings.SECRET_KEY.encode())


def _encrypt(data: dict) -> str:
    return _fernet.encrypt(json.dumps(data).encode()).decode()


def _decrypt(encrypted: str) -> dict:
    return json.loads(_fernet.decrypt(encrypted.encode()).decode())


@router.get("/", response_model=List[CredentialSchema])
def list_credentials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List credentials (no decrypted data returned)."""
    return db.query(Credential).filter(Credential.user_id == current_user.id).all()


@router.post("/", response_model=CredentialSchema, status_code=201)
def create_credential(body: CredentialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Store a new credential or update existing one. Data is AES-encrypted before save."""
    cred = db.query(Credential).filter(
        Credential.user_id == current_user.id,
        Credential.name == body.name,
        Credential.type == body.type,
    ).first()

    if cred:
        try:
            existing_data = _decrypt(cred.encrypted_data)
        except Exception:
            existing_data = {}
        # Merge: new fields override old, but old fields (like api_key) persist if not provided
        merged_data = {**existing_data, **body.data}
        cred.encrypted_data = _encrypt(merged_data)
    else:
        cred = Credential(
            user_id=current_user.id,
            name=body.name,
            type=body.type,
            encrypted_data=_encrypt(body.data),
        )
        db.add(cred)

    db.commit()
    db.refresh(cred)
    return cred


@router.delete("/{credential_id}", status_code=204)
def delete_credential(credential_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a credential."""
    cred = db.query(Credential).filter(Credential.id == credential_id, Credential.user_id == current_user.id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    db.delete(cred)
    db.commit()
