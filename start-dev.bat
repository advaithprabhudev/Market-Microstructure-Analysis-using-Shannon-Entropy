@echo off
echo Starting Market Microstructure Analysis Framework...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
start "MMM Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"
start "MMM Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Both services started in separate windows.
pause
