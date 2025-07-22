import React from 'react';
import Layout from '../Layout';
import { Typography, Box } from '@mui/material';

const ManualPlay: React.FC = () => {
  return (
    <Layout title="手動遊玩">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          🕹️ 親自挑戰叢林迷宮！
        </Typography>
        <Typography sx={{ fontSize: 22 }}>
          🧑‍🌾 操作探險家，收集寶藏，避開陷阱！
        </Typography>
      </Box>
    </Layout>
  );
};

export default ManualPlay; 