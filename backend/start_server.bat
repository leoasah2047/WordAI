@echo off
cd %~dp0
echo Installing dependencies...
pip install -r requirements.txt
echo Starting Backend Server...
python main.py
pause
