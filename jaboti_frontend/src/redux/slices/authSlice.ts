import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import { setTokens, clearTokens } from '../../api/tokenManager';
import { setActiveUser, setActiveCompany, clearAppContext } from '../../api/appContext';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    companies: (string | number)[];
    selectedCompany: string | number | null;
    role: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { username: string; password: string }, { rejectWithValue }) => {
    try {
  // Backend expects field name 'user' in body (Postman collection)
  const { data } = await api.post('/auth/login', { user: payload.username, password: payload.password });
      setTokens(data.accessToken, data.refreshToken);
  return data;
    } catch (e: any) {
  const baseMsg = e.response?.data?.message || e.message || 'Erro ao autenticar';
  const hint = !e.response ? ' (verifique se a API está online e a VITE_API_BASE_URL)' : '';
  return rejectWithValue(baseMsg + hint);
    }
  }
);

export const selectCompanyAsync = createAsyncThunk(
  'auth/selectCompany',
  async (companyId: string | number, { rejectWithValue }) => {
    try {
      const idNum = typeof companyId === 'string' ? Number(companyId) : companyId;
      const { data } = await api.post('/auth/select-company', { companyId: idNum });
      if (data.accessToken) setTokens(data.accessToken, data.refreshToken);
      return { companyId: idNum, accessToken: data.accessToken };
    } catch (e: any) {
  const baseMsg = e.response?.data?.message || e.message || 'Erro ao selecionar empresa';
  const hint = !e.response ? ' (verifique conexão com a API)' : '';
  return rejectWithValue(baseMsg + hint);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state: AuthState) {
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      clearTokens();
  clearAppContext();
    },
    selectCompany(state: AuthState, action: PayloadAction<string>) {
      if (state.user) {
        state.user.selectedCompany = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true; state.error = null;
      })
  .addCase(login.fulfilled, (state, action: any) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = {
          id: action.payload.user?.id || action.payload.id || 'user',
            name: action.payload.user?.name || action.payload.name || 'Usuário',
            email: action.payload.user?.email || action.payload.email || payloadUsername(action),
            companies: action.payload.companies || action.payload.user?.companies || [],
            selectedCompany: null,
            role: action.payload.user?.role || action.payload.role || 'user'
        } as any;
  try { setActiveUser((state.user as any).id); } catch {}
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || 'Falha no login';
      })
      .addCase(selectCompanyAsync.pending, state => { state.loading = true; state.error = null; })
      .addCase(selectCompanyAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) state.user.selectedCompany = action.payload.companyId;
        if (action.payload.accessToken) state.token = action.payload.accessToken;
  try { setActiveCompany(action.payload.companyId as number); } catch {}
      })
      .addCase(selectCompanyAsync.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload || 'Erro';
      });
  }
});

function payloadUsername(action: any){
  return action.meta?.arg?.username || 'n/a';
}

export const { logout, selectCompany } = authSlice.actions;
export default authSlice.reducer;
