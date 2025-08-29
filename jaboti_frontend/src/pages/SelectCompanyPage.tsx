import BusinessIcon from '@mui/icons-material/Business';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fade,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectCompany, selectCompanyAsync } from '../redux/slices/authSlice';
import { fetchCompanies } from '../redux/slices/companiesSlice';
import type { RootState } from '../redux/store';

const SelectCompanyPage: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const companies = useSelector((s: RootState) => s.companies.list);
  const companiesLoading = useSelector((s: RootState) => s.companies.loading);
  const companiesError = useSelector((s: RootState) => s.companies.error);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const loading = useSelector((s: RootState) => s.auth.loading);
  const error = useSelector((s: RootState) => s.auth.error);

  useEffect(() => {
    if (user) dispatch(fetchCompanies() as any);
  }, [dispatch, user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Se não há empresas e não está carregando, mostrar mensagem de logout
  if (!companiesLoading && companies.length === 0 && !companiesError) {
    // Componente para usuário sem empresas - com logout automático
    return <NoCompaniesComponent />;
  }

  const handleSelect = async () => {
    if (!selectedCompany) return;
    const companyIdNum = Number(selectedCompany);
    if (!Number.isInteger(companyIdNum) || companyIdNum < 1) {
      return; // opção inválida; evita chamada incorreta
    }
    const action = await dispatch(selectCompanyAsync(companyIdNum));
    if (selectCompanyAsync.fulfilled.match(action)) {
      dispatch(selectCompany(String(selectedCompany)));
      navigate('/painel');
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
                <BusinessIcon fontSize="large" />
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
                Selecione a empresa para continuar
              </Typography>
            </Box>
            <FormControl fullWidth margin="normal" disabled={loading}>
              <InputLabel id="empresa-label">Empresa</InputLabel>
              <Select
                labelId="empresa-label"
                value={selectedCompany}
                label="Empresa"
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Escolha uma empresa
                </MenuItem>
                {companies.map((c: any) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name || `Empresa #${c.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {companiesLoading && (
              <Typography variant="body2" color="text.secondary">
                Carregando empresas...
              </Typography>
            )}
            {companiesError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {companiesError}
              </Typography>
            )}
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSelect}
              fullWidth
              sx={{ mt: 2, py: 1.5, fontWeight: 600, fontSize: 18 }}
              endIcon={<BusinessIcon />}
              disabled={!selectedCompany || loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={22} sx={{ color: 'inherit', mr: 1 }} /> Selecionando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

// Componente separado para usuário sem empresas
const NoCompaniesComponent: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  useEffect(() => {
    // Fazer logout automático após 3 segundos
    const timer = setTimeout(() => {
      dispatch(logout());
      navigate('/login', {
        state: {
          message:
            'Você foi desconectado porque não possui empresas vinculadas à sua conta. Entre em contato com o administrador do sistema.',
        },
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [dispatch, navigate]);

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
            maxWidth: 500,
            width: '100%',
            mx: 'auto',
            boxShadow: 6,
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#f57c00', width: 64, height: 64, mb: 2 }}>
                <WarningIcon fontSize="large" />
              </Avatar>
              <Typography
                variant="h5"
                fontWeight={700}
                color="#f57c00"
                gutterBottom
                textAlign="center"
              >
                Nenhuma Empresa Vinculada
              </Typography>
              <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body1" textAlign="center">
                  Você não possui empresas vinculadas à sua conta.
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                  Você será redirecionado para a tela de login em alguns segundos...
                </Typography>
              </Alert>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default SelectCompanyPage;
