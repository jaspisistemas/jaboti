// Tipos compartilhados entre Frontend e Backend

// ===== USUÁRIOS E AUTENTICAÇÃO =====
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'attendant' | 'client';
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ===== EMPRESAS =====
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== DEPARTAMENTOS =====
export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== ATENDIMENTOS =====
export interface Chat {
  id: string;
  clientId: string;
  attendantId?: string;
  departmentId: string;
  companyId: string;
  status: 'pending' | 'active' | 'closed' | 'transferred';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

// ===== MENSAGENS =====
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'client' | 'attendant' | 'bot';
  content?: string;
  attachment?: MessageAttachment;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isFromWhatsApp: boolean;
  whatsappMessageId?: string;
}

export interface MessageAttachment {
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  url: string;
  name?: string;
  size?: number;
  duration?: number;
  mimeType: string;
}

// ===== CLIENTES =====
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyId: string;
  tags: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== ATENDENTES =====
export interface Attendant {
  id: string;
  userId: string;
  departmentId: string;
  companyId: string;
  isOnline: boolean;
  lastSeen: Date;
  maxChats: number;
  currentChats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== NOTIFICAÇÕES =====
export interface Notification {
  id: string;
  userId: string;
  type: 'chat' | 'system' | 'alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// ===== WEBSOCKET EVENTS =====
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export interface ChatEvent extends WebSocketEvent {
  type: 'chat_message' | 'chat_status_change' | 'chat_transfer';
  data: {
    chatId: string;
    message?: Message;
    status?: string;
    attendantId?: string;
  };
}

// ===== API RESPONSES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== FILTERS E QUERIES =====
export interface ChatFilters {
  status?: string[];
  priority?: string[];
  departmentId?: string;
  attendantId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface MessageFilters {
  chatId?: string;
  senderType?: string[];
  hasAttachment?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// ===== ENUMS =====
export enum ChatStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ===== UTILITIES =====
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
