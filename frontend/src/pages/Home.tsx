import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import Layout from '../Layout';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Layout title="叢林尋寶強化學習平台">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          歡迎來到 Q 版叢林尋寶世界！
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate('/maps')}>
            地圖管理
          </Button>
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/manual')}>
            開始遊玩(手動)
          </Button>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate('/ai')}>
            AI遊玩
          </Button>
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/analysis')}>
            AI分析
          </Button>
          <Button variant="outlined" color="primary" size="large" onClick={() => navigate('/settings')}>
            設置
          </Button>
        </Box>
        {/* 系統說明 */}
        <Box sx={{ mt: 4, maxWidth: 700 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
            系統說明
          </Typography>
          <Typography sx={{ fontSize: 18, color: '#555' }}>
            本平台是一個以 Q 版叢林尋寶為主題的互動式強化學習教學平台。你可以：<br />
            1. 自訂地圖，設計屬於自己的叢林迷宮。<br />
            2. 手動操作探險家，體驗強化學習規則。<br />
            3. 讓 AI 學習並自動挑戰地圖，觀察學習過程。<br />
            4. 查看 AI 訓練分析，包含學習曲線、最優路徑等。<br />
            5. 調整系統參數，體驗不同 AI 行為。
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default Home; 