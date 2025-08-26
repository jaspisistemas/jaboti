import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Box sx={{ flex: 1, width: '100%', height: '100%', boxSizing: 'border-box', bgcolor: 'background.default', p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
      <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
        Dashboard Inicial
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Bem-vindo ao painel Jaboti!
      </Typography>
      {/* Exemplo de widget futuro */}
      <Button variant="contained" color="primary" size="large" sx={{ mt: 2, px: 4, py: 1.5, fontWeight: 600 }}>
        Adicionar Widget
      </Button>
    </Box>
  );
};

export default DashboardPage;
