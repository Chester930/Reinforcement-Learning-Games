import pandas as pd
import matplotlib.pyplot as plt
import os
import argparse
import json

# 可調整分析的 log 檔路徑
LOG_PATH = 'output/log.csv'  # 預設分析 Q-Learning log
OUTPUT_PNG = 'output/learning_curve.png'

def analyze_log(log_path, output_png, job_id=None):
    """分析訓練記錄並生成學習曲線圖"""
    if not os.path.exists(log_path):
        print(f"錯誤：找不到記錄檔案 {log_path}")
        return
    
    df = pd.read_csv(log_path)
    
    # 檢查是否有 epsilon 欄位（新版本）
    has_epsilon = 'epsilon' in df.columns
    
    # 計算每回合總獎勵與步數
    rewards = df.groupby('episode')['reward'].sum()
    steps = df.groupby('episode')['step'].max()
    
    # 如果有 epsilon 資料，也畫出來
    if has_epsilon:
        epsilon_data = df.groupby('episode')['epsilon'].first()
    
    # 創建子圖
    if has_epsilon:
        fig, (ax1, ax3) = plt.subplots(2, 1, figsize=(10, 8))
        ax2 = ax1.twinx()
    else:
        fig, ax1 = plt.subplots(figsize=(10, 6))
        ax2 = ax1.twinx()
    
    # 獎勵和步數圖
    color = 'tab:blue'
    ax1.set_xlabel('Episode')
    ax1.set_ylabel('Total Reward', color=color)
    ax1.plot(rewards.index, rewards.values, color=color, label='Total Reward')
    ax1.tick_params(axis='y', labelcolor=color)
    
    color = 'tab:orange'
    ax2.set_ylabel('Steps', color=color)
    ax2.plot(steps.index, steps.values, color=color, label='Steps')
    ax2.tick_params(axis='y', labelcolor=color)
    
    title = f'Learning Curve'
    if job_id:
        title += f' (Job: {job_id})'
    ax1.set_title(title)
    
    # 探索率圖（如果有）
    if has_epsilon:
        ax3.set_xlabel('Episode')
        ax3.set_ylabel('Epsilon')
        ax3.plot(epsilon_data.index, epsilon_data.values, color='tab:green', label='Epsilon')
        ax3.set_title('Exploration Rate Decay')
        ax3.grid(True, alpha=0.3)
    
    fig.tight_layout()
    os.makedirs(os.path.dirname(output_png), exist_ok=True)
    plt.savefig(output_png, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f'學習曲線已儲存至: {output_png}')
    
    # 輸出統計資訊
    print(f'\n訓練統計:')
    print(f'總回合數: {len(rewards)}')
    print(f'最終 100 回合平均獎勵: {rewards.tail(100).mean():.2f}')
    print(f'最終 100 回合平均步數: {steps.tail(100).mean():.2f}')
    if has_epsilon:
        print(f'初始探索率: {epsilon_data.iloc[0]:.3f}')
        print(f'最終探索率: {epsilon_data.iloc[-1]:.3f}')

def analyze_job(job_id):
    """分析特定 job 的訓練結果"""
    job_dir = os.path.join('jobs', job_id)
    if not os.path.exists(job_dir):
        print(f"錯誤：找不到 job 目錄 {job_dir}")
        return
    
    log_path = os.path.join(job_dir, 'log.csv')
    config_path = os.path.join(job_dir, 'config.json')
    output_png = os.path.join(job_dir, 'learning_curve.png')
    
    # 讀取配置
    config = {}
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"分析 Job: {config.get('job_name', job_id)}")
        print(f"演算法: {config.get('algorithm', 'unknown')}")
        print(f"回合數: {config.get('episodes', 'unknown')}")
        print(f"學習率: {config.get('learning_rate', 'unknown')}")
        print(f"折扣因子: {config.get('discount_factor', 'unknown')}")
        print(f"初始探索率: {config.get('epsilon', 'unknown')}")
        if config.get('seed'):
            print(f"隨機種子: {config.get('seed')}")
        if config.get('optimistic'):
            print(f"樂觀初始化: 是")
    
    analyze_log(log_path, output_png, job_id)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='分析強化學習訓練記錄')
    parser.add_argument('--log', type=str, default='output/log.csv', help='記錄檔案路徑')
    parser.add_argument('--output', type=str, default='output/learning_curve.png', help='輸出圖片路徑')
    parser.add_argument('--job', type=str, help='分析特定 job ID')
    
    args = parser.parse_args()
    
    if args.job:
        # 分析特定 job
        analyze_job(args.job)
    else:
        # 分析指定記錄檔案
        analyze_log(args.log, args.output) 