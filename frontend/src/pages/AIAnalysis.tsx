import React, { useEffect, useState } from 'react';
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
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [analyzedJobs, setAnalyzedJobs] = useState<Set<string>>(new Set());
  const [showReanalyze, setShowReanalyze] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/train/train/jobs`).then(res => setJobs(res.data));
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    setCurveData(null); setHeatmapUrl(null); setPathUrl(null); setReport(null); setError(null);
    setShowReanalyze(false);
    
    const info = jobs.find(j => j.job_id === selectedJob);
    setJobInfo(info);
    
    // 檢查是否已經分析過這個job
    const isAlreadyAnalyzed = analyzedJobs.has(selectedJob);
    
    // 學習曲線（JSON）
    axios.get(`${API_BASE}/analysis/analysis/${selectedJob}/curve`)
      .then(res => setCurveData(res.data))
      .catch(() => setCurveData(null));
    
    // 熱力圖
    axios.get(`${API_BASE}/analysis/analysis/${selectedJob}/heatmap`)
      .then(res => {
        if (res.data.heatmap_png_base64) {
          setHeatmapUrl(`data:image/png;base64,${res.data.heatmap_png_base64}`);
        } else {
          setHeatmapUrl(null);
        }
      })
      .catch(() => setHeatmapUrl(null));
    
    // 最優路徑
    axios.get(`${API_BASE}/analysis/analysis/${selectedJob}/optimal-path`)
      .then(res => {
        if (res.data.path_png_base64) {
          setPathUrl(`data:image/png;base64,${res.data.path_png_base64}`);
        } else {
          setPathUrl(null);
        }
      })
      .catch(() => setPathUrl(null));
    
    // 如果已經分析過，嘗試載入現有的分析報告
    if (isAlreadyAnalyzed) {
      axios.get(`${API_BASE}/analysis/analysis/${selectedJob}/report`)
        .then(res => {
          if (res.data && res.data.content) {
            // 將 markdown 轉換為 HTML
            const htmlContent = markdownToHtml(res.data.content);
            setReport(htmlContent);
          }
        })
        .catch(() => {
          // 如果載入失敗，標記為未分析
          setAnalyzedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedJob);
            return newSet;
          });
        });
    }
    
    setLoading(false);
  }, [selectedJob, jobs, analyzedJobs]);

  const handleAnalyze = async () => {
    setReportLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/analysis/analysis/${selectedJob}/analyze-and-save`);
      const reportContent = res.data.html || res.data.md || '分析完成，但無內容';
      setReport(reportContent);
      
      // 標記為已分析
      setAnalyzedJobs(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedJob);
        return newSet;
      });
      setShowReanalyze(true);
    } catch (e: any) {
      setError('分析失敗');
    }
    setReportLoading(false);
  };

  const handleReanalyze = async () => {
    setReportLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/analysis/analysis/${selectedJob}/analyze-and-save`);
      const reportContent = res.data.html || res.data.md || '分析完成，但無內容';
      setReport(reportContent);
    } catch (e: any) {
      setError('重新分析失敗');
    }
    setReportLoading(false);
  };

  useEffect(() => {
    if (!selectedJob) return;
    setAutoAnalyze(true);
  }, [selectedJob]);

  useEffect(() => {
    if (autoAnalyze && selectedJob && curveData && heatmapUrl && pathUrl && !report && !reportLoading) {
      // 檢查是否已經分析過
      if (!analyzedJobs.has(selectedJob)) {
        handleAnalyze();
      }
      setAutoAnalyze(false);
    }
    // eslint-disable-next-line
  }, [autoAnalyze, selectedJob, curveData, heatmapUrl, pathUrl, report, reportLoading, analyzedJobs]);

  // Chart.js options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Learning Curve' },
    },
  };

  let chartData: ChartData<'line'> | undefined = undefined;
  if (curveData) {
    const labels = curveData.rewards.map((_, i) => i + 1);
    chartData = {
      labels,
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
    };
  }

  return (
    <Layout title="AI 分析">
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          📊 AI 訓練分析與報告
        </Typography>
        <Box sx={{ p: 2, background: '#f0f8ff', borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#555' }}>
            <b>📋 分析頁面說明：</b><br/>
            • <b>選擇訓練紀錄</b>：從下拉選單選擇要分析的AI訓練結果<br/>
            • <b>學習曲線</b>：顯示AI在訓練過程中的表現變化<br/>
            • <b>Q-Table 熱力圖</b>：展示AI學習到的狀態-動作價值分布<br/>
            • <b>最優路徑</b>：AI根據學習結果選擇的最佳行動路徑<br/>
            • <b>AI 分析報告</b>：自動生成的詳細分析報告<br/>
            <br/>
            <b>🔄 智能分析功能：</b><br/>
            • <b>首次選擇</b>：自動執行AI分析並生成報告<br/>
            • <b>重新選擇</b>：直接載入已保存的分析結果<br/>
            • <b>重新分析</b>：點擊按鈕可重新生成分析報告<br/>
            <br/>
            <b>💡 使用建議：</b> 先完成AI訓練，再來此頁面查看分析結果。
          </Typography>
        </Box>
        <Paper sx={{ p: 3, background: '#f5fbe7', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography>選擇訓練紀錄：</Typography>
            <Select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} sx={{ minWidth: 220 }}>
              {jobs.map(j => (
                <MenuItem key={j.job_id} value={j.job_id}>
                  {j.job_name || j.job_id}（{j.created_at?.slice(0,19).replace('T',' ')}）
                </MenuItem>
              ))}
            </Select>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 學習曲線 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>📈 學習曲線</Typography>
                {curveData && chartData ? (
                  <Box>
                    <Line data={chartData} options={{
                      ...chartOptions,
                      scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Total Reward' } },
                        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Steps' }, grid: { drawOnChartArea: false } },
                      },
                    }} />
                    <Box sx={{ mt: 2, p: 2, background: '#f0f8ff', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        <b>📊 學習曲線說明：</b><br/>
                        • <b>藍線（Total Reward）</b>：每回合的總獎勵，越高表示AI表現越好<br/>
                        • <b>橙線（Steps）</b>：每回合的步數，越低表示AI找到更短的路徑<br/>
                        • <b>學習趨勢</b>：初期波動大，後期趨於穩定表示AI已學會最佳策略
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="warning">
                    無法載入學習曲線。可能原因：訓練尚未完成或數據格式錯誤。
                  </Alert>
                )}
              </Box>
              
              {/* 熱力圖 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>🔥 Q-Table 熱力圖</Typography>
                {heatmapUrl ? (
                  <Box>
                    <img src={heatmapUrl} alt="熱力圖" style={{ maxWidth: 400, background: '#fff', border: '1px solid #ddd' }} />
                    <Box sx={{ mt: 2, p: 2, background: '#fff5f5', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        <b>🔥 熱力圖說明：</b><br/>
                        • <b>顏色深淺</b>：代表Q值大小，越深表示該狀態-動作對的價值越高<br/>
                        • <b>行（State）</b>：不同的位置狀態<br/>
                        • <b>列（Action）</b>：四個方向動作（上、下、左、右）<br/>
                        • <b>學習效果</b>：顏色分布越明顯表示AI學習效果越好
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">
                    熱力圖生成中... 這需要Q-Table數據，請確保訓練已完成。
                  </Alert>
                )}
              </Box>
              
              {/* 最優路徑 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>🎯 最優路徑</Typography>
                {pathUrl ? (
                  <Box>
                    <img src={pathUrl} alt="最優路徑" style={{ maxWidth: 400, background: '#fff', border: '1px solid #ddd' }} />
                    <Box sx={{ mt: 2, p: 2, background: '#f0fff0', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        <b>🎯 最優路徑說明：</b><br/>
                        • <b>路徑顯示</b>：AI根據學習到的Q-Table選擇的最佳行動序列<br/>
                        • <b>起點</b>：🧑‍🌾 探險家起始位置<br/>
                        • <b>終點</b>：🏁 目標位置<br/>
                        • <b>路徑特點</b>：避開陷阱，收集寶箱，尋找最短到達終點的路徑
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">
                    最優路徑生成中... 這需要地圖和Q-Table數據，請確保訓練已完成。
                  </Alert>
                )}
              </Box>
              
              {/* AI 分析報告 */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>🤖 AI 分析報告</Typography>
                  {showReanalyze && !reportLoading && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      onClick={handleReanalyze}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      🔄 重新分析
                    </Button>
                  )}
                </Box>
                {reportLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>
                      {showReanalyze ? 'AI 正在重新分析訓練結果，請稍候...' : 'AI 正在分析訓練結果，請稍候...'}
                    </Typography>
                  </Box>
                )}
                {report && (
                  <Paper sx={{ mt: 2, p: 2, background: '#fffbe7' }}>
                    <div dangerouslySetInnerHTML={{ __html: report }} />
                  </Paper>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <b>分析失敗</b><br/>
                      可能原因：<br/>
                      • 訓練數據不完整<br/>
                      • AI 分析服務暫時不可用<br/>
                      • 數據格式不支援<br/>
                      請稍後重試或檢查訓練是否完成。
                    </Typography>
                  </Alert>
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