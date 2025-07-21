import pandas as pd
import matplotlib.pyplot as plt
import os

# 可調整分析的 log 檔路徑
LOG_PATH = 'output/log.csv'  # 預設分析 Q-Learning log
OUTPUT_PNG = 'output/learning_curve.png'

def analyze_log(log_path, output_png):
    df = pd.read_csv(log_path)
    # 計算每回合總獎勵與步數
    rewards = df.groupby('episode')['reward'].sum()
    steps = df.groupby('episode')['step'].max()
    # 畫圖
    fig, ax1 = plt.subplots()
    color = 'tab:blue'
    ax1.set_xlabel('Episode')
    ax1.set_ylabel('Total Reward', color=color)
    ax1.plot(rewards.index, rewards.values, color=color, label='Total Reward')
    ax1.tick_params(axis='y', labelcolor=color)
    ax2 = ax1.twinx()
    color = 'tab:orange'
    ax2.set_ylabel('Steps', color=color)
    ax2.plot(steps.index, steps.values, color=color, label='Steps')
    ax2.tick_params(axis='y', labelcolor=color)
    plt.title('Learning Curve')
    fig.tight_layout()
    os.makedirs(os.path.dirname(output_png), exist_ok=True)
    plt.savefig(output_png)
    plt.close()
    print(f'Learning curve saved to {output_png}')

if __name__ == '__main__':
    analyze_log(LOG_PATH, OUTPUT_PNG) 