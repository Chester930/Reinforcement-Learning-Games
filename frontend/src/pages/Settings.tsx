import React from 'react';
import Layout from '../Layout';
import { Typography, Box } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Layout title="系統設定">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          ⚙️ 系統參數調整
        </Typography>
        <Typography sx={{ fontSize: 22 }}>
          🧑‍🌾 讓你的叢林冒險更順利！
        </Typography>
      </Box>
    </Layout>
  );
};

export default Settings; 