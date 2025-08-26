// Configurações de produção para o frontend
export const productionConfig = {
  // URL da API em produção (ajustar conforme seu servidor)
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.seuservidor.com',
  
  // URL do WebSocket em produção
  WS_URL: process.env.VITE_WS_URL || 'wss://api.seuservidor.com',
  
  // Configurações da aplicação
  APP_NAME: 'Jaboti',
  APP_VERSION: '1.0.0',
  
  // Feature flags
  ENABLE_AUDIO_RECORDING: true,
  ENABLE_FILE_UPLOAD: true,
  ENABLE_WEBSOCKET: true,
  
  // Debug
  DEBUG_MODE: false,
  LOG_LEVEL: 'error'
};
