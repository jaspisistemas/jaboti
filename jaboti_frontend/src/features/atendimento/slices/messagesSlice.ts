import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { MessageItem } from '../../../vite-env'
import api from '../../../api'

interface MessagesState {
  byChatId: Record<string, MessageItem[]>
}

const initialState: MessagesState = {
  byChatId: {},
}

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setChatMessages(state, action: { payload: { chatId: string; messages: MessageItem[] } }) {
      const { chatId, messages } = action.payload
      console.log('Redux: Definindo mensagens do chat:', { chatId, count: messages.length })
      
      // Verificar se há mensagens temporárias que devem ser preservadas
      const existingMessages = state.byChatId[chatId] || []
      const tempMessages = existingMessages.filter(m => m.id.startsWith('temp-'))
      
      if (tempMessages.length > 0) {
        console.log('Redux: Preservando mensagens temporárias:', tempMessages.length)
        // Combinar mensagens do backend com mensagens temporárias
        const allMessages = [...messages, ...tempMessages]
        state.byChatId[chatId] = allMessages
        console.log('Redux: Total de mensagens após combinação:', allMessages.length)
      } else {
        state.byChatId[chatId] = messages
      }
    },
    addMessage(state, action: { payload: { chatId: string; message: MessageItem } }) {
      const { chatId, message } = action.payload
      console.log('Redux: Adicionando mensagem:', { chatId, message })
      
      if (!state.byChatId[chatId]) {
        state.byChatId[chatId] = []
        console.log('Redux: Criado array vazio para chat:', chatId)
      }
      
      state.byChatId[chatId].push(message)
      console.log('Redux: Mensagem adicionada. Total de mensagens no chat:', state.byChatId[chatId].length)
    },
    updateMessage(state, action: { payload: { chatId: string; messageId: string; updatedMessage: MessageItem } }) {
      const { chatId, messageId, updatedMessage } = action.payload
      console.log('Redux: Atualizando mensagem:', { chatId, messageId, updatedMessage })
      
      if (!state.byChatId[chatId]) {
        console.error('Redux: Chat não encontrado:', chatId)
        return
      }
      
      const messageIndex = state.byChatId[chatId].findIndex(m => m.id === messageId)
      console.log('Redux: Índice da mensagem encontrado:', messageIndex)
      
      if (messageIndex >= 0) {
        console.log('Redux: Mensagem antes da atualização:', state.byChatId[chatId][messageIndex])
        state.byChatId[chatId][messageIndex] = updatedMessage
        console.log('Redux: Mensagem após atualização:', state.byChatId[chatId][messageIndex])
      } else {
        console.error('Redux: Mensagem não encontrada para atualização:', messageId)
        console.log('Redux: Mensagens disponíveis:', state.byChatId[chatId].map(m => ({ id: m.id, type: m.type })))
      }
    },
    removeMessage(state, action: { payload: { chatId: string; messageId: string } }) {
      const { chatId, messageId } = action.payload
      if (!state.byChatId[chatId]) return
      state.byChatId[chatId] = state.byChatId[chatId].filter(m => m.id !== messageId)
    },
    seedMessages(state) {
      const now = new Date()
      const pad = (n: number) => `${n}`.padStart(2, '0')
      const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      state.byChatId['1'] = [
        { id: 'm1', type: 'session', timestamp: hora, subtype: 'session-start' },
        { id: 'm2', type: 'message', senderIsMe: false, content: 'Olá, preciso de ajuda com meu pedido', timestamp: hora },
        { id: 'm3', type: 'message', senderIsMe: true, content: 'Claro! Pode me informar o número do pedido?', timestamp: hora },
        { id: 'm4', type: 'message', senderIsMe: false, content: 'Segue uma imagem do produto com defeito', timestamp: hora, attachment: { type: 'IMAGE', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', name: 'produto.jpg' } },
        { id: 'm5', type: 'message', senderIsMe: true, content: 'Ok, obrigado! Vou ouvir o áudio também.', timestamp: hora },
        { id: 'm6', type: 'message', senderIsMe: false, timestamp: hora, attachment: { type: 'AUDIO', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: 'audio.mp3' } },
      ]
      state.byChatId['2'] = [
        { id: 'm7', type: 'session', timestamp: hora, subtype: 'session-start' },
        { id: 'm8', type: 'message', senderIsMe: false, content: 'Consegue me enviar a NF?', timestamp: hora },
        { id: 'm9', type: 'message', senderIsMe: true, content: 'Posso sim! Enquanto isso, veja este vídeo explicativo.', timestamp: hora },
        { id: 'm10', type: 'message', senderIsMe: true, timestamp: hora, attachment: { type: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', name: 'video.mp4' } },
      ]
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadChatMessagesAsync.fulfilled, (state, action) => {
      const { chatId, messages } = action.payload
      console.log('Redux: loadChatMessagesAsync.fulfilled:', { chatId, count: messages.length })
      
      // Verificar se há mensagens temporárias que devem ser preservadas
      const existingMessages = state.byChatId[chatId] || []
      const tempMessages = existingMessages.filter(m => m.id.startsWith('temp-'))
      
      if (tempMessages.length > 0) {
        console.log('Redux: Preservando mensagens temporárias do loadChatMessagesAsync:', tempMessages.length)
        // Combinar mensagens do backend com mensagens temporárias
        const allMessages = [...messages, ...tempMessages]
        state.byChatId[chatId] = allMessages
        console.log('Redux: Total de mensagens após combinação do loadChatMessagesAsync:', allMessages.length)
      } else {
        state.byChatId[chatId] = messages
      }
    })
  },
})

// Thunk para carregar mensagens de um atendimento
export const loadChatMessagesAsync = createAsyncThunk(
  'messages/loadChatMessages',
  async (atendimentoId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/atendimentos/${atendimentoId}/messages`)
      
      // Mapear as mensagens do backend para o formato do frontend
      const messages: MessageItem[] = data.map((msg: any) => {
        const now = new Date(msg.timestamp || msg.criadoEm || Date.now())
        const pad = (n: number) => `${n}`.padStart(2, '0')
        const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
        
        const message: MessageItem = {
          id: String(msg.id),
          type: 'message',
          senderIsMe: msg.senderType === 'ATTENDANT',
          content: msg.content || '',
          timestamp: hora,
          attachment: undefined
        }
        
        // Se tem mídia, adicionar attachment
        if (msg.mediaType) {
          console.log('🔍 Processando mensagem com mídia:', {
            id: msg.id,
            mediaType: msg.mediaType,
            metadata: msg.metadata,
            content: msg.content
          })
          
          // O tipo é baseado na intenção do usuário, não no MIME type
          let type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' = 'DOCUMENT'
          
          // Usar o tipo exato enviado pelo backend (baseado na intenção)
          if (msg.mediaType === 'IMAGE') type = 'IMAGE'
          else if (msg.mediaType === 'VIDEO') type = 'VIDEO'
          else if (msg.mediaType === 'AUDIO') type = 'AUDIO'
          else type = 'DOCUMENT'
          
          // Extrair dados da mídia do campo metadata (estrutura correta do Prisma)
          let mediaUrl = null
          let mediaFilename = null
          
          if (msg.metadata && typeof msg.metadata === 'object') {
            // metadata é um objeto JSON com mediaUrl e mediaFilename
            mediaUrl = (msg.metadata as any).mediaUrl
            mediaFilename = (msg.metadata as any).mediaFilename
          }
          
          console.log('📋 Dados da mídia extraídos:', { 
            mediaUrl, 
            mediaFilename, 
            type, 
            metadata: msg.metadata,
            mediaType: msg.mediaType
          })
          
          if (mediaUrl) {
            message.attachment = {
              type,
              url: mediaUrl,
              name: mediaFilename || 'arquivo',
              size: undefined
            }
            console.log('✅ Attachment criado:', message.attachment)
          } else {
            console.warn('⚠️ Mensagem com mídia mas sem URL:', msg)
          }
        }
        
        return message
      })
      
      return { chatId: atendimentoId, messages }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error)
      return rejectWithValue('Erro ao carregar mensagens')
    }
  }
)

export const { setChatMessages, addMessage, updateMessage, removeMessage, seedMessages } = messagesSlice.actions
export default messagesSlice.reducer


