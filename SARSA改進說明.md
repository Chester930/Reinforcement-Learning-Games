# SARSA 改進說明

## 概述
根據用戶的建議，對 SARSA 演算法進行了全面的改進，解決了潛在問題並增強了功能。SARSA 作為 on-policy 演算法，與 Q-Learning 的 off-policy 特性有所不同，本改進保持了 SARSA 的核心特性。

## 🔧 修正的問題

### 1. 障礙物獎勵無效
**問題**：`get_reward` 函數為障礙物定義了 -100 獎勵，但代理無法移動到障礙物。

**修正**：
```python
def get_reward(cell):
    """獲取獎勵值（移除障礙物獎勵，因為代理無法到達）"""
    if cell == GOAL:
        return REWARD_GOAL
    elif cell == REWARD:
        return REWARD_REWARD
    elif cell == TRAP:
        return REWARD_TRAP
    else:
        return REWARD_DEFAULT
    # 移除 REWARD_OBSTACLE = -100
```

**影響**：消除了程式邏輯的混淆，使獎勵函數更符合實際情況。

---

### 2. 陷阱終止邏輯不一致
**問題**：程式僅在 GOAL 或最大步數時終止，TRAP 不終止，與 Q-Learning 不一致。

**修正**：
```python
def is_terminal(cell):
    """判斷是否為終止狀態（目標或陷阱）"""
    return cell in [GOAL, TRAP]

# 修正終止條件：目標或陷阱都終止回合
if is_terminal(cell) or step == MAX_STEPS:
    break
```

**影響**：陷阱現在會正確終止回合，與 Q-Learning 保持一致。

---

### 3. 探索率固定
**問題**：EPSILON = 0.1 固定不變，缺乏衰減機制。

**修正**：
```python
# 探索率衰減設定
EPSILON_START = 1.0  # 初始探索率
EPSILON_END = 0.01   # 最終探索率
EPSILON_DECAY = 0.995  # 探索率衰減因子

def get_epsilon(episode, total_episodes):
    """計算當前探索率（指數衰減）"""
    if EPSILON_DECAY == 1.0:
        return EPSILON_START
    
    # 指數衰減
    decay_rate = (EPSILON_END / EPSILON_START) ** (1 / total_episodes)
    epsilon = EPSILON_START * (decay_rate ** episode)
    return max(epsilon, EPSILON_END)
```

**影響**：探索率從 1.0 逐漸衰減到 0.01，提高學習效率。

---

### 4. 錯誤處理不足
**問題**：缺乏地圖驗證和檔案寫入錯誤處理。

**修正**：
```python
def load_map(path):
    """載入地圖檔案"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data['map']
    except FileNotFoundError:
        raise ValueError(f'地圖檔案不存在: {path}')
    except json.JSONDecodeError:
        raise ValueError(f'地圖檔案格式錯誤: {path}')
    except KeyError:
        raise ValueError(f'地圖檔案缺少 "map" 欄位: {path}')

def validate_map(map_grid):
    """驗證地圖的有效性"""
    has_start = False
    has_goal = False
    has_trap = False
    
    for i, row in enumerate(map_grid):
        for j, cell in enumerate(row):
            if cell == START:
                has_start = True
            elif cell == GOAL:
                has_goal = True
            elif cell == TRAP:
                has_trap = True
    
    if not has_start:
        raise ValueError('地圖中沒有起點 (S)')
    if not has_goal:
        raise ValueError('地圖中沒有目標 (G)')
    
    print(f"地圖驗證通過：起點 ✓, 目標 ✓, 陷阱 {'✓' if has_trap else '✗'}")
    return True

def save_results(qtable_rows, log_records, output_dir):
    """儲存訓練結果"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        # ... 儲存邏輯
    except PermissionError:
        raise ValueError(f'沒有權限寫入目錄: {output_dir}')
    except Exception as e:
        raise ValueError(f'儲存結果時發生錯誤: {str(e)}')
```

**影響**：提供完整的錯誤處理，提高程式穩定性。

---

### 5. 隨機性不可重現
**問題**：未設定隨機種子，結果不可重現。

**修正**：
```python
def main(map_path, episodes, learning_rate, discount_factor, epsilon_start, output_dir, seed=None):
    # 設定隨機種子以提高可重現性
    if seed is not None:
        np.random.seed(seed)
        print(f"隨機種子設定為: {seed}")
```

**影響**：設定隨機種子後，相同參數的訓練結果可重現。

---

### 6. Q-Table 初始化單一
**問題**：Q-Table 初始化為 0.0，缺乏其他選項。

**修正**：
```python
# Q-Table 初始化設定
OPTIMISTIC_INIT = False  # 是否使用樂觀初始化
OPTIMISTIC_VALUE = 1.0   # 樂觀初始值

# 初始化 Q-Table
initial_value = OPTIMISTIC_VALUE if OPTIMISTIC_INIT else 0.0
for i in range(rows):
    for j in range(cols):
        if map_grid[i][j] != OBSTACLE:
            for action in get_valid_actions(map_grid, (i, j)):
                q_table[(i, j, action)] = initial_value
```

**影響**：提供樂觀初始化選項，可能加速收斂。

---

## 🚀 新增功能

