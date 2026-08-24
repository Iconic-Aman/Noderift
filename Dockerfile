# Stage 1: Build the frontend React app
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Create the unified backend + frontend + worker package
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and worker source code
COPY backend/ ./
COPY worker/ ./worker/

# Copy built frontend assets from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/dist/ ./static/

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i -e 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

CMD ["/bin/sh", "-c", "celery -A worker.worker.celery_app worker --loglevel=info & uvicorn main:app --host 0.0.0.0 --port 8000"]
