@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Starting Development Server on Port 3001
echo ========================================

echo.
echo [1/3] Checking for processes on port 3001...

REM Find and kill any process using port 3001
set PORT_FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 2^>nul') do (
    if "%%a" NEQ "" (
        echo [KILL] Found process %%a using port 3001, terminating...
        taskkill /PID %%a /F /t >nul 2>&1
        if !errorlevel! equ 0 (
            echo [SUCCESS] Process %%a terminated successfully
        ) else (
            echo [WARNING] Could not terminate process %%a
        )
        set PORT_FOUND=1
    )
)

if !PORT_FOUND! equ 0 (
    echo [INFO] No processes found on port 3001
)

echo.
echo [2/3] Waiting for port to be released...
timeout /t 3 /nobreak >nul

REM Verify port is free
netstat -aon | findstr :3001 >nul
if !errorlevel! equ 0 (
    echo [WARNING] Port 3001 still in use, attempting force cleanup...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
        taskkill /PID %%a /F /t >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo.
echo [3/3] Starting Next.js development server...
echo.
echo ========================================
echo Server will be available at:
echo - Local:   http://localhost:3001
echo - Network: http://192.168.1.8:3001
echo ========================================
echo.

REM Start Next.js directly without calling npm run dev again
REM Start the custom WebSocket-enabled server
npm run dev:server

