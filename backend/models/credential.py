from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    # api_key | oauth2 | basic_auth | custom
    type = Column(String, nullable=False)
    # AES-encrypted JSON blob — never returned raw via API
    encrypted_data = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="credentials")
