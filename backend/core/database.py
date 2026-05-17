from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings
import socket, re

def _ipv4_connect_args(url: str) -> dict:
    """Resolve hostname to IPv4 to avoid IPv6 routing failures."""
    m = re.search(r'@([^:/]+)', url)
    if m:
        try:
            return {"hostaddr": socket.getaddrinfo(m.group(1), None, socket.AF_INET)[0][4][0]}
        except Exception:
            pass
    return {}

SQLALCHEMY_DATABASE_URL = settings.db_url or "sqlite:///./noderift.db"

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else _ipv4_connect_args(SQLALCHEMY_DATABASE_URL)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
