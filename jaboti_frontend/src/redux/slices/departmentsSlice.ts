import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import { showSnackbar } from './notificationsSlice';
import { logout } from './authSlice';

export interface Department {
  id: string;
  name: string;
  attendants: string[]; // IDs dos atendentes
}

interface DepartmentsState {
  list: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  list: [],
  loading: false,
  error: null,
};

// Helper para mapear o modelo da API (português) para o modelo da UI
function mapApiToDepartment(apiDep: any): Department {
  return {
    id: String(apiDep.id ?? apiDep._id ?? ''),
    name: apiDep.nome ?? apiDep.name ?? '',
    attendants: apiDep.attendants?.map((a: any) => String(a)) ?? [],
  };
}

export const fetchDepartments = createAsyncThunk('departments/fetchAll', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/departamentos');
    const list = Array.isArray(data) ? data.map(mapApiToDepartment) : [];
    return list as Department[];
  } catch (e: any) {
  if (e.response?.status === 401) thunkAPI.dispatch(logout());
  return thunkAPI.rejectWithValue(e.response?.data?.message || 'Erro ao listar departamentos');
  }
});

// Simples: buscar departamentos e, para cada um, buscar membros; retorna lista já com attendants preenchidos
export const fetchDepartmentsWithMembers = createAsyncThunk('departments/fetchAllWithMembers', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/departamentos');
    const baseList: Department[] = Array.isArray(data) ? data.map(mapApiToDepartment) : [];
    const fullList = await Promise.all(
      baseList.map(async (dep) => {
        try {
          const { data: mdata } = await api.get(`/departamentos/${dep.id}/membros`);
          const memberIds = Array.isArray(mdata) ? mdata.map((p: any) => String(p.id ?? p._id)) : [];
          return { ...dep, attendants: memberIds } as Department;
        } catch (e: any) {
          if (e.response?.status === 401) thunkAPI.dispatch(logout());
          return dep; // mantém sem alterar caso falhe membros
        }
      })
    );
    return fullList as Department[];
  } catch (e: any) {
    if (e.response?.status === 401) thunkAPI.dispatch(logout());
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Erro ao listar departamentos');
  }
});

export const createDepartmentAsync = createAsyncThunk('departments/create', async (payload: { name: string }, { rejectWithValue, dispatch }) => {
  try {
  const body: any = { nome: payload.name };
    const { data } = await api.post('/departamentos', body);
    dispatch(showSnackbar({ message: 'Departamento criado', severity: 'success' }));
    return mapApiToDepartment(data);
  } catch (e: any) {
  if (e.response?.status === 401) dispatch(logout());
  dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao criar departamento', severity: 'error' }));
    return rejectWithValue(e.response?.data?.message || 'Erro ao criar departamento');
  }
});

export const deleteDepartmentAsync = createAsyncThunk('departments/delete', async (id: string | number, { rejectWithValue, dispatch }) => {
  try {
    await api.delete(`/departamentos/${id}`);
    dispatch(showSnackbar({ message: 'Departamento excluído', severity: 'success' }));
    return id;
  } catch (e: any) {
  if (e.response?.status === 401) dispatch(logout());
  dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao excluir departamento', severity: 'error' }));
    return rejectWithValue(e.response?.data?.message || 'Erro ao excluir departamento');
  }
});

export const updateDepartmentAsync = createAsyncThunk(
  'departments/update',
  async (payload: { id: string | number; name?: string }, { rejectWithValue, dispatch }) => {
    try {
      const { id, ...rest } = payload;
  const body: any = {};
  if (rest.name != null) body.nome = rest.name;
  const { data } = await api.patch(`/departamentos/${id}`, body);
      dispatch(showSnackbar({ message: 'Departamento atualizado', severity: 'success' }));
  return mapApiToDepartment(data);
    } catch (e: any) {
  if (e.response?.status === 401) dispatch(logout());
  dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao atualizar departamento', severity: 'error' }));
      return rejectWithValue(e.response?.data?.message || 'Erro ao atualizar departamento');
    }
  }
);

// Membros: listar, adicionar, remover
export interface DepartmentMember { id: number | string; name: string; email?: string; chatName?: string }

export const fetchDepartmentMembers = createAsyncThunk(
  'departments/fetchMembers',
  async (departmentId: number | string, thunkAPI) => {
    try {
      const { data } = await api.get(`/departamentos/${departmentId}/membros`);
      const members: DepartmentMember[] = Array.isArray(data)
        ? data.map((p: any) => ({ id: p.id ?? p._id, name: p.name ?? p.nome ?? '', email: p.email, chatName: p.chatName }))
        : [];
      return { departmentId, members } as { departmentId: number | string; members: DepartmentMember[] };
    } catch (e: any) {
      if (e.response?.status === 401) thunkAPI.dispatch(logout());
      return thunkAPI.rejectWithValue(e.response?.data?.message || 'Erro ao listar membros');
    }
  }
);

