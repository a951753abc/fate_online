@echo off
title fate-online dev launcher

echo Starting Docker containers (Redis + PostgreSQL)...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait redis postgres
if errorlevel 1 (
  echo [ERROR] Docker containers failed to start. Is Docker running?
  pause
  exit /b 1
)
echo Docker containers ready.
echo.

echo Starting dev servers...
start "fate-server :3000" cmd /k "cd /d %~dp0 && npm run dev"
start "fate-client :5173" cmd /k "cd /d %~dp0 && npm run client:dev"
echo.
echo   Docker:  redis :6379, postgres :5432
echo   Server:  http://localhost:3000
echo   Client:  http://localhost:5173
echo.
echo Servers launched in separate windows.
echo To add bots:  npm run dev:bots -- --code YOUR_CODE --bots 3
