from celery import Celery
from core.config import settings

# Initialize Celery app
celery_app = Celery(
    "noderift",
    broker=settings.REDIS_URL or "redis://localhost:6379/0",
    backend=settings.REDIS_URL or "redis://localhost:6379/0",
)

# Optional Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Avoid picking up old tasks on restart
    task_reject_on_worker_lost=True,
    task_acks_late=True,
)

# Auto-discover tasks from worker folder or core files
celery_app.autodiscover_tasks(["worker", "core"])
