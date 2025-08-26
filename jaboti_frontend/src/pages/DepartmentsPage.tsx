import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../redux/store';
import { fetchDepartments, createDepartmentAsync, deleteDepartmentAsync, updateDepartmentAsync } from '../redux/slices/departmentsSlice';
import type { AppDispatch } from '../redux/store';
import { Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const DepartmentsPage: React.FC = () => {
  const departments = useSelector((state: RootState) => state.departments.list);
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((s: RootState) => s.departments.loading);
  const error = useSelector((s: RootState) => s.departments.error);

  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  // description removido na API

  const handleOpen = (dep?: { id: string; name: string }) => {
    if (dep) {
      setEditId(dep.id);
      setName(dep.name);
    } else {
      setEditId(null);
      setName('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setName('');
  };

  const handleSave = () => {
    if (editId) {
  dispatch(updateDepartmentAsync({ id: editId, name }));
    } else {
  dispatch(createDepartmentAsync({ name }));
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
  // dispatch(removeDepartment(id));
  dispatch(deleteDepartmentAsync(id));
  };

  return (
    <Box sx={{ flex: 1, width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 4 }, boxSizing: 'border-box', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="primary">Departamentos</Typography>
        <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => handleOpen()} sx={{ fontWeight: 600, px: 3, py: 1 }}>
          Novo Departamento
        </Button>
      </Box>
  {error && <Typography color="error" sx={{ mb:2 }}>{error}</Typography>}
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, opacity: loading ? 0.6 : 1 }}>
        {departments.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center', mt: 4 }}>
    {loading ? 'Carregando departamentos...' : 'Nenhum departamento cadastrado.'}
          </Typography>
        ) : (
          departments.map((dep: { id: string; name: string; attendants: string[] }) => (
            <Box key={dep.id} sx={{ bgcolor: '#fff', boxShadow: 3, borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>{dep.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => handleOpen(dep)}>
                  Editar
                </Button>
                <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(dep.id)}>
                  Excluir
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <TextField
            label="Nome do Departamento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsPage;
