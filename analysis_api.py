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
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return {"heatmap_png_base64": img_base64}

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
    return {"optimal_path": path}

def build_analysis_prompt(job_id, user_prompt):
    log_path = os.path.join(JOBS_DIR, job_id, 'log.csv')
    qtable_path = os.path.join(JOBS_DIR, job_id, 'q_table.csv')
    map_path = os.path.join(JOBS_DIR, job_id, 'map.json')
    # 學習曲線摘要
    rewards, steps = [], []
    if os.path.exists(log_path):
        df_log = pd.read_csv(log_path)
        rewards = df_log.groupby('episode')['reward'].sum().tolist()[:20]
        steps = df_log.groupby('episode')['step'].max().tolist()[:20]
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
    prompt = f"""{user_prompt}\n\n---\n學習曲線 rewards: {rewards}\n學習曲線 steps: {steps}\nQ-Table 熱門狀態（前10筆）:\n{qtable_str}\n最優路徑: {optimal_path}\n---\n請根據上述資料產生完整分析報告，並同時輸出 markdown 與 html 版本。"""
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