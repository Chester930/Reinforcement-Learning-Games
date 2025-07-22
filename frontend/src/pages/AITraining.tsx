import React from 'react';
import Layout from '../Layout';
import { Typography, Box } from '@mui/material';

const AITraining: React.FC = () => {
  return (
    <Layout title="AI訓練">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          🧑‍💻 訓練你的AI探險家，挑戰最優路徑！
        </Typography>
        <Typography sx={{ fontSize: 22 }}>
          🪨🕳️ 跨越障礙，收集寶藏，成為叢林傳奇！ 🪙🏁
        </Typography>
      </Box>
    </Layout>
  );
};

export default AITraining; 