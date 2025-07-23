from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import json
import re
import requests
import markdown2

app = FastAPI()
JOBS_DIR = 'jobs'

@app.get('/analysis/{job_id}/curve')
def get_learning_curve(job_id: str):
    log_path = os.path.join(JOBS_DIR, job_id, 'log.csv')
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail='Log not found')
    df = pd.read_csv(log_path)
    rewards = df.groupby('episode')['reward'].sum().tolist()
    steps = df.groupby('episode')['step'].max().tolist()
    return {"rewards": rewards, "steps": steps}

@app.get('/analysis/{job_id}/heatmap')
def get_qtable_heatmap(job_id: str):
    qtable_path = os.path.join(JOBS_DIR, job_id, 'q_table.csv')
    if not os.path.exists(qtable_path):
        raise HTTPException(status_code=404, detail='Q-Table not found')
    df = pd.read_csv(qtable_path)
    # 以 state 為 row, action 為 column, value 為 cell
    pivot = df.pivot(index='state', columns='action', values='value').fillna(0)
    plt.figure(figsize=(8, 6))
    plt.title('Q-Table Heatmap')
    plt.imshow(pivot, cmap='viridis', aspect='auto')
    plt.xlabel('Action')
    plt.ylabel('State')
    plt.colorbar(label='Q-value')
    plt.xticks(ticks=np.arange(len(pivot.columns)), labels=pivot.columns)
    plt.yticks(ticks=np.arange(len(pivot.index)), labels=pivot.index)
    buf = BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    heatmap_png_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return {"heatmap_png_base64": heatmap_png_base64}

@app.get('/analysis/{job_id}/optimal-path')
def get_optimal_path(job_id: str):
    qtable_path = os.path.join(JOBS_DIR, job_id, 'q_table.csv')
    map_path = os.path.join(JOBS_DIR, job_id, 'map.json')
    if not os.path.exists(qtable_path) or not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail='Q-Table or map not found')
    df = pd.read_csv(qtable_path)
    with open(map_path, 'r', encoding='utf-8') as f:
        map_data = json.load(f)
    grid = map_data['map'] if 'map' in map_data else None
    if grid is None:
        raise HTTPException(status_code=400, detail='Map format error')
    # 找起點
    start = None
    for i, row in enumerate(grid):
        for j, cell in enumerate(row):
            if cell == 'S':
                start = (i, j)
    if start is None:
        raise HTTPException(status_code=400, detail='No start point')
    # 依 Q-Table 找最優路徑
    state = start
    path = [state]
    visited = set()
    actions = ['up', 'down', 'left', 'right']
    for _ in range(100):
        visited.add(state)
        q_vals = df[df['state'] == f"({state[0]},{state[1]})"]
        if q_vals.empty:
            break
        best = q_vals.loc[q_vals['value'].idxmax()]
        action = best['action']
        # 移動
        i, j = state
        if action == 'up':
            ni, nj = i-1, j
        elif action == 'down':
            ni, nj = i+1, j
        elif action == 'left':
            ni, nj = i, j-1
        elif action == 'right':
            ni, nj = i, j+1
        else:
            break
        if not (0 <= ni < len(grid) and 0 <= nj < len(grid[0])):
            break
        if grid[ni][nj] == '1':
            break
        state = (ni, nj)
        path.append(state)
        if grid[ni][nj] == 'G':
            break
        if state in visited:
            break
    
    # 生成最優路徑圖片
    plt.figure(figsize=(8, 6))
    plt.title('Optimal Path')
    # 繪製地圖網格
    for i, row in enumerate(grid):
        for j, cell in enumerate(row):
            if cell == 'S':
                plt.text(j, i, '🧑‍🌾', ha='center', va='center', fontsize=20)
            elif cell == 'G':
                plt.text(j, i, '🏁', ha='center', va='center', fontsize=20)
            elif cell == 'R':
                plt.text(j, i, '🪙', ha='center', va='center', fontsize=15)
            elif cell == 'T':
                plt.text(j, i, '🕳️', ha='center', va='center', fontsize=15)
            elif cell == '1':
                plt.text(j, i, '🪨', ha='center', va='center', fontsize=15)
            else:
                plt.text(j, i, '·', ha='center', va='center', fontsize=10, color='lightgray')
    
    # 繪製路徑
    if len(path) > 1:
        path_x = [p[1] for p in path]
        path_y = [p[0] for p in path]
        plt.plot(path_x, path_y, 'r-', linewidth=3, alpha=0.7, label='Optimal Path')
        plt.scatter(path_x, path_y, c='red', s=50, alpha=0.7)
    
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.xlim(-0.5, len(grid[0])-0.5)
    plt.ylim(len(grid)-0.5, -0.5)
    
    buf = BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    path_png_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return {"optimal_path": path, "path_png_base64": path_png_base64}

