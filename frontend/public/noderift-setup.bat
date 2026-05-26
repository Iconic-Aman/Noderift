@echo off
title Noderift Windows Setup
echo ==========================================
echo       Noderift Local Installer Setup
echo ==========================================
echo.

:: Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or running.
    echo Please install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker detected.
echo [INFO] Setting up local Noderift configuration...

:: Write docker-compose.yml dynamically
(
echo services:
echo   backend:
echo     image: iconicaman/noderift-backend:latest
echo     ports:
echo       - "8000:8000"
echo     environment:
echo       DATABASE_URL: "postgresql://postgres:postgres@db:5432/noderift"
echo       REDIS_URL: "redis://redis:6379/0"
echo     depends_on:
echo       - db
echo       - redis
echo.
echo   frontend:
echo     image: iconicaman/noderift-frontend:latest
echo     ports:
echo       - "3000:3000"
echo     depends_on:
echo       - backend
echo.
echo   db:
echo     image: postgres:15-alpine
echo     environment:
echo       POSTGRES_USER: postgres
echo       POSTGRES_PASSWORD: postgres
echo       POSTGRES_DB: noderift
echo     ports:
echo       - "5432:5432"
echo     volumes:
echo       - pgdata:/var/lib/postgresql/data
echo.
echo   redis:
echo     image: redis:7-alpine
echo     ports:
echo       - "6379:6379"
echo.
echo volumes:
echo   pgdata:
) > docker-compose.yml

echo [INFO] Starting Noderift local Docker environment...
docker compose up -d

echo.
echo ==========================================
echo [SUCCESS] Noderift is running locally!
echo.
echo Open your browser at: http://localhost:3000
echo ==========================================
echo.
pause
