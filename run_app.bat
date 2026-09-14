@echo off
title Wardrobe Wonders Launcher
echo ===================================================
echo   Starting Wardrobe Wonders (DressR) Marketplace
echo ===================================================
echo.

echo [1/2] Starting Backend API Server (Port 4000)...
start "DressR Backend (Port 4000)" cmd /k "cd /d "%~dp0dress_rental_backend" && npm start"

echo [2/2] Starting Frontend Website (Port 5173)...
start "DressR Frontend (Port 5173)" cmd /k "cd /d "%~dp0dress_rental" && npm run dev"

echo.
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening application in default browser...
start http://localhost:5173/login

echo.
echo ===================================================
echo  Both servers are now running!
echo  Keep the two terminal windows open while testing.
echo ===================================================
