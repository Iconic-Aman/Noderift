from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from pathlib import Path

router = APIRouter(tags=["legal"])

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent


def _read_doc(filename: str) -> str:
    path = _ROOT_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return f"{filename} not found."


@router.get("/privacy", response_class=PlainTextResponse)
@router.get("/legal/privacy", response_class=PlainTextResponse)
def get_privacy_policy():
    """Return privacy policy document."""
    return _read_doc("privacy-policy.md")


@router.get("/terms", response_class=PlainTextResponse)
@router.get("/legal/terms", response_class=PlainTextResponse)
def get_terms_of_service():
    """Return terms of service document."""
    return _read_doc("terms-of-service.md")
