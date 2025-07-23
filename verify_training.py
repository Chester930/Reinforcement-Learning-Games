import sys
import os
import pandas as pd

# 用法: python verify_training.py jobs/<job_id>/log.csv

def verify_log(log_path, goal_state=None, reward_threshold=1e-6):
    if not os.path.exists(log_path):
        print(f"[錯誤] 找不到 log.csv: {log_path}")
        return False
    df = pd.read_csv(log_path)
    if 'episode' not in df.columns or 'reward' not in df.columns or 'next_state' not in df.columns:
        print("[錯誤] log.csv 欄位不完整，需有 episode, reward, next_state")
        return False
    # 取得所有 episode 的最後一筆紀錄
    last_steps = df.groupby('episode').tail(1)
    # 自動推測 goal_state
    if goal_state is None:
        # 嘗試找 next_state 出現最多的 (G) 格子
        goal_candidates = last_steps['next_state'].value_counts().index.tolist()
        if goal_candidates:
            goal_state = goal_candidates[0]
    print(f"[Info] 使用終點狀態: {goal_state}")
    # 檢查沒到終點卻有分數的情形
    abnormal = last_steps[(last_steps['next_state'] != goal_state) & (last_steps['reward'].abs() > reward_threshold)]
    if len(abnormal) == 0:
        print("[OK] 所有回合都正確：沒到終點時 reward 歸零！")
        return True
    else:
        print(f"[警告] 發現 {len(abnormal)} 個回合沒到終點卻有分數：")
        print(abnormal[['episode','next_state','reward']])
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python verify_training.py jobs/<job_id>/log.csv")
        sys.exit(1)
    log_path = sys.argv[1]
    verify_log(log_path) 