def build_analysis_prompt(job_id, user_prompt):
    log_path = os.path.join(JOBS_DIR, job_id, 'log.csv')
    qtable_path = os.path.join(JOBS_DIR, job_id, 'q_table.csv')
    map_path = os.path.join(JOBS_DIR, job_id, 'map.json')
    # 學習曲線摘要
    rewards, steps = [], []
    training_summary = {}
    if os.path.exists(log_path):
        df_log = pd.read_csv(log_path)
        rewards = df_log.groupby('episode')['reward'].sum().tolist()[:20]
        steps = df_log.groupby('episode')['step'].max().tolist()[:20]
        
        # 計算訓練統計
        total_episodes = df_log['episode'].max()
        avg_reward = df_log.groupby('episode')['reward'].sum().mean()
        avg_steps = df_log.groupby('episode')['step'].max().mean()
        final_reward = df_log.groupby('episode')['reward'].sum().iloc[-1] if len(rewards) > 0 else 0
        final_steps = df_log.groupby('episode')['step'].max().iloc[-1] if len(steps) > 0 else 0
        
        training_summary = {
            'total_episodes': total_episodes,
            'avg_reward': round(avg_reward, 2),
            'avg_steps': round(avg_steps, 2),
            'final_reward': final_reward,
            'final_steps': final_steps,
            'reward_trend': '上升' if len(rewards) > 1 and rewards[-1] > rewards[0] else '下降' if len(rewards) > 1 and rewards[-1] < rewards[0] else '穩定',
            'steps_trend': '下降' if len(steps) > 1 and steps[-1] < steps[0] else '上升' if len(steps) > 1 and steps[-1] > steps[0] else '穩定'
        }
    # Q-Table 熱門狀態摘要
    qtable_str = ''
    if os.path.exists(qtable_path):
        df_q = pd.read_csv(qtable_path)
        qtable_top = df_q.sort_values('value', ascending=False).head(10)
        qtable_str = '\n'.join([f"{row['state']}, {row['action']}, {row['value']}" for _, row in qtable_top.iterrows()])
    # 最優路徑
    optimal_path = []
    if os.path.exists(qtable_path) and os.path.exists(map_path):
        # 直接複用 get_optimal_path 的邏輯
        with open(map_path, 'r', encoding='utf-8') as f:
            map_data = json.load(f)
        grid = map_data['map'] if 'map' in map_data else None
        if grid:
            df = pd.read_csv(qtable_path)
            start = None
            for i, row in enumerate(grid):
                for j, cell in enumerate(row):
                    if cell == 'S':
                        start = (i, j)
            if start:
                state = start
                path = [state]
                visited = set()
                for _ in range(100):
                    visited.add(state)
                    q_vals = df[df['state'] == f"({state[0]},{state[1]})"]
                    if q_vals.empty:
                        break
                    best = q_vals.loc[q_vals['value'].idxmax()]
                    action = best['action']
                    i, j = state
                    if action == 'up':
                        ni, nj = i-1, j
                    elif action == 'down':
                        ni, nj = i+1, j
                    elif action == 'left':
                        ni, nj = i, j-1
                    elif action == 'right':
                        ni, nj = i, j+1
                    else:
                        break
                    if not (0 <= ni < len(grid) and 0 <= nj < len(grid[0])):
                        break
                    if grid[ni][nj] == '1':
                        break
                    state = (ni, nj)
                    path.append(state)
                    if grid[ni][nj] == 'G':
                        break
                    if state in visited:
                        break
                optimal_path = path
    # 合併 prompt
    prompt = f"""{user_prompt}

## 訓練數據分析

### 訓練統計摘要
- **總回合數**: {training_summary.get('total_episodes', 0)}
- **平均獎勵**: {training_summary.get('avg_reward', 0)}
- **平均步數**: {training_summary.get('avg_steps', 0)}
- **最終獎勵**: {training_summary.get('final_reward', 0)}
- **最終步數**: {training_summary.get('final_steps', 0)}
- **獎勵趨勢**: {training_summary.get('reward_trend', '未知')}
- **步數趨勢**: {training_summary.get('steps_trend', '未知')}

### 學習曲線數據（前20回合）
- **獎勵序列**: {rewards}
- **步數序列**: {steps}

### Q-Table 分析
**最高價值狀態-動作對（前10筆）:**
{qtable_str}

### 最優路徑分析
**AI選擇的最優路徑**: {optimal_path}

## 分析要求

請根據以上數據進行詳細分析，並提供以下內容：

### 1. 學習效果評估
- 分析學習曲線的趨勢（獎勵和步數變化）
- 評估AI是否成功學習到有效策略
- 判斷訓練是否收斂
- 評估最終性能表現

### 2. 問題診斷
- 識別訓練過程中的問題（如循環、收斂失敗、探索不足等）
- 分析Q-Table的學習質量（是否有明顯的價值分布）
- 評估最優路徑的合理性（是否能到達目標）
- 檢查是否存在過擬合或欠擬合

### 3. 改進建議
- 針對發現的問題提供具體改進方案
- 建議參數調整方向（學習率、折扣因子、探索率等）
- 提供訓練策略優化建議
- 建議合適的訓練回合數

### 4. 算法特性分析
- 分析當前算法的優缺點
- 與其他強化學習算法的比較
- 適用場景評估
- 算法選擇建議

### 5. 總結與評分
- 整體訓練效果評分（1-10分）
- 主要成就和問題總結
- 實用性評估

請以結構化的方式呈現分析結果，使用清晰的標題和要點，並同時輸出 markdown 與 html 版本。"""
    return prompt

