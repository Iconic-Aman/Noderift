from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uvicorn

from core.config import settings
from core.security import AuthMiddleware, bearer_scheme
from api.routes import auth, workflows, credentials, executions, websocket, webhooks, node_testing, ai, ai_planner, gmail_oauth, slack_oauth, files, feedback
from core.scheduler import scheduler_manager
from core.database import SessionLocal
import logging

logger = logging.getLogger("uvicorn")

app = FastAPI(
    title="Noderift API",
    description="Workflow automation platform — visual node editor with DAG execution engine.",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(workflows.router, prefix="/api", tags=["workflows"])
app.include_router(credentials.router, prefix="/api", tags=["credentials"])
app.include_router(executions.router, prefix="/api", tags=["executions"])
app.include_router(websocket.router, tags=["websockets"])
app.include_router(webhooks.router, prefix="/api", tags=["webhooks"])
app.include_router(node_testing.router, prefix="/api", tags=["nodes"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(ai_planner.router, prefix="/api", tags=["ai_planner"])
app.include_router(gmail_oauth.router, prefix="/api", tags=["gmail"])
app.include_router(slack_oauth.router, prefix="/api", tags=["slack"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])


@app.on_event("startup")
def startup_event():
    # Automatically create missing database tables on first boot
    from core.database import Base, engine
    import models
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Starting background scheduler...")
    scheduler_manager.start()
    db = SessionLocal()
    try:
        scheduler_manager.sync_triggers(db)
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    logger.info("Stopping background scheduler...")
    scheduler_manager.shutdown()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", tags=["root"], summary="Health check")
async def health():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": exc.detail,
                    "detail": None,
                }
            },
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "detail": exc.errors(),
                }
            },
        )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
                "detail": str(exc) if settings.ENVIRONMENT == "development" else None,
            }
        },
    )


from fastapi.staticfiles import StaticFiles
import os

# Mount AFTER all API routes so API takes priority, but root "/" falls through to static
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
