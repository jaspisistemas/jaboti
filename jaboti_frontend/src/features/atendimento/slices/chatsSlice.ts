import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ChatListItem } from '../../../vite-env'
import api from '../../../api'
import { showSnackbar } from '../../../redux/slices/notificationsSlice'

interface ChatsState {
  items: ChatListItem[]
  selectedId?: string
}

const initialState: ChatsState = {
  items: [],
}

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setChats(state, action: PayloadAction<ChatListItem[]>) {
      // Preservar ultimaMensagem local se disponível
      const newItems = action.payload.map(apiItem => {
        const localItem = state.items.find(local => local.id === apiItem.id)
        if (localItem && localItem.ultimaMensagem && localItem.ultimaMensagem !== '') {
          return {
            ...apiItem,
            ultimaMensagem: localItem.ultimaMensagem,
            horario: localItem.horario,
            horarioOrdenacao: localItem.horarioOrdenacao
          }
        }
        return apiItem
      })
      state.items = newItems
    },
    addChat(state, action: PayloadAction<ChatListItem>) {
      const exists = state.items.some(c => c.id === action.payload.id)
      if (!exists) state.items = [action.payload, ...state.items]
    },
    selectChat(state, action: PayloadAction<string>) {
      state.selectedId = action.payload
      state.items = state.items.map((c) =>
        c.id === action.payload ? { ...c, mensagensNovas: 0 } : c,
      )
    },
    clearSelected(state) {
      state.selectedId = undefined
    },
    atualizarStatus(state, action: PayloadAction<{ chatId: string; status: ChatListItem['status'] }>) {
      const { chatId, status } = action.payload
      state.items = state.items.map((c) => (c.id === chatId ? { ...c, status } : c))
    },
    transferirDepartamento(state, action: PayloadAction<{ chatId: string; departamento: string }>) {
      const { chatId, departamento } = action.payload
      state.items = state.items.map((c) => (c.id === chatId ? { ...c, departamento } : c))
    },
    atualizarPreview(state, action: PayloadAction<{ chatId: string; ultimaMensagem: string; horario: string }>) {
      const { chatId, ultimaMensagem, horario } = action.payload
      state.items = state.items.map((c) =>
        c.id === chatId
          ? { ...c, ultimaMensagem, horario, horarioOrdenacao: Date.now() }
          : c,
      )
    },
  },
})

export const { setChats, addChat, selectChat, clearSelected, atualizarStatus, transferirDepartamento, atualizarPreview } = chatsSlice.actions
export default chatsSlice.reducer

// Thunks
export const loadAtendimentosAsync = createAsyncThunk(
  'chats/loadAtendimentos',
  async (payload: { status?: 'ATIVO' | 'PENDENTE' | 'BOT' | 'ENCERRADO'; departamentoId?: number; limit?: number } | undefined, { dispatch, rejectWithValue }) => {
    try {
      const params: any = {}
      if (payload?.status) params.status = payload.status
      if (payload?.departamentoId != null) params.departamentoId = payload.departamentoId
      if (payload?.limit != null) params.limit = payload.limit
      const { data } = await api.get('/atendimentos', { params })
      const list: any[] = Array.isArray(data) ? data : []
      const pad = (n: number) => `${n}`.padStart(2, '0')
      const mapStatus = (s?: string): ChatListItem['status'] => {
        const v = String(s || '').toUpperCase()
        if (v === 'ATIVO') return 'ativo'
        if (v === 'PENDENTE') return 'pendente'
        if (v === 'BOT') return 'bot'
        if (v === 'ENCERRADO') return 'finalizado'
        return 'pendente'
      }
      const items: ChatListItem[] = list.map((a: any) => {
        const dt = a.ultimaMensagemEm ? new Date(a.ultimaMensagemEm) : (a.inicioEm ? new Date(a.inicioEm) : new Date())
        const hora = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`
        
        // Usar o campo ultimaMensagem do backend
        const ultimaMensagem = a.ultimaMensagem || 'Mensagem'
        
        return {
          id: String(a.id),
          nome: a.cliente?.nome || a.clienteNome || `Cliente #${a.clienteId}`,
          telefone: a.cliente?.telefone || undefined,
          foto: a.cliente?.foto || undefined,
          ultimaMensagem,
          horario: hora,
          horarioOrdenacao: dt.getTime(),
          departamento: a.departamento?.name || undefined,
          canal: 'WhatsApp',
          status: mapStatus(a.status),
          mensagensNovas: 0,
          atendenteId: a.atendenteId != null ? String(a.atendenteId) : undefined,
        }
      })
      dispatch(setChats(items))
      return items
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao listar atendimentos'
      dispatch(showSnackbar({ message: msg, severity: 'error' }))
      return rejectWithValue(msg)
    }
  }
)

export const createAtendimentoAsync = createAsyncThunk(
  'chats/createAtendimento',
  async (payload: { clientId: number; departamentoId?: number }, { dispatch, rejectWithValue }) => {
    try {
      const body: any = { clientId: payload.clientId, startActive: true }
      if (payload.departamentoId != null) body.departamentoId = payload.departamentoId
      const { data } = await api.post('/atendimentos', body)
      const atendimento = data
      // Buscar dados do cliente para compor a lista
      let pessoa: any = null
      try {
        const resp = await api.get(`/pessoas/${atendimento.clienteId}`)
        pessoa = resp.data
      } catch {}
      const now = new Date()
      const pad = (n: number) => `${n}`.padStart(2, '0')
      const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      const item: ChatListItem = {
        id: String(atendimento.id),
        nome: pessoa?.nome ?? pessoa?.name ?? 'Cliente',
        telefone: pessoa?.telefone ?? pessoa?.phone,
        foto: pessoa?.foto ?? pessoa?.photoUrl,
        ultimaMensagem: 'Novo atendimento',
        horario: hora,
        horarioOrdenacao: Date.now(),
        departamento: undefined,
        canal: 'WhatsApp',
        status: String(atendimento.status || '').toLowerCase() as any,
        mensagensNovas: 0,
      }
      dispatch(addChat(item))
      dispatch(selectChat(item.id))
      dispatch(showSnackbar({ message: 'Atendimento criado', severity: 'success' }))
      // Recarregar da API para garantir sincronismo com o backend
      try { await (dispatch as any)(loadAtendimentosAsync(undefined)).unwrap() } catch {}
      return item
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao criar atendimento'
      dispatch(showSnackbar({ message: msg, severity: 'error' }))
      return rejectWithValue(msg)
    }
  }
)


