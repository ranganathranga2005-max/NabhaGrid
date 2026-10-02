@echo off
title Aegis-Orbit Satellite RFI Simulation Control
echo ========================================================================
echo    Launching Aegis-Orbit Satellite RFI Simulation Control...
echo ========================================================================
python main.py
if errorlevel 1 (
    echo.
    echo Simulation exited with an error. Press any key to close.
    pause >nul
)
