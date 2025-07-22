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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE = 'http://localhost:8000';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

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

  useEffect(() => {
    axios.get(`${API_BASE}/train/jobs`).then(res => setJobs(res.data));
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    setCurveData(null); setHeatmapUrl(null); setPathUrl(null); setReport(null); setError(null);
    const info = jobs.find(j => j.job_id === selectedJob);
    setJobInfo(info);
    // 學習曲線（JSON）
    axios.get(`${API_BASE}/analysis/${selectedJob}/curve`)
      .then(res => setCurveData(res.data))
      .catch(() => setCurveData(null));
    // 熱力圖
    axios.get(`${API_BASE}/analysis/${selectedJob}/heatmap`, { responseType: 'arraybuffer' })
      .then(res => setHeatmapUrl(`data:image/png;base64,${arrayBufferToBase64(res.data)}`))
      .catch(() => setHeatmapUrl(null));
    // 最優路徑
    axios.get(`${API_BASE}/analysis/${selectedJob}/optimal-path`, { responseType: 'arraybuffer' })
      .then(res => setPathUrl(`data:image/png;base64,${arrayBufferToBase64(res.data)}`))
      .catch(() => setPathUrl(null));
    setLoading(false);
  }, [selectedJob, jobs]);

  const handleAnalyze = async () => {
    setReportLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/analysis/${selectedJob}/analyze-and-save`);
      setReport(res.data.html || res.data.md || '分析完成，但無內容');
    } catch (e: any) {
      setError('分析失敗');
    }
    setReportLoading(false);
  };

  useEffect(() => {
    if (!selectedJob) return;
    setAutoAnalyze(true);
  }, [selectedJob]);

  useEffect(() => {
    if (autoAnalyze && selectedJob && curveData && heatmapUrl && pathUrl && !report && !reportLoading) {
      handleAnalyze();
      setAutoAnalyze(false);
    }
    // eslint-disable-next-line
  }, [autoAnalyze, selectedJob, curveData, heatmapUrl, pathUrl, report, reportLoading]);

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
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>學習曲線</Typography>
                {curveData && chartData ? (
                  <Line data={chartData} options={{
                    ...chartOptions,
                    scales: {
                      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Total Reward' } },
                      y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Steps' }, grid: { drawOnChartArea: false } },
                    },
                  }} />
                ) : <Typography color="error">無法載入學習曲線</Typography>}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>熱力圖</Typography>
                {heatmapUrl ? <img src={heatmapUrl} alt="熱力圖" style={{ maxWidth: 400, background: '#fff' }} /> : <Typography color="error">無法載入熱力圖</Typography>}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>最優路徑</Typography>
                {pathUrl ? <img src={pathUrl} alt="最優路徑" style={{ maxWidth: 400, background: '#fff' }} /> : <Typography color="error">無法載入最優路徑</Typography>}
              </Box>
              <Box>
                {reportLoading && <Button variant="contained" color="secondary" disabled>分析中...</Button>}
                {report && <Paper sx={{ mt: 2, p: 2, background: '#fffbe7' }}><div dangerouslySetInnerHTML={{ __html: report }} /></Paper>}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
};

export default AIAnalysis; 