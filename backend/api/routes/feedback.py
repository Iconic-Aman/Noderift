import resend
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from models.user import User
from api.deps import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackRequest(BaseModel):
    message: str
    rating: int | None = None  # optional 1-5 star rating


@router.post("/send")
async def send_feedback(
    body: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty.")

    if not settings.RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Resend not configured on server.")

    if not settings.FEEDBACK_TO_EMAIL:
        raise HTTPException(status_code=500, detail="Feedback recipient email not configured.")

    stars = ""
    if body.rating:
        stars = "⭐" * body.rating + f" ({body.rating}/5)"

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
      <div style="margin-bottom: 20px;">
        <span style="background: #1e3a5f; color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px;">
          ✦ Noderift Feedback
        </span>
      </div>

      {"<p style='font-size: 22px; margin-bottom: 16px;'>" + stars + "</p>" if stars else ""}

      <p style="font-size: 15px; color: #94a3b8; margin-bottom: 8px;">From</p>
      <p style="font-size: 15px; font-weight: 600; color: #e2e8f0; margin-bottom: 20px;">{user.email}</p>

      <p style="font-size: 15px; color: #94a3b8; margin-bottom: 8px;">Message</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">
        {body.message}
      </div>

      <p style="margin-top: 28px; font-size: 11px; color: #475569;">Sent via Noderift feedback system</p>
    </div>
    """

    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": settings.FEEDBACK_TO_EMAIL,
            "subject": f"[Noderift Feedback] from {user.email}" + (f" — {stars}" if stars else ""),
            "html": html_body,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send feedback: {str(e)}")

    return {"status": "sent", "message": "Thank you for your feedback!"}
