# 強化學習遊戲平台

一個基於 Q-Learning 和 SARSA 演算法的互動式強化學習平台，專注於 Grid World 環境中的路徑規劃與策略學習。

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

## 專案結構
```
Reinforcement Learning Games/
├── main.py                 # FastAPI 主應用程式
├── q_learning.py          # Q-Learning 演算法實作
├── sarsa.py               # SARSA 演算法實作
├── train_api.py           # 訓練 API
├── analysis_api.py        # 分析 API
├── map_api.py             # 地圖管理 API
├── rules_api.py           # 規則管理 API
├── settings_api.py        # 設定 API
├── analyze.py             # 分析工具
├── requirements.txt       # Python 套件清單
├── settings.json          # 系統設定
├── maps/                  # 地圖檔案目錄
├── rules/                 # 規則檔案目錄
├── jobs/                  # 訓練結果目錄
├── frontend/              # React 前端專案
└── venv/                  # Python 虛擬環境
```

## 常用終端機指令

### 直接訓練（命令列）
```bash
# Q-Learning 訓練
python q_learning.py --map maps/example_map.json --episodes 500 --learning_rate 0.1 --discount_factor 0.95 --epsilon 1.0

# SARSA 訓練
python sarsa.py --map maps/example_map.json --episodes 500 --learning_rate 0.1 --discount_factor 0.95 --epsilon 1.0

# 使用新參數
python q_learning.py --map maps/example_map.json --episodes 1000 --seed 42 --optimistic
python sarsa.py --map maps/example_map.json --episodes 1000 --seed 42 --optimistic
```

### API 操作
```bash
# 查看所有地圖
curl http://localhost:8000/maps/maps

# 查看所有規則
curl http://localhost:8000/rules/rules

# 查看所有訓練任務
curl http://localhost:8000/train/train/jobs

# 啟動訓練
curl -X POST http://localhost:8000/train/train \
  -H "Content-Type: application/json" \
  -d '{
    "map_id": "example_map",
    "algorithm": "q_learning",
    "episodes": 500,
    "learning_rate": 0.1,
    "discount_factor": 0.95,
    "epsilon": 1.0,
    "job_name": "測試訓練"
  }'
```

### 套件管理
```bash
# 安裝套件
pip install -r requirements.txt

# 更新套件清單
pip freeze > requirements.txt

# 檢查套件版本
pip list
```

## 輸出說明

訓練結果會儲存在 `jobs/{job_id}/` 目錄中：
- `config.json` - 訓練配置
- `map.json` - 使用的地圖
- `q_table.csv` - Q-Table 結果
- `log.csv` - 訓練記錄
- `learning_curve.png` - 學習曲線圖（如果使用 analyze.py）
- `analysis.md` - AI 分析報告
- `analysis.html` - AI 分析報告（HTML 版本）

## 如何透過 API 進行 AI 訓練

### 1. 準備地圖和規則
```bash
# 建立地圖
curl -X POST http://localhost:8000/maps/maps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試地圖",
    "map": [["S", "0", "G"], ["0", "1", "0"], ["0", "0", "0"]]
  }'

# 建立規則
curl -X POST http://localhost:8000/rules/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試規則",
    "max_steps": 100,
    "learning_rate": 0.1,
    "discount_factor": 0.95,
    "epsilon": 1.0
  }'
```

### 2. 啟動訓練
```bash
curl -X POST http://localhost:8000/train/train \
  -H "Content-Type: application/json" \
  -d '{
    "map_id": "測試地圖",
    "algorithm": "q_learning",
    "episodes": 500,
    "learning_rate": 0.1,
    "discount_factor": 0.95,
    "epsilon": 1.0,
    "job_name": "我的第一次訓練"
  }'
```

### 3. 查看結果
```bash
# 查看訓練狀態
curl http://localhost:8000/train/train/{job_id}/status

# 查看訓練結果
curl http://localhost:8000/train/train/{job_id}/result

# 查看學習曲線
curl http://localhost:8000/analysis/analysis/{job_id}/curve
```

## 常見問題

### 1. 虛擬環境問題
```bash
# 如果 uvicorn 找不到，請確認虛擬環境已啟動
.\venv\Scripts\Activate  # Windows
source venv/bin/activate  # macOS/Linux

# 重新安裝套件
pip install -r requirements.txt
```

### 2. 前端編譯問題
```bash
# 清除快取
npm cache clean --force

# 重新安裝套件
rm -rf node_modules package-lock.json
npm install
```

### 3. API 啟動問題
```bash
# 檢查端口是否被佔用
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # macOS/Linux

# 使用不同端口
uvicorn main:app --reload --port 8001
```

### 4. 地圖格式問題
確保地圖 JSON 格式正確：
```json
{
  "name": "地圖名稱",
  "map": [
    ["S", "0", "G"],
    ["0", "1", "0"],
    ["0", "0", "0"]
  ]
}
```

## 技術架構

- **後端**：Python + FastAPI + NumPy + Pandas + Matplotlib
- **前端**：React + TypeScript + Material-UI + Chart.js
- **演算法**：Q-Learning, SARSA
- **資料格式**：JSON, CSV, Markdown, HTML

## 開發者資訊

本專案支援：
- ✅ Q-Learning 和 SARSA 演算法
- ✅ 探索率衰減機制
- ✅ 隨機種子設定（可重現性）
- ✅ 樂觀初始化選項
- ✅ 地圖驗證和錯誤處理
- ✅ 訓練進度監控
- ✅ AI 分析報告生成
- ✅ 響應式 Web 介面 