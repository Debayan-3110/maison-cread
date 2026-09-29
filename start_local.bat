@echo off
echo ========================================================
echo Starting ShopCread E-Commerce Application (Localhost)
echo ========================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000...
start "ShopCread Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Frontend on http://127.0.0.1:5173...
start "ShopCread Frontend (Vite)" cmd /k "cd frontend && npx vite --host 127.0.0.1 --port 5173"

echo.
echo Both servers started!
echo Frontend URL: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo.
pause
