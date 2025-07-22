# 強化學習 Grid World 平台

## 專案簡介
本專案為強化學習（Q-Learning、SARSA）於 Grid World 環境的互動學習平台，支援地圖自訂、Q-Table/Log 輸出與學習曲線分析。

## 前端（React）專案啟動方法
1. 進入 frontend 資料夾：
   ```bash
   cd frontend
   ```
2. 安裝前端套件：
   ```bash
   npm install
   ```
3. 啟動前端開發伺服器：
   ```bash
   npm start
   ```
4. 在瀏覽器開啟 http://localhost:3000 查看前端介面

## 執行流程
1. 建立並啟動虛擬環境
2. 安裝必要套件
3. 執行 q_learning.py 或 sarsa.py 進行訓練
4. 執行 analyze.py 產生學習曲線圖

## 常用終端機指令
```bash
python -m venv venv
.\venv\Scripts\Activate
pip install numpy pandas matplotlib
pip freeze > requirements.txt
python q_learning.py
python sarsa.py
python analyze.py

 uvicorn main:app --reload
```

## 產出說明
- output/q_table.csv、output/log.csv：Q-Learning 訓練結果
- output/sarsa_q_table.csv、output/sarsa_log.csv：SARSA 訓練結果
- output/learning_curve.png：學習曲線圖

## 範例圖
output/learning_curve.png

## 常見問題
- 執行前請確認已啟動虛擬環境並安裝所有套件
- 若遇到 import error，請重新安裝 requirements.txt 內所有套件
- 地圖格式請參考 maps/README.md

## 如何透過 API 進行 AI 訓練

1. 啟動訓練 API 服務：
   ```bash
   uvicorn train_api:app --reload
   ```
2. 開啟 Swagger UI：
   在瀏覽器輸入 http://127.0.0.1:8000/docs
3. 使用 POST /train 啟動訓練：
   - 點「Try it out」
   - 在 Request body 輸入：
     ```json
     {
       "map_id": "<地圖id>",
       "algorithm": "q_learning",
       "episodes": 100,
       "learning_rate": 0.1,
       "discount_factor": 0.95,
       "epsilon": 0.1
     }
     ```
   - 按「Execute」，回傳 job_id
4. 查詢訓練狀態：
   - 用 GET /train/{job_id}/status 查詢進度
5. 查詢訓練結果：
   - 用 GET /train/{job_id}/result 取得 q_table.csv、log.csv

> 注意：訓練腳本（q_learning.py、sarsa.py）需支援命令列參數（--map、--episodes、--learning_rate、--discount_factor、--epsilon、--output），並將結果輸出到指定 jobs/{job_id}/ 目錄。

---
如需進階功能或有任何問題，歡迎提出！ 