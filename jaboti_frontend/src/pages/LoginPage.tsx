import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../redux/slices/authSlice';
import type { AppDispatch, RootState } from '../redux/store';

// mock removido – agora login real via backend

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((s: RootState) => s.auth as any);

  // Verificar se há mensagem de redirecionamento
  const redirectMessage = location.state?.message;

  const handleLogin = async () => {
    const action: any = await dispatch(login({ username, password }));
    if (login.fulfilled.match(action)) {
      navigate('/selecionar-empresa');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f6fa',
        px: 2,
      }}
    >
      <Fade in timeout={700}>
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            mx: 'auto',
            boxShadow: 6,
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mb: 1 }}>
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight={700} color="#1976d2" gutterBottom>
                Jaboti
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
                textAlign="center"
              >
                Sistema Multiatendente & Multicanal
              </Typography>
            </Box>

            {/* Mensagem de redirecionamento por falta de empresas */}
            {redirectMessage && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2, width: '100%' }}>
                <Typography variant="body2" textAlign="center">
                  {redirectMessage}
                </Typography>
              </Alert>
            )}

            <TextField
              label="Usuário"
              placeholder="admin"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              fullWidth
              sx={{ mt: 2, py: 1.5, fontWeight: 600, fontSize: 18 }}
              disabled={loading}
              endIcon={<LockOutlinedIcon />}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Agora o login é por usuário e senha (não mais email). Base URL atual:{' '}
              {import.meta.env.VITE_API_BASE_URL}
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default LoginPage;
