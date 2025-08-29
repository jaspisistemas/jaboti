// Configurações de produção para o backend
export const productionConfig = {
  // Servidor
  PORT: process.env.PORT || 3523,
  NODE_ENV: 'production',
  
  // CORS - URLs permitidas (ajustar conforme seus domínios)
  CORS_ORIGINS: [
    'https://seuservidor.com',
    'https://www.seuservidor.com',
    'https://app.seuservidor.com'
  ],
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/jaboti_db',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production',
  JWT_EXPIRES_IN: '7d',
  
  // Uploads
  MAX_FILE_SIZE: 10485760, // 10MB
  UPLOAD_PATH: './uploads',
  
  // Logging
  LOG_LEVEL: 'info'
};
