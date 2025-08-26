/// <reference types="vite/client" />

// Tipos auxiliares para attachments de mensagens
// Baseado na intenção do usuário, não no MIME type
export type MessageAttachmentType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO'

export interface MessageAttachment {
  type: MessageAttachmentType
  url: string
  name?: string
  size?: string
}

export interface ChatListItem {
  id: string
  nome: string
  foto?: string
  telefone?: string
  ultimaMensagem?: string
  horario?: string
  horarioOrdenacao?: number
  departamento?: string
  canal?: string
  status?: 'ativo' | 'pendente' | 'bot' | 'finalizado' | 'pausado'
  mensagensNovas?: number
  atendenteId?: string
}

export interface MessageItem {
  id: string
  type: 'message' | 'session'
  senderIsMe?: boolean
  content?: string
  attachment?: MessageAttachment
  timestamp?: string
  status?: 'pendente' | 'falhou' | 'enviado' | 'apagado' | 'cancelado' | 'entregue' | 'lido' | 'outro'
  referenciaId?: string | number
  subtype?: 'session-start' | 'session-end' | string
}
