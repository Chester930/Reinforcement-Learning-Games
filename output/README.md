# Q-Table 與 Log 檔案格式說明

## 1. Q-Table（CSV）
- 欄位：state, action, value
- 範例：

```
state,action,value
(0,0),up,0.0
(0,0),right,0.5
(0,1),down,-0.2
...
```
- state：可用座標 (row, col) 或自訂編碼
- action：如 up/down/left/right
- value：Q 值

## 2. Log（CSV）
- 欄位：episode, step, state, action, reward, next_state, done
- 範例：

```
episode,step,state,action,reward,next_state,done
1,1,(0,0),right,0.0,(0,1),False
1,2,(0,1),down,-1.0,(1,1),False
...
```
- episode：第幾回合
- step：該回合第幾步
- state/next_state：座標 (row, col)
- action：動作
- reward：即時回饋
- done：是否結束（True/False）

## 3. 檔案儲存建議
- 所有訓練產生物建議放於 output/ 目錄下
- 可依演算法、地圖、時間等命名檔案 