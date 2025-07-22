import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Tabs, Tab, Paper, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import Layout from '../Layout';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const API_BASE = 'http://localhost:8000';

const mockMaps = [
  { id: '1', name: '叢林初探', size: [6, 6] },
  { id: '2', name: '神廟迷宮', size: [8, 8] },
];

// 拖拉式地圖編輯器元件（簡化版）
const TOOL_ICONS = [
  { type: 'start', icon: <span style={{ fontSize: 32 }}>🧑‍🌾</span>, label: '起點' },
  { type: 'goal', icon: <span style={{ fontSize: 32 }}>🏁</span>, label: '終點' },
  { type: 'bonus', icon: <span style={{ fontSize: 32 }}>🪙</span>, label: '寶箱' },
  { type: 'trap', icon: <span style={{ fontSize: 32 }}>🕳️</span>, label: '陷阱' },
  { type: 'obstacle', icon: <span style={{ fontSize: 32 }}>🪨</span>, label: '障礙物' },
];

// 型別定義
interface MapCell { type: string; value?: number; }
interface DragMapEditorProps {
  mapData: MapCell[][];
  setMapData: React.Dispatch<React.SetStateAction<MapCell[][]>>;
  mapName: string;
  setMapName: React.Dispatch<React.SetStateAction<string>>;
  size: [number, number];
  setSize: React.Dispatch<React.SetStateAction<[number, number]>>;
}