@app.post('/analysis/{job_id}/analyze-and-save')
def analyze_and_save(job_id: str, user_prompt: str = Body(..., embed=True)):
    job_dir = os.path.join(JOBS_DIR, job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail='Job not found')
    # 讀取 AI 設定
    with open('settings.json', 'r', encoding='utf-8') as f:
        settings = json.load(f)
    system_prompt = settings.get('system_prompt', '')
    api_key = settings.get('api_key', '')
    model_name = settings.get('model_name', '')
    # 自動合併 prompt
    prompt = build_analysis_prompt(job_id, user_prompt)
    # 呼叫 Gemini API
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}'
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [
            {"role": "user", "parts": [{"text": system_prompt + "\n" + prompt}]}
        ]
    }
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f'Gemini API error: {resp.text}')
    gemini_content = resp.json()['candidates'][0]['content']['parts'][0]['text']
    # 儲存 .md
    md_match = re.search(r"```markdown\s*([\s\S]+?)```", gemini_content)
    md_content = md_match.group(1).strip() if md_match else gemini_content
    md_path = os.path.join(job_dir, 'analysis.md')
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    # 儲存 .html
    html_match = re.search(r"```html\s*([\s\S]+?)```", gemini_content)
    if html_match:
        html_content = html_match.group(1).strip()
    else:
        html_content = markdown2.markdown(md_content)
    html_path = os.path.join(job_dir, 'analysis.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    return {"message": "Analysis saved.", "md": md_content, "html": html_content}

@app.get('/analysis/{job_id}/report')
def get_analysis_report(job_id: str):
    report_path = os.path.join(JOBS_DIR, job_id, 'analysis.md')
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail='Analysis report not found')
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return {"content": content} 