### 1. 訓練進度監控
```python
# 每 50 回合顯示進度
if episode % 50 == 0:
    avg_reward = np.mean(episode_rewards[-50:])
    print(f"回合 {episode}/{episodes}, 平均獎勵: {avg_reward:.2f}, 探索率: {current_epsilon:.3f}")
```

### 2. 訓練統計輸出
```python
# 輸出訓練統計
final_avg_reward = np.mean(episode_rewards[-100:]) if len(episode_rewards) >= 100 else np.mean(episode_rewards)
print(f"\nSARSA 訓練完成！")
print(f"最終 100 回合平均獎勵: {final_avg_reward:.2f}")
print(f"總回合數: {len(episode_rewards)}")
```

### 3. 增強的記錄功能
```python
log_records.append({
    'episode': episode,
    'step': step,
    'state': state_to_str(state),
    'action': action,
    'reward': reward,
    'next_state': state_to_str(next_pos),
    'done': is_terminal(cell),
    'epsilon': current_epsilon  # 新增探索率記錄
})
```

### 4. 新的命令列參數
```python
parser.add_argument('--seed', type=int, default=None, help='隨機種子（用於可重現性）')
parser.add_argument('--optimistic', action='store_true', help='使用樂觀初始化')
```

---

## 🔄 SARSA vs Q-Learning 核心差異

### 1. 策略類型
- **SARSA**：On-policy（在策略上）
- **Q-Learning**：Off-policy（離策略）

### 2. 更新方式
**SARSA 更新公式**：
```python
# SARSA 更新公式
q_key = (state[0], state[1], action)
q_table[q_key] = q_table.get(q_key, 0.0) + learning_rate * (reward + discount_factor * next_q - q_table.get(q_key, 0.0))
```

**Q-Learning 更新公式**：
```python
# Q-Learning 更新公式
next_qs = [q_table.get((next_pos[0], next_pos[1], a), 0.0) for a in next_valid_actions]
max_next_q = max(next_qs) if next_qs else 0.0
q_table[q_key] = q_table.get(q_key, 0.0) + learning_rate * (reward + discount_factor * max_next_q - q_table.get(q_key, 0.0))
```

### 3. 動作選擇
**SARSA**：
- 需要先選擇下一個動作
- 使用實際選擇的動作的 Q 值更新
- 更保守，避免危險動作

**Q-Learning**：
- 使用所有可能動作的最大 Q 值更新
- 更激進，追求最優策略

### 4. 實作差異
```python
# SARSA：需要選擇下一動作
if next_valid_actions:
    if np.random.rand() < current_epsilon:
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

# Q-Learning：直接使用最大值
next_qs = [q_table.get((next_pos[0], next_pos[1], a), 0.0) for a in next_valid_actions]
max_next_q = max(next_qs) if next_qs else 0.0
```

---

## 📊 改進效果

### 1. 學習效率提升
- **探索率衰減**：從高探索開始，逐漸轉向利用
- **樂觀初始化**：可選的樂觀初始化可能加速收斂

### 2. 穩定性增強
- **地圖驗證**：避免無效地圖導致的訓練失敗
- **隨機種子**：確保結果可重現，便於實驗比較
- **錯誤處理**：完整的異常處理機制

### 3. 監控能力
- **進度顯示**：即時監控訓練進度和效果
- **統計輸出**：提供詳細的訓練結果統計

### 4. 邏輯一致性
- **終止條件**：陷阱正確終止回合
- **獎勵函數**：移除無用的障礙物獎勵

---

## 🎯 使用建議

### 1. 探索率設定
```bash
# 使用預設衰減（推薦）
python sarsa.py --episodes 1000

# 自訂初始探索率
python sarsa.py --episodes 1000 --epsilon 0.5
```

### 2. 可重現實驗
```bash
# 設定隨機種子
python sarsa.py --episodes 500 --seed 42
```

### 3. 樂觀初始化
```bash
# 使用樂觀初始化
python sarsa.py --episodes 500 --optimistic
```

### 4. 完整參數設定
```bash
python sarsa.py \
    --map maps/example_map.json \
    --episodes 1000 \
    --learning_rate 0.1 \
    --discount_factor 0.95 \
    --epsilon 1.0 \
    --seed 42 \
    --optimistic \
    --output output
```

---

## 🔍 SARSA 適用場景

### 1. 安全性要求高
- 避免危險動作
- 保守的策略學習

### 2. 探索成本高
- 錯誤動作代價昂貴
- 需要穩定的學習過程

### 3. 策略一致性
- 學習策略與執行策略相同
- 避免策略不匹配問題

---

## 🔍 進一步改進建議

### 1. SARSA(λ)
- 實作資格跡 (eligibility traces)
- 提高學習效率

### 2. 期望 SARSA
- 使用期望值而非實際選擇的動作
- 平衡 SARSA 和 Q-Learning

### 3. 雙重 SARSA
- 使用兩個 Q-Table
- 減少過度估計問題

### 4. 優先級經驗回放
- 根據 TD 誤差設定優先級
- 提高重要經驗的學習效率

### 5. 自適應學習率
- 根據狀態訪問次數調整學習率
- 提高學習穩定性

這些改進使 SARSA 演算法更加穩定、高效且易於使用，同時保持了其 on-policy 的核心特性，為進一步的強化學習研究奠定了良好基礎。 