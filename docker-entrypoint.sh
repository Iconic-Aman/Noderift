#!/bin/bash
echo "Starting Celery worker in background..."
celery -A worker.worker.celery_app worker --loglevel=info &

echo "Starting Noderift API on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000
