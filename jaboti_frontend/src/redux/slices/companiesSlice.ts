import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

export interface Company { id: number | string; name?: string }

interface CompaniesState {
  list: Company[];
  loading: boolean;
  error: string | null;
}

const initialState: CompaniesState = { list: [], loading: false, error: null };

export const fetchCompanies = createAsyncThunk('companies/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/companies');
    return data as Company[];
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || 'Erro ao listar empresas');
  }
});

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCompanies.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<Company[]>) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchCompanies.rejected, (state, action: any) => { state.loading = false; state.error = action.payload || 'Erro'; });
  }
});

export default companiesSlice.reducer;
