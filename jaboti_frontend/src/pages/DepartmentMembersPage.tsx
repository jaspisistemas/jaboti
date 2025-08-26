import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { Box, Typography, Chip, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Switch } from '@mui/material';
import { fetchDepartmentsWithMembers, addDepartmentMembers, removeDepartmentMember } from '../redux/slices/departmentsSlice';
import { fetchAttendants } from '../redux/slices/pessoasSlice';
import type { AppDispatch } from '../redux/store';
import type { Pessoa } from '../redux/slices/pessoasSlice';

const DepartmentMembersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const departments = useSelector((s: RootState) => s.departments.list);
  const attendants = useSelector((s: RootState) => s.pessoas.attendants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDepId, setDialogDepId] = useState<string>('');
  const [selectedAttendants, setSelectedAttendants] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchDepartmentsWithMembers());
    dispatch(fetchAttendants());
  }, [dispatch]);

  const currentMembers = useMemo(() => {
    const dep = departments.find(d => d.id === dialogDepId);
    return dep?.attendants || [];
  }, [departments, dialogDepId]);

  const attendantById = useMemo(() => {
    const map = new Map<string, Pessoa>();
    attendants.forEach(a => map.set(String(a.id), a));
    return map;
  }, [attendants]);

  const sortedAttendants = useMemo(() => {
    return [...attendants].sort((a, b) => {
      const an = (a.chatName || a.name || '').toLocaleLowerCase();
      const bn = (b.chatName || b.name || '').toLocaleLowerCase();
      return an.localeCompare(bn, 'pt-BR');
    });
  }, [attendants]);

  const handleLink = async () => {
    if (!dialogDepId) return;
    const addIds = selectedAttendants.filter(id => !currentMembers.includes(id));
    const removeIds = currentMembers.filter(id => !selectedAttendants.includes(id));
    if (addIds.length) {
      await dispatch(addDepartmentMembers({ departmentId: dialogDepId, pessoaIds: addIds }));
    }
    if (removeIds.length) {
      for (const id of removeIds) {
        await dispatch(removeDepartmentMember({ departmentId: dialogDepId, pessoaId: id }));
      }
    }
    await dispatch(fetchDepartmentsWithMembers());
    setDialogOpen(false);
  };

  return (
    <Box sx={{ flex: 1, p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
        Vincular Departamento x Atendentes
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {departments.map(dep => (
          <Paper key={dep.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>{dep.name}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 34 }}>
              {(dep.attendants || []).length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhum atendente vinculado</Typography>
              )}
              {(dep.attendants || []).map(id => {
                const a = attendantById.get(id);
                const label = a ? (a.chatName || a.name || id) : id;
                return <Chip key={id} label={label} />;
              })}
            </Box>
            <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => { setDialogDepId(dep.id); setSelectedAttendants(dep.attendants || []); setDialogOpen(true); }}>
                Adicionar/Remover
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Vincular atendentes</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, maxHeight: 440, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {sortedAttendants.map(a => {
              const id = String(a.id);
              const wasMember = ( (departments.find(d => d.id === dialogDepId)?.attendants) || [] ).includes(id);
              const willBeMember = selectedAttendants.includes(id);
              const changed = wasMember !== willBeMember;
              const borderColor = changed ? (willBeMember ? 'success.main' : 'error.main') : 'divider';
              return (
                <Box
                  key={id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderLeft: '4px solid',
                    borderColor,
                    bgcolor: changed ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <Box>
        <Typography variant="body1" fontWeight={600}>{a.chatName || a.name}</Typography>
                    {a.email && <Typography variant="caption" color="text.secondary">{a.email}</Typography>}
                  </Box>
                  {changed && (
                    <Chip size="small" label={willBeMember ? 'Adicionar' : 'Remover'} color={willBeMember ? 'success' : 'error'} />
                  )}
                  <Switch
                    checked={willBeMember}
                    onChange={() => setSelectedAttendants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    color={changed ? (willBeMember ? 'success' : 'error') : 'primary'}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleLink} disabled={!dialogDepId}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentMembersPage;
