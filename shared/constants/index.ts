// Constantes compartilhadas entre Frontend e Backend

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    AVATAR: '/users/avatar',
  },
  
  // Companies
  COMPANIES: {
    BASE: '/companies',
    SELECT: '/companies/select',
  },
  
  // Departments
  DEPARTMENTS: {
    BASE: '/departments',
    MEMBERS: '/departments/:id/members',
  },
  
  // Chats
  CHATS: {
    BASE: '/chats',
    MESSAGES: '/chats/:id/messages',
    TRANSFER: '/chats/:id/transfer',
    CLOSE: '/chats/:id/close',
    ASSIGN: '/chats/:id/assign',
  },
  
  // Messages
  MESSAGES: {
    BASE: '/messages',
    SEND: '/messages/send',
    UPLOAD: '/messages/upload',
  },
  
  // Clients
  CLIENTS: {
    BASE: '/clients',
    SEARCH: '/clients/search',
  },
  
  // Attendants
  ATTENDANTS: {
    BASE: '/attendants',
    ONLINE: '/attendants/online',
    STATUS: '/attendants/:id/status',
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
} as const;

// ===== WEBSOCKET EVENTS =====
export const WS_EVENTS = {
  // Chat events
  CHAT_MESSAGE: 'chat_message',
  CHAT_STATUS_CHANGE: 'chat_status_change',
  CHAT_TRANSFER: 'chat_transfer',
  CHAT_ASSIGN: 'chat_assign',
  
  // User events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_TYPING: 'user_typing',
  
  // System events
  NOTIFICATION: 'notification',
  SYSTEM_ALERT: 'system_alert',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
} as const;

// ===== HTTP STATUS CODES =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===== PAGINATION =====
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ===== FILE UPLOADS =====
export const FILE_UPLOADS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  MAX_FILES: 5,
} as const;

// ===== CHAT CONSTRAINTS =====
export const CHAT_CONSTRAINTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
  MAX_CHATS_PER_ATTENDANT: 10,
  AUTO_CLOSE_AFTER_HOURS: 24,
} as const;

// ===== TIME CONSTANTS =====
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  
  // Timeouts
  TYPING_TIMEOUT: 3000,
  RECONNECT_TIMEOUT: 5000,
  HEARTBEAT_INTERVAL: 30000,
  
  // Cache
  TOKEN_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  USER_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

// ===== ROLES & PERMISSIONS =====
export const ROLES = {
  ADMIN: 'admin',
  ATTENDANT: 'attendant',
  CLIENT: 'client',
} as const;

export const PERMISSIONS = {
  // Chat permissions
  VIEW_CHATS: 'view_chats',
  CREATE_CHATS: 'create_chats',
  EDIT_CHATS: 'edit_chats',
  DELETE_CHATS: 'delete_chats',
  TRANSFER_CHATS: 'transfer_chats',
  
  // User permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Company permissions
  VIEW_COMPANIES: 'view_companies',
  CREATE_COMPANIES: 'create_companies',
  EDIT_COMPANIES: 'edit_companies',
  DELETE_COMPANIES: 'delete_companies',
} as const;

// ===== ENVIRONMENT =====
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// ===== FEATURE FLAGS =====
export const FEATURES = {
  WHATSAPP_INTEGRATION: 'whatsapp_integration',
  VOICE_MESSAGES: 'voice_messages',
  VIDEO_CALLS: 'video_calls',
  AI_CHATBOT: 'ai_chatbot',
  ANALYTICS: 'analytics',
  MULTI_LANGUAGE: 'multi_language',
} as const;

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  TOKEN_EXPIRED: 'Token expirado',
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  
  // Validation errors
  REQUIRED_FIELD: 'Campo obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Telefone inválido',
  FILE_TOO_LARGE: 'Arquivo muito grande',
  INVALID_FILE_TYPE: 'Tipo de arquivo inválido',
  
  // Business errors
  CHAT_NOT_FOUND: 'Chat não encontrado',
  USER_NOT_FOUND: 'Usuário não encontrado',
  COMPANY_NOT_FOUND: 'Empresa não encontrada',
  DEPARTMENT_NOT_FOUND: 'Departamento não encontrado',
  
  // System errors
  INTERNAL_ERROR: 'Erro interno do servidor',
  SERVICE_UNAVAILABLE: 'Serviço indisponível',
  DATABASE_ERROR: 'Erro no banco de dados',
  NETWORK_ERROR: 'Erro de conexão',
} as const;

// ===== SUCCESS MESSAGES =====
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  
  // Chat
  CHAT_CREATED: 'Chat criado com sucesso',
  CHAT_UPDATED: 'Chat atualizado com sucesso',
  CHAT_CLOSED: 'Chat fechado com sucesso',
  MESSAGE_SENT: 'Mensagem enviada com sucesso',
  
  // User
  USER_CREATED: 'Usuário criado com sucesso',
  USER_UPDATED: 'Usuário atualizado com sucesso',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso',
  
  // File
  FILE_UPLOADED: 'Arquivo enviado com sucesso',
  FILE_DELETED: 'Arquivo removido com sucesso',
} as const;