function DragMapEditor({
  mapData,
  setMapData,
  mapName,
  setMapName,
  size,
  setSize,
}: DragMapEditorProps) {
  const [selectedTool, setSelectedTool] = useState<string>('');
  // 初始化地圖
  useEffect(() => {
    if (!mapData.length || mapData.length !== size[0] || mapData[0].length !== size[1]) {
      const newMap = Array.from({ length: size[0] }, () => Array.from({ length: size[1] }, () => ({ type: 'empty' })));
      setMapData(newMap);
    }
    // eslint-disable-next-line
  }, [size[0], size[1]]);
  // 點擊格子放置
  const handleCellClick = (row: number, col: number) => {
    if (!selectedTool) return;
    const newMap = mapData.map((r: MapCell[]) => r.slice());
    newMap[row][col] = { type: selectedTool };
    setMapData(newMap);
    setSelectedTool('');
  };
  // 拖拉放置（支援工具列與地圖內互拖）
  const handleDrop = (row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const fromRow = e.dataTransfer.getData('fromRow');
    const fromCol = e.dataTransfer.getData('fromCol');
    const newMap = mapData.map((r: MapCell[]) => r.slice());
    if (fromRow && fromCol) {
      // 地圖內互拖
      const fr = parseInt(fromRow, 10);
      const fc = parseInt(fromCol, 10);
      const temp = newMap[row][col];
      newMap[row][col] = newMap[fr][fc];
      newMap[fr][fc] = temp;
    } else if (type) {
      // 工具列拖進來
      newMap[row][col] = { type };
    }
    setMapData(newMap);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
      {/* 左側工具列 */}
      <Box sx={{ minWidth: 220, maxWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {/* <TextField label="地圖名稱" value={mapName} onChange={e => setMapName(e.target.value)} sx={{ width: 220, mb: 2 }} /> */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="行數" type="number" value={size[0]} onChange={e => setSize([Number(e.target.value), size[1]])} sx={{ width: 80 }} />
          <TextField label="列數" type="number" value={size[1]} onChange={e => setSize([size[0], Number(e.target.value)])} sx={{ width: 80 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {TOOL_ICONS.map(tool => (
            <Box key={tool.type} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab' }}
              draggable
              onDragStart={e => e.dataTransfer.setData('type', tool.type)}
              onClick={() => setSelectedTool(tool.type)}
            >
              {tool.icon}
              <Typography variant="caption">{tool.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* 右側地圖格子 */}
      <Paper sx={{ p: 2, background: '#f5fbe7', minWidth: 48 * size[1] + 16, maxHeight: '60vh', overflow: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${size[1]}, 48px)`, gap: 0 }}>
          {mapData.map((row: MapCell[], rowIdx: number) =>
            row.map((cell: MapCell, colIdx: number) => {
              const isDraggable = cell.type !== 'empty';
              return (
                <Box key={`${rowIdx}-${colIdx}`} sx={{ width: 48, height: 48, border: '1px solid #bdb76b', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: '#e6f9d5', cursor: 'pointer', m: 0.2 }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onDrop={e => handleDrop(rowIdx, colIdx, e)}
                  onDragOver={handleDragOver}
                >
                  {isDraggable ? (
                    <Box
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('type', cell.type);
                        e.dataTransfer.setData('fromRow', rowIdx.toString());
                        e.dataTransfer.setData('fromCol', colIdx.toString());
                      }}
                      sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {TOOL_ICONS.find(t => t.type === cell.type)?.icon}
                    </Box>
                  ) : TOOL_ICONS.find(t => t.type === cell.type)?.icon}
                </Box>
              );
            })
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// 規則型別
interface RuleForm {
  id: string;
  name: string;
  bonusReward: number;
  trapPenalty: number;
  stepDecay: number;
  stepPenalty: number;
  goalReward: number;
  wallPenalty: number;
  maxSteps: number;
}

const MapManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  // 地圖管理狀態
  const [maps, setMaps] = useState<any[]>([]);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [isEditMap, setIsEditMap] = useState(false);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [mapForm, setMapForm] = useState({ name: '', size: [6, 6] });

  // 規則管理狀態
  const [rules, setRules] = useState<any[]>([]);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState<RuleForm>({
    id: '',
    name: '',
    bonusReward: 20,
    trapPenalty: -20,
    stepDecay: 0.99,
    stepPenalty: 0,
    goalReward: 100,
    wallPenalty: -5,
    maxSteps: 100,
  });
  const [isEditRule, setIsEditRule] = useState(false);

  // 地圖編輯器狀態
  const [mapData, setMapData] = useState<MapCell[][]>([]);
  const [mapName, setMapName] = useState('');
  const [mapSize, setMapSize] = useState<[number, number]>([6, 6]);

  // 預覽展開狀態
  const [previewMapId, setPreviewMapId] = useState<string | null>(null);
  const [previewMapData, setPreviewMapData] = useState<any>(null);

  // Tab 切換
  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  // 載入地圖列表
  useEffect(() => {
    if (tab === 0) fetchMaps();
    if (tab === 1) fetchRules();
    // eslint-disable-next-line
  }, [tab]);

  const fetchMaps = async () => {
    const res = await axios.get(`${API_BASE}/maps/maps`);
    setMaps(res.data);
  };

  // 創建地圖
  const handleCreateMap = () => {
    setMapForm({ name: '', size: [6, 6] });
    setMapName('');
    setMapSize([6, 6]);
    setMapData([]);
    setIsEditMap(false);
    setEditingMapId(null);
    setShowMapDialog(true);
  };

  // 編輯地圖
  const handleEditMap = async (map: any) => {
    const res = await axios.get(`${API_BASE}/maps/maps/${map.id}`);
    setMapForm({ name: res.data.name, size: res.data.size });
    setMapName(res.data.name);
    setMapSize(res.data.size);
    setMapData(res.data.map.map((row: string[]) => row.map((cell: string) => {
      switch (cell) {
        case 'S': return { type: 'start' };
        case 'G': return { type: 'goal' };
        case 'R': return { type: 'bonus' };
        case 'T': return { type: 'trap' };
        case '1': return { type: 'obstacle' };
        default: return { type: 'empty' };
      }
    })));
    setIsEditMap(true);
    setEditingMapId(map.id);
    setShowMapDialog(true);
  };

  // 地圖表單變更
  const handleMapFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapForm({ ...mapForm, [e.target.name]: e.target.value });
  };

  // 地圖儲存
  const handleSaveMap = async () => {
    // 轉換為 API 格式
    const numRows = mapSize[0];
    const numCols = mapSize[1];
    let start: [number, number] = [0, 0];
    let goal: [number, number] = [0, 0];
    const obstacles: [number, number][] = [];
    const bonuses: { [key: string]: number } = {};
    const traps: { [key: string]: number } = {};
    const mapGrid: string[][] = [];
    for (let i = 0; i < numRows; i++) {
      mapGrid[i] = [];
      for (let j = 0; j < numCols; j++) {
        const cell = mapData[i]?.[j] || { type: 'empty' };
        switch (cell.type) {
          case 'start': start = [i, j]; mapGrid[i][j] = 'S'; break;
          case 'goal': goal = [i, j]; mapGrid[i][j] = 'G'; break;
          case 'bonus': bonuses[`${i},${j}`] = 20; mapGrid[i][j] = 'R'; break;
          case 'trap': traps[`${i},${j}`] = -20; mapGrid[i][j] = 'T'; break;
          case 'obstacle': obstacles.push([i, j]); mapGrid[i][j] = '1'; break;
          default: mapGrid[i][j] = '0';
        }
      }
    }
    const apiData = {
      name: mapName,
      size: [numRows, numCols],
      start,
      goal,
      obstacles,
      bonuses,
      traps,
      map: mapGrid
    };
    if (isEditMap && editingMapId) {
      await axios.put(`${API_BASE}/maps/maps/${editingMapId}`, apiData);
    } else {
      await axios.post(`${API_BASE}/maps/maps/json`, apiData);
    }
    setShowMapDialog(false);
    fetchMaps();
  };

  // 刪除地圖
  const handleDeleteMap = async () => {
    if (editingMapId) {
      await axios.delete(`${API_BASE}/maps/maps/${editingMapId}`);
      setShowMapDialog(false);
      fetchMaps();
    }
  };

  // 載入規則列表
  useEffect(() => {
    if (tab === 1) fetchRules();
    // eslint-disable-next-line
  }, [tab]);

  const fetchRules = async () => {
    const res = await axios.get(`${API_BASE}/rules/rules`);
    setRules(res.data);
  };

  // 建立/編輯規則表單處理
  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRuleForm({
      ...ruleForm,
      [name]: name === 'name' ? value : Number(value)
    });
  };

  // 新增規則
  const handleCreateRule = async () => {
    await axios.post(`${API_BASE}/rules/rules`, ruleForm);
    setShowRuleDialog(false);
    setRuleForm({
      id: '',
      name: '',
      bonusReward: 20,
      trapPenalty: -20,
      stepDecay: 0.99,
      stepPenalty: 0,
      goalReward: 100,
      wallPenalty: -5,
      maxSteps: 100,
    });
    fetchRules();
  };

  // 編輯規則
  const handleEditRule = (rule: any) => {
    setRuleForm({
      id: rule.id,
      name: rule.name,
      bonusReward: rule.bonusReward ?? 20,
      trapPenalty: rule.trapPenalty ?? -20,
      stepDecay: rule.stepDecay ?? 0.99,
      stepPenalty: rule.stepPenalty ?? 0,
      goalReward: rule.goalReward ?? 100,
      wallPenalty: rule.wallPenalty ?? -5,
      maxSteps: rule.maxSteps ?? 100,
    });
    setIsEditRule(true);
    setShowRuleDialog(true);
  };
  const handleUpdateRule = async () => {
    await axios.put(`${API_BASE}/rules/rules/${ruleForm.id}`, ruleForm);
    setShowRuleDialog(false);
    setIsEditRule(false);
    setRuleForm({
      id: '',
      name: '',
      bonusReward: 20,
      trapPenalty: -20,
      stepDecay: 0.99,
      stepPenalty: 0,
      goalReward: 100,
      wallPenalty: -5,
      maxSteps: 100,
    });
    fetchRules();
  };

  // 刪除規則
  const handleDeleteRule = async (id: string) => {
    await axios.delete(`${API_BASE}/rules/rules/${id}`);
    fetchRules();
  };

  // 展開/收合預覽
  const handleTogglePreview = async (map: any) => {
    if (previewMapId === map.id) {
      setPreviewMapId(null);
      setPreviewMapData(null);
    } else {
      const res = await axios.get(`${API_BASE}/maps/maps/${map.id}`);
      setPreviewMapId(map.id);
      setPreviewMapData(res.data.map);
    }
  };

  // 小地圖預覽元件
  function MiniMapPreview({ map }: { map: string[][] }) {
    if (!map) return null;
    return (
      <Paper sx={{ p: 1, mt: 1, display: 'inline-block', background: '#f5fbe7' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${map[0]?.length || 0}, 24px)`, gap: 0 }}>
          {map.map((row: string[], rowIdx: number) =>
            row.map((cell: string, colIdx: number) => {
              let icon = null;
              switch (cell) {
                case 'S': icon = <span style={{ fontSize: 18 }}>🧑‍🌾</span>; break;
                case 'G': icon = <span style={{ fontSize: 18 }}>🏁</span>; break;
                case 'R': icon = <span style={{ fontSize: 18 }}>🪙</span>; break;
                case 'T': icon = <span style={{ fontSize: 18 }}>🕳️</span>; break;
                case '1': icon = <span style={{ fontSize: 18 }}>🪨</span>; break;
                default: icon = null;
              }
              return (
                <Box key={`${rowIdx}-${colIdx}`} sx={{ width: 24, height: 24, border: '1px solid #bdb76b', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: '#e6f9d5', m: 0.1 }}>
                  {icon}
                </Box>
              );
            })
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Layout title="地圖管理">
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="我的地圖" />
        <Tab label="我的規則" />
      </Tabs>
      {/* 我的地圖 */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">地圖列表</Typography>
            <Button variant="contained" color="primary" onClick={handleCreateMap}>
              創建地圖
            </Button>
          </Box>
          <Paper sx={{ mb: 2 }}>
            <List>
              {maps.map(map => (
                <React.Fragment key={map.id}>
                  <ListItem secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={() => handleTogglePreview(map)}>
                        {previewMapId === map.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Button variant="outlined" size="small" onClick={() => handleEditMap(map)} sx={{ ml: 1 }}>
                        編輯
                      </Button>
                    </Box>
                  }>
                    <ListItemText primary={map.name} secondary={`尺寸：${map.size[0]}x${map.size[1]}`}/>
                  </ListItem>
                  {previewMapId === map.id && (
                    <Box sx={{ pl: 6 }}>
                      <MiniMapPreview map={previewMapData} />
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          {/* 地圖編輯器 Dialog */}
          <Dialog open={showMapDialog} onClose={() => setShowMapDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>{isEditMap ? '編輯地圖' : '創建地圖'}</DialogTitle>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TextField label="地圖名稱" value={mapName} onChange={e => setMapName(e.target.value)} sx={{ width: 320, mb: 2, mt: 1, zIndex: 2, background: '#fff', borderRadius: 2 }} />
              <DialogContent sx={{ overflow: 'auto', maxHeight: '70vh', minWidth: 'unset', maxWidth: 'fit-content', p: 0 }}>
                <DragMapEditor
                  mapData={mapData}
                  setMapData={setMapData}
                  mapName={mapName}
                  setMapName={setMapName}
                  size={mapSize}
                  setSize={setMapSize}
                />
              </DialogContent>
            </Box>
            <DialogActions>
              {isEditMap && (
                <Button color="error" onClick={handleDeleteMap}>刪除</Button>
              )}
              <Button onClick={() => setShowMapDialog(false)}>取消</Button>
              <Button variant="contained" onClick={handleSaveMap}>{isEditMap ? '儲存' : '建立'}</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      {/* 我的規則 */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">規則列表</Typography>
            <Button variant="contained" color="secondary" onClick={() => { setShowRuleDialog(true); setIsEditRule(false); setRuleForm({
              id: '',
              name: '',
              bonusReward: 20,
              trapPenalty: -20,
              stepDecay: 0.99,
              stepPenalty: 0,
              goalReward: 100,
              wallPenalty: -5,
              maxSteps: 100,
            }); }}>
              建立規則
            </Button>
          </Box>
          <Paper sx={{ mb: 2 }}>
            <List>
              {rules.map(rule => (
                <ListItem key={rule.id} secondaryAction={
                  <Box>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleEditRule(rule)}>
                      編輯
                    </Button>
                    <IconButton color="error" onClick={() => handleDeleteRule(rule.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }>
                  <ListItemText primary={rule.name} secondary={`獎勵: ${rule.reward}，陷阱: ${rule.trap}，步數衰減: ${rule.stepDecay}`}/>
                </ListItem>
              ))}
            </List>
          </Paper>
          {/* 規則建立/編輯 Dialog */}
          <Dialog open={showRuleDialog} onClose={() => setShowRuleDialog(false)}>
            <DialogTitle>規則設定</DialogTitle>
            <DialogContent sx={{ minWidth: 350 }}>
              <TextField label="規則名稱" name="name" value={ruleForm.name} onChange={handleRuleChange} sx={{ width: 320, mb: 2 }} />
              <TextField label="寶箱獎勵" name="bonusReward" type="number" value={ruleForm.bonusReward} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} />
              <TextField label="陷阱懲罰" name="trapPenalty" type="number" value={ruleForm.trapPenalty} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} />
              <TextField label="步數衰減" name="stepDecay" type="number" value={ruleForm.stepDecay} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.01 }} />
              <TextField label="每步懲罰" name="stepPenalty" type="number" value={ruleForm.stepPenalty} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.1 }} />
              <TextField label="終點獎勵" name="goalReward" type="number" value={ruleForm.goalReward} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} />
              <TextField label="撞牆懲罰" name="wallPenalty" type="number" value={ruleForm.wallPenalty} onChange={handleRuleChange} fullWidth sx={{ mb: 2 }} />
              <TextField label="最大步數" name="maxSteps" type="number" value={ruleForm.maxSteps} onChange={handleRuleChange} fullWidth />
              <Box sx={{ mt: 3, p: 2, background: '#f5fbe7', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>【參數說明】</Typography>
                <Typography variant="body2" sx={{ color: '#555' }}>
                  <b>寶箱獎勵</b>：每獲得一個寶箱可加多少分數。<br/>
                  <b>陷阱懲罰</b>：每踩到陷阱會扣多少分數。<br/>
                  <b>步數衰減</b>：每走一步，分數會乘上此衰減值（0~1）。<br/>
                  <b>每步懲罰</b>：每走一步會扣多少分數。<br/>
                  <b>終點獎勵</b>：抵達終點時加多少分數。<br/>
                  <b>撞牆懲罰</b>：嘗試走到牆或障礙物時扣多少分數。<br/>
                  <b>最大步數</b>：若遊戲步數達到最大步數，分數將歸零。<br/>
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>【分數計算公式】</Typography>
                <Typography variant="body2" sx={{ color: '#555' }}>
                  總分 = 終點獎勵 + (寶箱數 × 寶箱獎勵) + (陷阱數 × 陷阱懲罰) + (步數 × 每步懲罰) + 其他懲罰<br/>
                  每步分數會乘上步數衰減（如 0.99<sup>步數</sup>）。<br/>
                  若遊戲步數達到最大步數，分數將歸零。
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowRuleDialog(false)}>取消</Button>
              {isEditRule ? (
                <Button variant="contained" onClick={handleUpdateRule}>儲存</Button>
              ) : (
                <Button variant="contained" onClick={handleCreateRule}>建立</Button>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Layout>
  );
};

export default MapManagement; 