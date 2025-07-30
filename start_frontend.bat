@echo off
echo 啟動強化學習平台前端服務...
echo.

REM 檢查前端目錄是否存在
if not exist "frontend" (
    echo 錯誤：前端目錄不存在
    pause
    exit /b 1
)

REM 進入前端目錄
cd frontend

REM 檢查 node_modules 是否存在
if not exist "node_modules" (
    echo 安裝前端套件...
    npm install
)

REM 啟動前端服務
echo 啟動前端服務...
echo 服務將運行在：http://localhost:3000
echo 按 Ctrl+C 停止服務
echo.
npm start

pause 