import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import { showSnackbar } from './notificationsSlice';

// Pessoa conforme swagger (campos documentados). Campos extras (username, status, photo, departments) ficam como extensões opcionais.
export interface Pessoa {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  chatName?: string; // displayName no UI
  type: 'CLIENTE' | 'USUARIO';
  // Extensões (não presentes no swagger, podem ser provenientes de futuro endpoint):
  username?: string;
  status?: 'online' | 'offline';
  photo?: string;
  departments?: (string | number)[];
}

interface PessoasState {
  attendants: Pessoa[]; // pessoas type=USUARIO
  loading: boolean;
  error: string | null;
}

const initialState: PessoasState = {
  attendants: [],
  loading: false,
  error: null,
};

export interface CreateAttendantInput {
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  chatName?: string;
}
export interface UpdateAttendantInput extends Partial<CreateAttendantInput> { id: number | string; }

function mapApiToPessoa(p: any): Pessoa {
  return {
    id: p.id ?? p._id,
    name: p.nome ?? p.name ?? '',
    email: p.email,
    phone: p.phone ?? p.telefone,
    chatName: p.chatName ?? p.displayName ?? p.nome ?? p.name ?? '',
    type: (p.type ?? p.tipo ?? 'USUARIO') as 'CLIENTE' | 'USUARIO',
  // username pode vir com chaves diferentes dependendo do backend
  username: p.username ?? p.user ?? p.login ?? p.userName ?? p.usuario ?? undefined,
    status: p.status,
    photo: p.photo,
    departments: p.departments || p.departamentos,
  };
}

export const fetchAttendants = createAsyncThunk('pessoas/fetchAttendants', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/pessoas', { params: { tipo: 'USUARIO' } });
    const list = Array.isArray(data) ? data.map(mapApiToPessoa) : [];
    return list as Pessoa[];
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || 'Erro ao listar atendentes');
  }
});

export const createAttendant = createAsyncThunk('pessoas/createAttendant', async (payload: CreateAttendantInput, { rejectWithValue, dispatch }) => {
  try {
  // Collection aceita: name, email, type, password e opcionalmente 'user' para username
  const body: any = { type: 'USUARIO', name: payload.name, password: payload.password };
  if (payload.username) body.user = payload.username;
  if (payload.email) body.email = payload.email;
  // chatName não aparece na collection; removido do payload enviado
    const { data } = await api.post('/pessoas', body);
  dispatch(showSnackbar({ message: 'Atendente criado com sucesso', severity: 'success' }));
    return data as Pessoa;
  } catch (e: any) {
  dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao criar atendente', severity: 'error' }));
    return rejectWithValue(e.response?.data?.message || 'Erro ao criar atendente');
  }
});

export const updateAttendant = createAsyncThunk('pessoas/updateAttendant', async (payload: UpdateAttendantInput, { rejectWithValue, dispatch }) => {
  try {
    const { id, ...rest } = payload;
  // Postman mostra PATCH /pessoas/:id com name/password; para atualizar o "usuário", usar chave 'user'.
    const body: any = {};
    if (rest.name != null && String(rest.name).trim() !== '') body.name = String(rest.name).trim();
    if (rest.password != null && String(rest.password).trim() !== '') body.password = String(rest.password).trim();
  if (rest.username != null && String(rest.username).trim() !== '') body.user = String(rest.username).trim();
    if (rest.email != null && String(rest.email).trim() !== '') body.email = String(rest.email).trim();
    // Evitar enviar corpo vazio
    const { data } = await api.patch(`/pessoas/${id}`, Object.keys(body).length ? body : {});
    dispatch(showSnackbar({ message: 'Atendente atualizado', severity: 'success' }));
    return data as Pessoa;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao atualizar atendente';
    dispatch(showSnackbar({ message: msg, severity: 'error' }));
    return rejectWithValue(msg);
  }
});

export const deleteAttendant = createAsyncThunk('pessoas/deleteAttendant', async (id: number | string, { rejectWithValue, dispatch }) => {
  try {
    await api.delete(`/pessoas/${id}`);
  dispatch(showSnackbar({ message: 'Atendente excluído', severity: 'success' }));
    return id;
  } catch (e: any) {
  dispatch(showSnackbar({ message: e.response?.data?.message || 'Erro ao excluir atendente', severity: 'error' }));
    return rejectWithValue(e.response?.data?.message || 'Erro ao excluir atendente');
  }
});

const pessoasSlice = createSlice({
  name: 'pessoas',
  initialState,
  reducers: {
    setAttendantExtras: (state, action: PayloadAction<{ id: number | string; extras: Partial<Pessoa> }>) => {
      const att = state.attendants.find(a => a.id === action.payload.id);
      if (att) Object.assign(att, action.payload.extras);
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAttendants.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchAttendants.fulfilled, (state, action: PayloadAction<Pessoa[]>) => { state.loading = false; state.attendants = action.payload; })
      .addCase(fetchAttendants.rejected, (state, action: any) => { state.loading = false; state.error = action.payload || 'Erro'; })
      .addCase(createAttendant.fulfilled, (state, action: PayloadAction<Pessoa>) => { state.attendants.push(action.payload); })
      .addCase(updateAttendant.fulfilled, (state, action: PayloadAction<Pessoa>) => {
        const idx = state.attendants.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) state.attendants[idx] = action.payload;
      })
      .addCase(deleteAttendant.fulfilled, (state, action: PayloadAction<number | string>) => {
        state.attendants = state.attendants.filter(a => a.id !== action.payload);
      });
  }
});

export const { setAttendantExtras } = pessoasSlice.actions;
export default pessoasSlice.reducer;
