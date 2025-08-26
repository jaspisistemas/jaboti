import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';
import { fetchAttendants, createAttendant, updateAttendant, deleteAttendant, setAttendantExtras } from '../redux/slices/pessoasSlice';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  // Grid,
  Paper,
  Input,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

// Agora consumindo API /pessoas?tipo=USUARIO (swagger) - displayName mapeado de chatName.

const AttendantsPage: React.FC = () => {
  const departmentsList = useSelector((state: RootState) => state.departments.list);
  interface UIAttendant { id: string | number; name: string; displayName: string; email: string; username: string; password: string; photo: string; status: string; }
  const attendantsRaw = useSelector((s: RootState) => s.pessoas.attendants);
  const loading = useSelector((s: RootState) => s.pessoas.loading);
  const error = useSelector((s: RootState) => s.pessoas.error);
  const attendants: UIAttendant[] = React.useMemo(() => attendantsRaw.map((a: any): UIAttendant => ({
    id: a.id,
    name: a.name,
    displayName: a.chatName || a.name,
    email: a.email || '',
    // Exibir preferencialmente username; fallback para email local-part ou vazio
    username: a.username || (a.email ? String(a.email).split('@')[0] : ''),
    password: '',
    photo: a.photo || '',
    status: a.status || 'offline',
  })), [attendantsRaw]);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => { dispatch(fetchAttendants()); }, [dispatch]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState('');
  const [status, setStatus] = useState('online');

  const handleOpen = (attendant?: UIAttendant) => {
    if (attendant) {
      setEditId(String(attendant.id));
      setName(attendant.name);
      setDisplayName(attendant.displayName);
      setEmail(attendant.email);
      setUsername(attendant.username);
      setPassword(''); // Por segurança, não mostrar senha
      setPhoto(attendant.photo);
      setStatus(attendant.status);
    } else {
      setEditId(null);
      setName('');
      setDisplayName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setPhoto('');
      setStatus('online');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setName('');
    setDisplayName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setPhoto('');
    setStatus('online');
  };

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const handleSave = async () => {
    setValidationError('');
    // Client-side validations
    const nm = name.trim();
    const un = username.trim();
    const pw = password.trim();
  // displayName é apenas UI; não enviado para API
    const em = email.trim();
    if (!nm) { setValidationError('Nome é obrigatório'); return; }
    if (!un) { setValidationError('Usuário é obrigatório'); return; }
    if (editId) {
      if (pw && pw.length < 6) { setValidationError('password must be longer than or equal to 6 characters'); return; }
    } else {
      if (!pw) { setValidationError('Senha é obrigatória'); return; }
      if (pw.length < 6) { setValidationError('password must be longer than or equal to 6 characters'); return; }
    }
    setSaving(true);
    try {
      if (editId) {
        const upd: any = { id: editId };
        if (nm) upd.name = nm;
        if (un) upd.username = un;
        if (pw) upd.password = pw;
  // chatName não é enviado para a API
        if (em) upd.email = em;
        const action: any = await dispatch(updateAttendant(upd));
        if (!updateAttendant.fulfilled.match(action)) {
          const msg = action.payload || action.error?.message || 'Erro ao atualizar atendente';
          setValidationError(String(msg));
          return;
        }
        dispatch(setAttendantExtras({ id: editId, extras: { status: status as 'online' | 'offline', photo, username: un } }));
        handleClose();
      } else {
  const action: any = await dispatch(createAttendant({ name: nm, username: un, password: pw, email: em || undefined }));
        if (!createAttendant.fulfilled.match(action)) {
          const msg = action.payload || action.error?.message || 'Erro ao criar atendente';
          setValidationError(String(msg));
          return;
        }
        const newId = action.payload.id;
        dispatch(setAttendantExtras({ id: newId, extras: { status: status as 'online' | 'offline', photo, username: un } }));
        handleClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simular upload - em produção usar API real
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: string | number) => {
    dispatch(deleteAttendant(id));
  };

  return (
    <Box sx={{ flex: 1, width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 4 }, boxSizing: 'border-box', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary">Atendentes</Typography>
        <Button variant="contained" color="primary" startIcon={<PersonIcon />} onClick={() => handleOpen()} sx={{ fontWeight: 600, px: 3, py: 1 }}>
          Novo Atendente
        </Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
        {error && <Typography color="error" sx={{ gridColumn: '1/-1' }}>{error}</Typography>}
        {loading && attendants.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center', mt: 4 }}>
            Carregando atendentes...
          </Typography>
        ) : attendants.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center', mt: 4 }}>
            Nenhum atendente cadastrado.
          </Typography>
        ) : (
          attendants.map((attendant: UIAttendant) => (
            <Card key={attendant.id} sx={{ boxShadow: 3, borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={attendant.photo || undefined}
                  sx={{ bgcolor: '#1976d2', width: 56, height: 56, mb: 1 }}
                >
                  {!attendant.photo && <PersonIcon />}
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="primary">{attendant.name}</Typography>
                <Typography variant="body2" color="text.secondary">{attendant.email}</Typography>
                <Typography variant="body2" color="text.secondary">Usuário: {attendant.username}</Typography>
                <Typography variant="body2" color="text.secondary">Nome no Chat: {attendant.displayName}</Typography>
                <Typography variant="body2" color="text.secondary">Departamentos: {departmentsList.filter(d => (d.attendants || []).includes(String(attendant.id))).map(d => d.name).join(', ')}</Typography>
                <Typography variant="caption" color={attendant.status === 'online' ? 'success.main' : 'error.main'}>
                  {attendant.status === 'online' ? 'Online' : 'Offline'}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', gap: 1 }}>
                <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => handleOpen(attendant)}>
                  Editar
                </Button>
                <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(attendant.id)}>
                  Excluir
                </Button>
              </CardActions>
            </Card>
          ))
        )}
      </Box>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            {editId ? 'Editar Atendente' : 'Novo Atendente'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Foto do Atendente
              </Typography>
              <Avatar 
                src={photo || undefined}
                sx={{ 
                  bgcolor: '#1976d2', 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '2rem'
                }}
              >
                {!photo && <PersonIcon fontSize="large" />}
              </Avatar>
              <Input
                id="photo-upload"
                type="file"
                inputProps={{ accept: 'image/*' }}
                onChange={handlePhotoUpload}
                sx={{ display: 'none' }}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Escolher Foto
                </Button>
              </label>
              {photo && (
                <Button 
                  variant="text" 
                  color="error" 
                  size="small"
                  onClick={() => setPhoto('')}
                  fullWidth
                >
                  Remover Foto
                </Button>
              )}
            </Paper>
            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                autoFocus
                autoComplete="off"
              />
              <TextField
                label="Nome no Chat"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                helperText="Nome que aparece nas mensagens"
                autoComplete="off"
              />
              <TextField
                label="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                type="email"
                autoComplete="off"
              />
              <TextField
                label="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                autoComplete="off"
              />
              <TextField
                label={editId ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                type="password"
                required={!editId}
                autoComplete="new-password"
                error={!!validationError && (validationError.toLowerCase().includes('senha') || validationError.toLowerCase().includes('password'))}
                helperText={(!!validationError && (validationError.toLowerCase().includes('senha') || validationError.toLowerCase().includes('password'))) ? validationError : (editId ? 'Deixe vazio para manter a senha' : '')}
              />
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
              {/* Departamentos removidos do cadastro: vínculos são gerenciados na tela "Vínculos Dep x Atend" */}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} color="inherit" size="large">
            Cancelar
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {validationError && <Typography variant="caption" color="error">{validationError}</Typography>}
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="primary" 
              size="large"
              disabled={saving}
              sx={{ px: 4 }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendantsPage;
