@echo off
REM Crypto data update script - runs R fetch + Python processing
REM Scheduled via Windows Task Scheduler every 1 hour

cd /d "%~dp0\.."
echo [%date% %time%] Starting crypto data update... >> data\update_log.txt

REM Run the Python pipeline (which calls R internally)
"%~dp0\..\venv\Scripts\python.exe" "%~dp0\process_crypto_data.py" >> data\update_log.txt 2>&1

echo [%date% %time%] Update complete. >> data\update_log.txt
echo. >> data\update_log.txt
