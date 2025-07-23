# 強化學習 Grid World 平台

## 專案簡介
本專案為強化學習（Q-Learning、SARSA）於 Grid World 環境的互動學習平台，支援地圖自訂、Q-Table/Log 輸出與學習曲線分析。

## 完整專案啟動流程

### 1. 環境設定
```bash
# 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows:
.\venv\Scripts\Activate
# macOS/Linux:
source venv/bin/activate

# 安裝所有必要套件
pip install -r requirements.txt
```

### 2. 啟動後端 API 服務
```bash
# 啟動 FastAPI 服務
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 啟動前端（React）專案
```bash
# 進入 frontend 資料夾
cd frontend

# 安裝前端套件
npm install

# 啟動前端開發伺服器
npm start
```

### 4. 開啟應用程式
- 前端介面：http://localhost:3000
- 後端 API 文件：http://localhost:8000/docs
- 後端健康檢查：http://localhost:8000/

## 常用終端機指令

### 直接執行訓練（不透過 API）
```bash
# Q-Learning 訓練
python q_learning.py --map maps/example_map.json --episodes 100 --learning_rate 0.1 --discount_factor 0.95 --epsilon 0.1

# SARSA 訓練
python sarsa.py --map maps/example_map.json --episodes 100 --learning_rate 0.1 --discount_factor 0.95 --epsilon 0.1

# 產生學習曲線圖
python analyze.py
```

### API 操作
```bash
# 啟動 API 服務
uvicorn main:app --reload

# 查看 API 文件
# 開啟瀏覽器訪問 http://localhost:8000/docs
```

### 套件管理
```bash
# 安裝新套件
pip install package_name

# 更新 requirements.txt
pip freeze > requirements.txt

# 重新安裝所有套件
pip install -r requirements.txt --force-reinstall
```

## 專案結構
```
Reinforcement Learning Games/
├── main.py                 # FastAPI 主服務
├── train_api.py           # 訓練 API
├── analysis_api.py        # 分析 API
├── map_api.py            # 地圖管理 API
├── rules_api.py          # 規則管理 API
├── settings_api.py       # 設定 API
├── q_learning.py         # Q-Learning 演算法
├── sarsa.py              # SARSA 演算法
├── analyze.py            # 學習曲線分析
├── frontend/             # React 前端
├── maps/                 # 地圖檔案
├── rules/                # 規則檔案
├── jobs/                 # 訓練任務結果
└── requirements.txt      # Python 套件清單
```

## 產出說明
- `jobs/{job_id}/q_table.csv`：Q-Learning 訓練結果
- `jobs/{job_id}/log.csv`：訓練過程記錄
- `jobs/{job_id}/analysis.md`：AI 分析報告
- `jobs/{job_id}/analysis.html`：AI 分析報告（HTML 格式）

## 如何透過 API 進行 AI 訓練

1. 啟動訓練 API 服務：
   ```bash
   uvicorn main:app --reload
   ```
2. 開啟 Swagger UI：
   在瀏覽器輸入 http://localhost:8000/docs
3. 使用 POST /train/train 啟動訓練：
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
   - 用 GET /train/train/{job_id}/status 查詢進度
5. 查詢訓練結果：
   - 用 GET /train/train/{job_id}/result 取得 q_table.csv、log.csv
6. 進行 AI 分析：
   - 用 POST /analysis/analyze/{job_id} 產生分析報告

## 常見問題
- 執行前請確認已啟動虛擬環境並安裝所有套件
- 若遇到 import error，請重新安裝 requirements.txt 內所有套件
- 地圖格式請參考 maps/README.md
- 前端編譯錯誤請檢查 TypeScript 型別定義
- API 服務無法啟動請檢查 port 8000 是否被佔用

---
如需進階功能或有任何問題，歡迎提出！ 