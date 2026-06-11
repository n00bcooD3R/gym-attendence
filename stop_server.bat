@echo off
title Stop Gym Attendance Server
echo ========================================================
echo        Gym Attendance Server Shutdown Script
echo ========================================================
echo.
echo Finding process running on port 3000...
set "found="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process PID %%a...
    taskkill /f /pid %%a
    set found=1
)

if not defined found (
    echo No active server found running on port 3000.
) else (
    echo Server stopped successfully.
)
echo.
pause
