@echo off
echo 啟動強化學習平台後端服務...
echo.

REM 檢查虛擬環境是否存在
if not exist "venv\Scripts\Activate.bat" (
    echo 錯誤：虛擬環境不存在，請先執行以下命令：
    echo python -m venv venv
    echo .\venv\Scripts\Activate
    echo pip install -r requirements.txt
    pause
    exit /b 1
)

REM 啟動虛擬環境
call venv\Scripts\Activate.bat

REM 檢查必要套件
echo 檢查必要套件...
python -c "import uvicorn, fastapi, python_multipart" 2>nul
if errorlevel 1 (
    echo 安裝必要套件...
    pip install -r requirements.txt
)

REM 啟動後端服務
echo 啟動後端服務...
echo 服務將運行在：http://localhost:8000
echo 按 Ctrl+C 停止服務
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause 