@echo off
title Gym Attendance Server - eSSL Integrator
echo ========================================================
echo        Gym Attendance Server Startup Script
echo ========================================================
echo.
echo [1/2] Checking network IP address...
ipconfig | findstr /i "IPv4"
echo.
echo [2/2] Launching Gym Attendance Web App...
cd /d "c:\Users\aroma\Desktop\ssl\gym-attendance"
:: Open browser in background after 3 seconds
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:run_server
echo Starting Next.js Dev Server at %date% %time%...
call npm run dev
echo.
echo WARNING: Server process exited! Restarting in 5 seconds...
timeout /t 5 >nul
goto run_server
