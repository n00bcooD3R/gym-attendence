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
npm run dev
echo.
echo If server shut down unexpectedly, press any key to restart.
pause
