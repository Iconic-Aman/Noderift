from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uvicorn

from core.config import settings
from core.security import AuthMiddleware, bearer_scheme
from api.routes import auth, workflows, credentials

app = FastAPI(
    title="Noderift API",
    description="Workflow automation platform — visual node editor with DAG execution engine.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    root_path="/api"
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

app.include_router(auth.router, prefix= "/api", tags=["auth"])
app.include_router(workflows.router, prefix= "/api", tags=["workflows"])
app.include_router(credentials.router, prefix= "/api", tags=["credentials"])


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", tags=["root"], summary="Root")
async def root():
    return {
        "service": "noderift-api",
        "status": "ok",
        "version": "0.1.0",
        "docs": "/docs",
    }


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
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
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


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