export const addDepartmentMembers = createAsyncThunk(
  'departments/addMembers',
  async (payload: { departmentId: number | string; pessoaIds: (number | string)[] }, thunkAPI) => {
    try {
      const pessoaIdsNum = (payload.pessoaIds || []).map((id) => Number(id)).filter((n) => Number.isInteger(n));
      if (!pessoaIdsNum.length) {
        return thunkAPI.rejectWithValue('Seleção inválida: ids devem ser inteiros');
      }
      const body = { pessoaIds: pessoaIdsNum };
      await api.post(`/departamentos/${payload.departmentId}/membros`, body);
      thunkAPI.dispatch(showSnackbar({ message: 'Atendentes vinculados', severity: 'success' }));
      return { ...payload, pessoaIds: pessoaIdsNum };
    } catch (e: any) {
      if (e.response?.status === 401) thunkAPI.dispatch(logout());
      thunkAPI.dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao vincular atendentes', severity: 'error' }));
      return thunkAPI.rejectWithValue(e.response?.data?.message || 'Erro ao vincular atendentes');
    }
  }
);

export const removeDepartmentMember = createAsyncThunk(
  'departments/removeMember',
  async (payload: { departmentId: number | string; pessoaId: number | string }, thunkAPI) => {
    try {
  const pid = Number(payload.pessoaId);
  await api.delete(`/departamentos/${payload.departmentId}/membros/${pid}`);
  return { ...payload, pessoaId: pid };
    } catch (e: any) {
      if (e.response?.status === 401) thunkAPI.dispatch(logout());
      return thunkAPI.rejectWithValue(e.response?.data?.message || 'Erro ao desvincular atendente');
    }
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    addDepartment(state, action: PayloadAction<Department>) {
      state.list.push(action.payload);
    },
    editDepartment(state, action: PayloadAction<Department>) {
      const idx = state.list.findIndex(dep => dep.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
    removeDepartment(state, action: PayloadAction<string>) {
      state.list = state.list.filter(dep => dep.id !== action.payload);
    },
    addAttendantToDepartment(state, action: PayloadAction<{ departmentId: string; attendantId: string }>) {
      const dep = state.list.find(d => d.id === action.payload.departmentId);
      if (dep && !dep.attendants.includes(action.payload.attendantId)) {
        dep.attendants.push(action.payload.attendantId);
      }
    },
    removeAttendantFromDepartment(state, action: PayloadAction<{ departmentId: string; attendantId: string }>) {
      const dep = state.list.find(d => d.id === action.payload.departmentId);
      if (dep) {
        dep.attendants = dep.attendants.filter(id => id !== action.payload.attendantId);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDepartments.pending, (state: DepartmentsState) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state: DepartmentsState, action: PayloadAction<Department[]>) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchDepartments.rejected, (state: DepartmentsState, action: any) => { state.loading = false; state.error = action.payload || 'Erro'; })
  .addCase(fetchDepartmentsWithMembers.pending, (state: DepartmentsState) => { state.loading = true; state.error = null; })
  .addCase(fetchDepartmentsWithMembers.fulfilled, (state: DepartmentsState, action: PayloadAction<Department[]>) => { state.loading = false; state.list = action.payload; })
  .addCase(fetchDepartmentsWithMembers.rejected, (state: DepartmentsState, action: any) => { state.loading = false; state.error = action.payload || 'Erro'; })
      .addCase(createDepartmentAsync.fulfilled, (state: DepartmentsState, action: PayloadAction<Department>) => { state.list.push(action.payload); })
      .addCase(updateDepartmentAsync.fulfilled, (state: DepartmentsState, action: PayloadAction<Department>) => {
        const idx = state.list.findIndex((d: Department) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteDepartmentAsync.fulfilled, (state: DepartmentsState, action: PayloadAction<string | number>) => {
        state.list = state.list.filter((d: Department) => d.id !== String(action.payload));
      });
    // membros
    builder.addCase(fetchDepartmentMembers.fulfilled, (state: DepartmentsState, action: PayloadAction<{ departmentId: number | string; members: DepartmentMember[] }>) => {
      const dep = state.list.find((d: Department) => d.id === String(action.payload.departmentId));
      if (dep) dep.attendants = action.payload.members.map((m: DepartmentMember) => String(m.id));
    });
    builder.addCase(addDepartmentMembers.fulfilled, (state: DepartmentsState, action: PayloadAction<{ departmentId: number | string; pessoaIds: (number | string)[] }>) => {
      const dep = state.list.find((d: Department) => d.id === String(action.payload.departmentId));
      if (dep) {
        const addIds = action.payload.pessoaIds.map((id: number | string) => String(id));
        dep.attendants = Array.from(new Set([...(dep.attendants || []), ...addIds]));
      }
    });
    builder.addCase(removeDepartmentMember.fulfilled, (state: DepartmentsState, action: PayloadAction<{ departmentId: number | string; pessoaId: number | string }>) => {
      const dep = state.list.find((d: Department) => d.id === String(action.payload.departmentId));
      if (dep) dep.attendants = (dep.attendants || []).filter((id: string) => id !== String(action.payload.pessoaId));
    });
  }
});

export const {
  addDepartment,
  editDepartment,
  removeDepartment,
  addAttendantToDepartment,
  removeAttendantFromDepartment,
} = departmentsSlice.actions;
export default departmentsSlice.reducer;
