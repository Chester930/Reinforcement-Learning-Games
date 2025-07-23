import sys
import os
import pandas as pd

def fix_log_reward(log_path, goal_state=None, output_path=None):
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
        goal_candidates = last_steps['next_state'].value_counts().index.tolist()
        if goal_candidates:
            goal_state = goal_candidates[0]
    print(f"[Info] 使用終點狀態: {goal_state}")
    # 找出沒到終點的 episode
    abnormal_idx = last_steps[last_steps['next_state'] != goal_state].index
    # 強制將這些 episode 的最後 reward 歸零
    df.loc[abnormal_idx, 'reward'] = 0
    # 輸出
    if output_path is None:
        output_path = log_path
    df.to_csv(output_path, index=False)
    print(f"[OK] 已修正 {len(abnormal_idx)} 個回合 reward，結果已儲存至: {output_path}")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python fix_log_reward.py jobs/<job_id>/log.csv [output.csv]")
        sys.exit(1)
    log_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    fix_log_reward(log_path, output_path=output_path) 