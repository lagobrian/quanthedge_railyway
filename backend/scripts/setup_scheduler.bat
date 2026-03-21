@echo off
REM Sets up a Windows Task Scheduler task to run crypto data updates every hour
REM Run this script as Administrator

schtasks /create /tn "QuantHedge_CryptoUpdate" /tr "\"%~dp0update_crypto.bat\"" /sc hourly /mo 1 /f /rl HIGHEST

if %errorlevel% equ 0 (
    echo Task scheduler created successfully!
    echo Task name: QuantHedge_CryptoUpdate
    echo Frequency: Every 1 hour
    echo Script: %~dp0update_crypto.bat
) else (
    echo Failed to create task. Please run this script as Administrator.
)
pause
