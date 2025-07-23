# Q-Learning 改進說明

## 概述
根據用戶的建議，對 Q-Learning 演算法進行了全面的改進，解決了潛在問題並增強了功能。以下是詳細的改進內容。

## 🔧 修正的問題

### 1. 障礙物獎勵混淆
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

### 2. 終止條件不一致
**問題**：`is_terminal` 函數定義了 GOAL 和 TRAP 為終止狀態，但實際只在 GOAL 時終止。

**修正**：
```python
def is_terminal(cell):
    """判斷是否為終止狀態（目標或陷阱）"""
    return cell in [GOAL, TRAP]

# 修正終止條件：目標或陷阱都終止回合
if is_terminal(cell) or step == MAX_STEPS:
    break
```

**影響**：陷阱現在會正確終止回合，符合設計意圖。

---

### 3. 探索率固定
**問題**：EPSILON 固定為 0.1，缺乏衰減機制。

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

### 4. 地圖驗證不足
**問題**：程式未處理地圖無效的情況（如無目標 G）。

**修正**：
```python
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
```

**影響**：在訓練開始前驗證地圖有效性，避免無意義的訓練。

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
print(f"\n訓練完成！")
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

## 📊 改進效果

### 1. 學習效率提升
- **探索率衰減**：從高探索開始，逐漸轉向利用，提高學習效率
- **樂觀初始化**：可選的樂觀初始化可能加速收斂

### 2. 穩定性增強
- **地圖驗證**：避免無效地圖導致的訓練失敗
- **隨機種子**：確保結果可重現，便於實驗比較

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
python q_learning.py --episodes 1000

# 自訂初始探索率
python q_learning.py --episodes 1000 --epsilon 0.5
```

### 2. 可重現實驗
```bash
# 設定隨機種子
python q_learning.py --episodes 500 --seed 42
```

### 3. 樂觀初始化
```bash
# 使用樂觀初始化
python q_learning.py --episodes 500 --optimistic
```

### 4. 完整參數設定
```bash
python q_learning.py \
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

## 🔍 進一步改進建議

### 1. 自適應學習率
- 根據訓練進度動態調整學習率
- 使用學習率調度器

### 2. 經驗回放
- 實作經驗回放機制
- 提高樣本效率

### 3. 目標網路
- 使用目標網路提高穩定性
- 定期更新目標網路

### 4. 優先級經驗回放
- 根據 TD 誤差設定優先級
- 提高重要經驗的學習效率

### 5. 多步學習
- 使用 n-step 回報
- 平衡偏差和方差

這些改進使 Q-Learning 演算法更加穩定、高效且易於使用，為進一步的強化學習研究奠定了良好基礎。 