import json
import numpy as np
import pandas as pd
import os
import argparse

# 參數設定
MAP_PATH = 'maps/example_map.json'
QTABLE_OUTPUT = 'output/sarsa_q_table.csv'
LOG_OUTPUT = 'output/sarsa_log.csv'
EPISODES = 500
MAX_STEPS = 100
LEARNING_RATE = 0.1
DISCOUNT_FACTOR = 0.95
EPSILON = 0.1
ACTIONS = ['up', 'down', 'left', 'right']

# 地圖元素標記
START = 'S'
GOAL = 'G'
REWARD = 'R'
TRAP = 'T'
OBSTACLE = '1'
EMPTY = '0'

# 獎勵設計
REWARD_DEFAULT = -1
REWARD_GOAL = 100
REWARD_REWARD = 10
REWARD_TRAP = -50
REWARD_OBSTACLE = -100


def load_map(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['map']


def find_start(map_grid):
    for i, row in enumerate(map_grid):
        for j, cell in enumerate(row):
            if cell == START:
                return (i, j)
    raise ValueError('No start point found')


def is_goal(cell):
    return cell == GOAL


def get_valid_actions(map_grid, pos):
    actions = []
    rows, cols = len(map_grid), len(map_grid[0])
    i, j = pos
    for idx, (di, dj) in enumerate([(-1,0),(1,0),(0,-1),(0,1)]):
        ni, nj = i+di, j+dj
        if 0 <= ni < rows and 0 <= nj < cols:
            if map_grid[ni][nj] != OBSTACLE:
                actions.append(ACTIONS[idx])
    return actions


def move(map_grid, pos, action):
    i, j = pos
    if action == 'up':
        ni, nj = i-1, j
    elif action == 'down':
        ni, nj = i+1, j
    elif action == 'left':
        ni, nj = i, j-1
    elif action == 'right':
        ni, nj = i, j+1
    else:
        raise ValueError('Invalid action')
    rows, cols = len(map_grid), len(map_grid[0])
    if 0 <= ni < rows and 0 <= nj < cols and map_grid[ni][nj] != OBSTACLE:
        return (ni, nj)
    return pos  # 撞牆或障礙物不動


def get_reward(cell):
    if cell == GOAL:
        return REWARD_GOAL
    elif cell == REWARD:
        return REWARD_REWARD
    elif cell == TRAP:
        return REWARD_TRAP
    elif cell == OBSTACLE:
        return REWARD_OBSTACLE
    else:
        return REWARD_DEFAULT


def state_to_str(pos):
    return f"({pos[0]},{pos[1]})"


def main(map_path, episodes, learning_rate, discount_factor, epsilon, output_dir):
    map_grid = load_map(map_path)
    rows, cols = len(map_grid), len(map_grid[0])
    # 初始化 Q-Table
    q_table = {}
    for i in range(rows):
        for j in range(cols):
            if map_grid[i][j] != OBSTACLE:
                for action in get_valid_actions(map_grid, (i, j)):
                    q_table[(i, j, action)] = 0.0
    log_records = []
    for episode in range(1, episodes+1):
        pos = find_start(map_grid)
        state = pos
        valid_actions = get_valid_actions(map_grid, state)
        # 初始動作
        if np.random.rand() < epsilon:
            action = np.random.choice(valid_actions)
        else:
            q_vals = [q_table.get((state[0], state[1], a), -np.inf) for a in valid_actions]
            max_q = np.max(q_vals)
            best_actions = [a for a, q in zip(valid_actions, q_vals) if q == max_q]
            action = np.random.choice(best_actions)
        for step in range(1, MAX_STEPS+1):
            next_pos = move(map_grid, state, action)
            cell = map_grid[next_pos[0]][next_pos[1]]
            reward = get_reward(cell)
            next_valid_actions = get_valid_actions(map_grid, next_pos)
            # 下一動作（SARSA）
            if next_valid_actions:
                if np.random.rand() < epsilon:
                    next_action = np.random.choice(next_valid_actions)
                else:
                    next_q_vals = [q_table.get((next_pos[0], next_pos[1], a), -np.inf) for a in next_valid_actions]
                    max_next_q = np.max(next_q_vals)
                    best_next_actions = [a for a, q in zip(next_valid_actions, next_q_vals) if q == max_next_q]
                    next_action = np.random.choice(best_next_actions)
                next_q = q_table.get((next_pos[0], next_pos[1], next_action), 0.0)
            else:
                next_action = None
                next_q = 0.0
            # SARSA 更新
            q_key = (state[0], state[1], action)
            q_table[q_key] = q_table.get(q_key, 0.0) + learning_rate * (reward + discount_factor * next_q - q_table.get(q_key, 0.0))
            log_records.append({
                'episode': episode,
                'step': step,
                'state': state_to_str(state),
                'action': action,
                'reward': reward,
                'next_state': state_to_str(next_pos),
                'done': is_goal(cell)
            })
            if is_goal(cell) or step == MAX_STEPS:
                break
            state = next_pos
            action = next_action
    # 輸出 Q-Table
    os.makedirs(output_dir, exist_ok=True)
    qtable_rows = []
    for (i, j, action), value in q_table.items():
        qtable_rows.append({'state': state_to_str((i, j)), 'action': action, 'value': value})
    qtable_output = os.path.join(output_dir, 'q_table.csv')
    log_output = os.path.join(output_dir, 'log.csv')
    pd.DataFrame(qtable_rows).to_csv(qtable_output, index=False)
    pd.DataFrame(log_records).to_csv(log_output, index=False)
    print(f"SARSA Q-Table saved to {qtable_output}")
    print(f"SARSA Log saved to {log_output}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--map', type=str, default=MAP_PATH, help='地圖檔路徑')
    parser.add_argument('--episodes', type=int, default=EPISODES, help='訓練回合數')
    parser.add_argument('--learning_rate', type=float, default=LEARNING_RATE, help='學習率')
    parser.add_argument('--discount_factor', type=float, default=DISCOUNT_FACTOR, help='折扣因子')
    parser.add_argument('--epsilon', type=float, default=EPSILON, help='探索率')
    parser.add_argument('--output', type=str, default='output', help='輸出目錄')
    args = parser.parse_args()
    main(args.map, args.episodes, args.learning_rate, args.discount_factor, args.epsilon, args.output) 