@echo off
title Artist Gallery Launcher
color 0A

echo.
echo ============================================
echo    AI Artist Gallery Launcher
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

REM Check if artists folder exists
if not exist "artists\" (
    echo WARNING: 'artists' folder not found
    echo Creating 'artists' folder...
    mkdir artists
    echo.
    echo Please add your PNG images to the 'artists' folder
    echo Images should follow the naming pattern: __artist_NAME__
    echo.
)

echo Starting gallery server...
echo.

REM Start server in minimized window
start /min "Artist Gallery Server" cmd /c "node server.js"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:3456/gallery.html

echo.
echo ============================================
echo  Gallery is now running!
echo  URL: http://localhost:3456
echo ============================================
echo.
echo To stop the server:
echo 1. Find the minimized "Artist Gallery Server" window
echo 2. Press Ctrl+C in that window
echo.
echo Or simply close this window when you're done.
echo.
pause
