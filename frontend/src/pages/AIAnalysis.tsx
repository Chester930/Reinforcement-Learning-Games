import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../Layout';
import { Typography, Box, Paper, Select, MenuItem, Button, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import AIAnalysisPathSim from './AIAnalysisPathSim';
import LearningCurveChart from './LearningCurveChart';

// 簡單的 markdown 轉 HTML 函數
const markdownToHtml = (markdown: string): string => {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br>');
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE = 'http://localhost:8000';

const AIAnalysis: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobInfo, setJobInfo] = useState<any>(null);
  const [curveData, setCurveData] = useState<{rewards:number[];steps:number[]}|null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [pathUrl, setPathUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReanalyze, setShowReanalyze] = useState(false);
  const [mapData, setMapData] = useState<string[][] | null>(null);
  const [optimalPath, setOptimalPath] = useState<[number, number][] | null>(null);
  const [verifyResult, setVerifyResult] = useState<{verify_ok: boolean, verify_output: string} | null>(null);
  const [jobConfig, setJobConfig] = useState<any>(null);
  const [ruleData, setRuleData] = useState<any>(null);
  const [mapDataInfo, setMapDataInfo] = useState<any>(null);
  const [extractedChartData, setExtractedChartData] = useState<{ rewards: number[]; steps: number[] } | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!selectedJob) return;
    setReportLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE}/analysis/${selectedJob}/analyze-and-save`, {
        user_prompt: '請分析這個強化學習訓練結果'
      });
      
      if (response.data && (response.data.md || response.data.html)) {
        // 優先用 html，否則用 markdown 轉 html
        let htmlContent = '';
        if (response.data.html) {
          htmlContent = response.data.html;
        } else if (response.data.md) {
          htmlContent = markdownToHtml(response.data.md);
        }
        setReport(htmlContent);
        setShowReanalyze(true);
      } else {
        setError('分析完成但沒有返回內容');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '分析失敗');
    } finally {
      setReportLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    axios.get(`${API_BASE}/train/train/jobs`).then(res => setJobs(res.data));
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    setCurveData(null); setHeatmapUrl(null); setPathUrl(null); setReport(null); setError(null);
    setShowReanalyze(false);
    setMapData(null); setOptimalPath(null);
    setVerifyResult(null);
    const info = jobs.find(j => j.job_id === selectedJob);
    setJobInfo(info);

    const loadData = async () => {
      try {
        // 並行載入所有數據
        const [curveRes, heatmapRes, pathRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/analysis/${selectedJob}/curve`),
          axios.get(`${API_BASE}/analysis/${selectedJob}/heatmap`),
          axios.get(`${API_BASE}/analysis/${selectedJob}/optimal-path`)
        ]);
        if (curveRes.status === 'fulfilled') {
          setCurveData(curveRes.value.data);
        }
        if (heatmapRes.status === 'fulfilled' && heatmapRes.value.data.heatmap_png_base64) {
          setHeatmapUrl(`data:image/png;base64,${heatmapRes.value.data.heatmap_png_base64}`);
        }
        if (pathRes.status === 'fulfilled' && pathRes.value.data.path_png_base64) {
          setPathUrl(`data:image/png;base64,${pathRes.value.data.path_png_base64}`);
        }
        // 載入 map.json
        axios.get(`${API_BASE}/jobs/${selectedJob}/map.json`).then(res => {
          if (res.data && res.data.map) setMapData(res.data.map);
        });
        // 載入 optimal-path
        axios.get(`${API_BASE}/analysis/${selectedJob}/optimal-path`).then(res => {
          if (res.data && res.data.optimal_path) setOptimalPath(res.data.optimal_path);
        });
        // 載入自動驗證結果
        try {
          const verifyRes = await axios.get(`${API_BASE}/analysis/${selectedJob}/verify`);
          setVerifyResult(verifyRes.data);
        } catch (e) {
          setVerifyResult(null);
        }
        // 先嘗試載入 analysis.html
        try {
          const htmlRes = await axios.get(`${API_BASE}/analysis/${selectedJob}/analysis.html`);
          if (htmlRes.data && typeof htmlRes.data === 'string' && htmlRes.data.includes('<html')) {
            setReport(htmlRes.data);
            setShowReanalyze(true);
            return;
          }
        } catch (e) { /* 忽略找不到 html */ }
        // fallback: 載入 analysis.md
        try {
          const mdRes = await axios.get(`${API_BASE}/analysis/${selectedJob}/analysis.md`);
          if (mdRes.data && typeof mdRes.data === 'string') {
            setReport(markdownToHtml(mdRes.data));
            setShowReanalyze(true);
            return;
          }
        } catch (e) { /* 忽略找不到 md */ }
        // fallback: 舊邏輯
        try {
          const reportRes = await axios.get(`${API_BASE}/analysis/${selectedJob}/report`);
          if (reportRes.data && reportRes.data.content) {
            const htmlContent = markdownToHtml(reportRes.data.content);
            setReport(htmlContent);
            setShowReanalyze(true);
          } else {
            // 沒有現有報告，自動分析
            await handleAnalyze();
          }
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            // 沒有現有報告，自動分析
            await handleAnalyze();
          } else {
            setError('載入分析報告失敗');
          }
        }
        // 載入 config.json
        axios.get(`${API_BASE}/jobs/${selectedJob}/config.json`).then(res => {
          setJobConfig(res.data);
          // 優先載入 job 專屬 rule.json
          axios.get(`${API_BASE}/jobs/${selectedJob}/rule.json`).then(ruleRes => {
            setRuleData(ruleRes.data);
          }).catch(() => {
            // 若不存在則 fallback 到 rules 目錄
            if (res.data.rule_id) {
              axios.get(`${API_BASE}/rules/rules/${res.data.rule_id}`).then(ruleRes2 => {
                setRuleData(ruleRes2.data);
              }).catch(() => setRuleData(null));
            } else {
              setRuleData(null);
            }
          });
          // 載入地圖資訊
          if (res.data.map_id) {
            axios.get(`${API_BASE}/maps/maps/${res.data.map_id}`).then(mapRes => {
              setMapDataInfo(mapRes.data);
            }).catch(() => setMapDataInfo(null));
          } else {
            setMapDataInfo(null);
          }
        }).catch(() => { setJobConfig(null); setRuleData(null); setMapDataInfo(null); });
      } catch (error) {
        console.error('載入數據時發生錯誤:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedJob, jobs, handleAnalyze]);

  useEffect(() => {
    // 解析 AI 回覆中的學習曲線資料
    const tempDiv = document.createElement('div');
    if (report) {
      tempDiv.innerHTML = report;
      const el = tempDiv.querySelector('#learningCurveData');
      if (el) {
        try {
          const rewards = JSON.parse(el.getAttribute('data-rewards') || '[]');
          const steps = JSON.parse(el.getAttribute('data-steps') || '[]');
          if (Array.isArray(rewards) && Array.isArray(steps) && rewards.length && steps.length) {
            setExtractedChartData({ rewards, steps });
          } else {
            setExtractedChartData(null);
          }
        } catch {
          setExtractedChartData(null);
        }
      } else {
        setExtractedChartData(null);
      }
      // 自動提取 <style> 並插入 <head>
      const styleMatch = report.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch) {
        let styleTag = document.getElementById('ai-analysis-style') as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'ai-analysis-style';
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = styleMatch[1];
      }
    } else {
      setExtractedChartData(null);
      // 移除舊的 style
      const oldStyle = document.getElementById('ai-analysis-style');
      if (oldStyle) oldStyle.remove();
    }
  }, [report]);

  const handleReanalyze = async () => {
    if (!selectedJob) return;
    setReportLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE}/analysis/${selectedJob}/analyze-and-save`, {
        user_prompt: '請重新分析這個強化學習訓練結果'
      });
      
      if (response.data && (response.data.md || response.data.html)) {
        let htmlContent = '';
        if (response.data.html) {
          htmlContent = response.data.html;
        } else if (response.data.md) {
          htmlContent = markdownToHtml(response.data.md);
        }
        setReport(htmlContent);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '重新分析失敗');
    } finally {
      setReportLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Learning Curve',
      },
    },
  };

  const chartData: ChartData<'line'> | null = curveData ? {
    labels: Array.from({ length: curveData.rewards.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Total Reward',
        data: curveData.rewards,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Steps',
        data: curveData.steps,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        yAxisID: 'y1',
      },
    ],
  } : null;

  // 嘗試從 report 解析出學習曲線資料
  let rewards: number[] | null = null;
  let steps: number[] | null = null;
  if (report) {
    try {
      // 嘗試直接解析 JSON 區塊
      const match = report.match(/"rewards"\s*:\s*\[[\s\S]*?\]/);
      const match2 = report.match(/"steps"\s*:\s*\[[\s\S]*?\]/);
      if (match && match2) {
        rewards = JSON.parse('{' + match[0] + '}').rewards;
        steps = JSON.parse('{' + match2[0] + '}').steps;
      }
    } catch (e) {
      // 忽略解析錯誤
    }
  }

  return (
    <Layout title="AI 分析">
      <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          📊 AI 訓練分析與報告
        </Typography>
        
        <Box sx={{ p: 2, background: '#f0f8ff', borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#555' }}>
            <b>📋 分析頁面說明：</b><br/>
            • <b>選擇訓練紀錄</b>：從下拉選單選擇要分析的AI訓練結果<br/>
            • <b>智能分析</b>：首次選擇自動分析，重新選擇載入已保存結果<br/>
            • <b>重新分析</b>：點擊按鈕可重新生成分析報告<br/>
            • <b>整合報告</b>：包含學習曲線、熱力圖、最優路徑和AI分析<br/>
            <br/>
            <b>💡 使用建議：</b> 先完成AI訓練，再來此頁面查看分析結果。
          </Typography>
        </Box>

        <Paper sx={{ p: 3, background: '#f5fbe7', borderRadius: 3 }}>
          {/* 選擇訓練紀錄和重新分析按鈕 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography>選擇訓練紀錄：</Typography>
            <Select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} sx={{ minWidth: 220 }}>
              {jobs.map(j => (
                <MenuItem key={j.job_id} value={j.job_id}>
                  {j.job_name || j.job_id}（{j.created_at?.slice(0,19).replace('T',' ')}）
                </MenuItem>
              ))}
            </Select>
            {showReanalyze && !reportLoading && (
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={handleReanalyze}
                sx={{ fontSize: '0.8rem' }}
              >
                🔄 重新分析
              </Button>
            )}
          </Box>

          {jobInfo && (
            <Box sx={{ mb: 2, color: '#888' }}>
              <Typography variant="body2">訓練名稱：{jobInfo.job_name}</Typography>
              <Typography variant="body2">建立時間：{jobInfo.created_at?.slice(0,19).replace('T',' ')}</Typography>
              <Typography variant="body2">Job ID：{jobInfo.job_id}</Typography>
            </Box>
          )}

          {loading && <CircularProgress />}
          
          {!loading && selectedJob && (
            <Box>
              {/* 分析報告（包含所有內容） */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c5aa0' }}>
                  🤖 強化學習訓練分析報告
                </Typography>
                
                {reportLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <CircularProgress size={20} />
                    <Typography>
                      {showReanalyze ? 'AI 正在重新分析訓練結果，請稍候...' : 'AI 正在分析訓練結果，請稍候...'}
                    </Typography>
                  </Box>
                )}

                {verifyResult && !verifyResult.verify_ok && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <b>訓練驗證異常：</b><br/>
                      <pre style={{whiteSpace:'pre-wrap'}}>{verifyResult.verify_output}</pre>
                    </Typography>
                  </Alert>
                )}

                {report && (
                  <Paper sx={{ p: 3, background: '#fff', borderRadius: 2, mb: 3 }}>
                    <Box sx={{ mb: 3, p: 2, background: '#e3f2fd', borderRadius: 2, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <Box sx={{ minWidth: 220, flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>🛠️ 訓練參數</Typography>
                        {jobConfig ? (
                          <Typography variant="body2" sx={{ color: '#333' }}>
                            <b>演算法：</b> {jobConfig.algorithm}<br/>
                            <b>回合數：</b> {jobConfig.episodes}<br/>
                            <b>學習率：</b> {jobConfig.learning_rate}<br/>
                            <b>折扣因子：</b> {jobConfig.discount_factor}<br/>
                            <b>初始探索率：</b> {jobConfig.epsilon}<br/>
                            <b>樂觀初始化：</b> {jobConfig.optimistic ? '是' : '否'}<br/>
                            {jobConfig.seed !== null && <><b>隨機種子：</b> {jobConfig.seed}<br/></>}
                            {jobConfig.lambda_param !== undefined && <><b>λ 參數：</b> {jobConfig.lambda_param}<br/></>}
                          </Typography>
                        ) : <Typography variant="body2" sx={{ color: '#888' }}>無訓練參數資訊</Typography>}
                      </Box>
                      {/* 規則細節區塊 */}
                      <Box sx={{ minWidth: 220, flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>🎮 規則細節</Typography>
                        {ruleData ? (
                          <Typography variant="body2" sx={{ color: '#333' }}>
                            <b>寶藏得分：</b> {ruleData.bonusReward}<br/>
                            <b>步數懲罰：</b> {ruleData.stepPenalty}<br/>
                            <b>步數衰減：</b> {ruleData.stepDecay}<br/>
                            <b>終點獎勵：</b> {ruleData.goalReward}<br/>
                            <b>撞牆懲罰：</b> {ruleData.wallPenalty}<br/>
                            <b>最大步數：</b> {ruleData.maxSteps}
                          </Typography>
                        ) : <Typography variant="body2" sx={{ color: '#888' }}>無規則資訊</Typography>}
                      </Box>
                      <Box sx={{ minWidth: 220, flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>🗺️ 地圖資訊</Typography>
                        {mapDataInfo ? (
                          <Typography variant="body2" sx={{ color: '#333' }}>
                            <b>地圖名稱：</b> {mapDataInfo.name}<br/>
                            <b>尺寸：</b> {mapDataInfo.size ? `${mapDataInfo.size[0]} x ${mapDataInfo.size[1]}` : ''}<br/>
                            <b>起點：</b> {mapDataInfo.start ? mapDataInfo.start.join(',') : ''}<br/>
                            <b>終點：</b> {mapDataInfo.goal ? mapDataInfo.goal.join(',') : ''}<br/>
                            <b>寶藏格：</b> {mapDataInfo.bonuses ? Object.keys(mapDataInfo.bonuses).join('、') : ''}<br/>
                            <b>陷阱格：</b> {mapDataInfo.traps ? Object.keys(mapDataInfo.traps).join('、') : ''}
                          </Typography>
                        ) : <Typography variant="body2" sx={{ color: '#888' }}>無地圖資訊</Typography>}
                      </Box>
                    </Box>
                    {/* 學習曲線圖表（自動解析 data-rewards/data-steps） */}
                    {extractedChartData && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c5aa0' }}>
                          📈 學習曲線分析
                        </Typography>
                        <LearningCurveChart rewards={extractedChartData.rewards} steps={extractedChartData.steps} />
                      </Box>
                    )}

                    {/* Q-Table 熱力圖 */}
                    {heatmapUrl && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c5aa0' }}>
                          🔥 Q-Table 熱力圖分析
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <img src={heatmapUrl} alt="熱力圖" style={{ maxWidth: '100%', maxHeight: 400, background: '#fff', border: '1px solid #ddd', borderRadius: 4 }} />
                        </Box>
                        <Box sx={{ p: 2, background: '#fff5f5', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#555' }}>
                            <b>🔥 熱力圖說明：</b><br/>
                            • <b>顏色深淺</b>：代表Q值大小，越深表示該狀態-動作對的價值越高<br/>
                            • <b>行（State）</b>：不同的位置狀態<br/>
                            • <b>列（Action）</b>：四個方向動作（上、下、左、右）<br/>
                            • <b>學習效果</b>：顏色分布越明顯表示AI學習效果越好
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* 最優路徑 */}
                    {mapData && optimalPath && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c5aa0' }}>
                          🎯 最優路徑分析（動畫模擬）
                        </Typography>
                        <AIAnalysisPathSim map={mapData} path={optimalPath} />
                        <Box sx={{ p: 2, background: '#f0fff0', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#555' }}>
                            <b>🎯 最優路徑說明：</b><br/>
                            • <b>路徑顯示</b>：AI根據學習到的Q-Table選擇的最佳行動序列<br/>
                            • <b>起點</b>：🧑‍🌾 探險家起始位置<br/>
                            • <b>終點</b>：🏁 目標位置<br/>
                            • <b>路徑特點</b>：避開陷阱，收集寶箱，尋找最短到達終點的路徑
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* AI 文字分析報告 */}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2c5aa0' }}>
                        📝 AI 深度分析報告
                      </Typography>
                      <Box sx={{ p: 3, background: '#fffbe7', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                        <div dangerouslySetInnerHTML={{ __html: report }} />
                      </Box>
                    </Box>
                  </Paper>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <b>分析失敗</b><br/>
                      可能原因：<br/>
                      • 訓練數據不完整或格式錯誤<br/>
                      • AI 分析服務暫時不可用<br/>
                      • 數據格式不支援<br/>
                      請稍後重試或檢查訓練是否完成。
                    </Typography>
                  </Alert>
                )}
                {/* 錯誤時也顯示重新分析按鈕 */}
                {error && selectedJob && !reportLoading && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={handleReanalyze}
                    sx={{ fontSize: '0.8rem', mt: 1 }}
                  >
                    🔄 重新分析
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
};

export default AIAnalysis; 