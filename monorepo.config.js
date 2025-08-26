module.exports = {
  // Configuração do monorepo
  name: 'jabotijs',
  version: '1.0.0',
  
  // Workspaces
  workspaces: [
    'jaboti_frontend',
    'jaboti_backend',
    'shared'
  ],
  
  // Scripts globais
  scripts: {
    // Desenvolvimento
    dev: 'concurrently "npm run dev:backend" "npm run dev:frontend"',
    dev:frontend: 'cd jaboti_frontend && npm run dev',
    dev:backend: 'cd jaboti_backend && npm run dev',
    
    // Build
    build: 'npm run build:frontend && npm run build:backend',
    build:frontend: 'cd jaboti_frontend && npm run build',
    build:backend: 'cd jaboti_backend && npm run build',
    
    // Testes
    test: 'npm run test:frontend && npm run test:backend',
    test:frontend: 'cd jaboti_frontend && npm test',
    test:backend: 'cd jaboti_backend && npm test',
    
    // Limpeza
    clean: 'npm run clean:frontend && npm run clean:backend',
    clean:frontend: 'cd jaboti_frontend && rm -rf node_modules dist',
    clean:backend: 'cd jaboti_backend && rm -rf node_modules dist',
    
    // Banco de dados
    db:migrate: 'cd jaboti_backend && npm run db:migrate',
    db:seed: 'cd jaboti_backend && npm run db:seed',
    db:reset: 'cd jaboti_backend && npm run db:reset',
    
    // Docker
    docker:up: 'docker-compose up -d',
    docker:down: 'docker-compose down',
    docker:build: 'docker-compose build',
    docker:logs: 'docker-compose logs -f',
    
    // Linting e formatação
    lint: 'npm run lint:frontend && npm run lint:backend',
    lint:frontend: 'cd jaboti_frontend && npm run lint',
    lint:backend: 'cd jaboti_backend && npm run lint',
    
    format: 'npm run format:frontend && npm run format:backend',
    format:frontend: 'cd jaboti_frontend && npm run format',
    format:backend: 'cd jaboti_backend && npm run format',
    
    // Instalação
    install:all: 'npm install && cd jaboti_frontend && npm install && cd ../jaboti_backend && npm install',
    install:shared: 'cd shared && npm install',
    
    // Verificações
    check: 'npm run lint && npm run test && npm run build',
    check:types: 'npm run check:types:frontend && npm run check:types:backend',
    check:types:frontend: 'cd jaboti_frontend && npm run check:types',
    check:types:backend: 'cd jaboti_backend && npm run check:types',
  },
  
  // Configurações de desenvolvimento
  dev: {
    // Portas
    frontend: 5173,
    backend: 3000,
    database: 5432,
    redis: 6379,
    
    // URLs
    frontend_url: 'http://localhost:5173',
    backend_url: 'http://localhost:3000',
    api_url: 'http://localhost:3000/api',
  },
  
  // Configurações de produção
  production: {
    // URLs (configurar conforme ambiente)
    frontend_url: process.env.FRONTEND_URL || 'https://app.jaboti.com',
    backend_url: process.env.BACKEND_URL || 'https://api.jaboti.com',
    api_url: process.env.API_URL || 'https://api.jaboti.com/api',
  },
  
  // Dependências compartilhadas
  sharedDependencies: {
    // Tipos compartilhados
    types: ['@types/node', 'typescript'],
    
    // Utilitários compartilhados
    utils: ['lodash', 'moment', 'axios'],
    
    // Validação
    validation: ['joi', 'yup', 'class-validator'],
    
    // Testes
    testing: ['jest', '@types/jest', 'supertest'],
  },
  
  // Configurações de build
  build: {
    // Frontend
    frontend: {
      outDir: 'dist',
      sourceMap: true,
      minify: true,
    },
    
    // Backend
    backend: {
      outDir: 'dist',
      sourceMap: true,
      minify: false, // Backend não deve ser minificado
    },
  },
  
  // Configurações de teste
  test: {
    // Jest
    jest: {
      preset: 'ts-jest',
      testEnvironment: 'node',
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
    },
    
    // E2E
    e2e: {
      framework: 'playwright',
      browsers: ['chromium', 'firefox', 'webkit'],
    },
  },
  
  // Configurações de deploy
  deploy: {
    // Ambientes
    environments: ['development', 'staging', 'production'],
    
    // Estratégias
    strategies: {
      development: 'local',
      staging: 'docker',
      production: 'kubernetes',
    },
    
    // Rollback
    rollback: {
      enabled: true,
      maxVersions: 5,
    },
  },
  
  // Configurações de monitoramento
  monitoring: {
    // Logs
    logs: {
      level: 'info',
      format: 'json',
      destination: 'file',
    },
    
    // Métricas
    metrics: {
      enabled: true,
      interval: 60000, // 1 minuto
      endpoint: '/metrics',
    },
    
    // Alertas
    alerts: {
      enabled: true,
      channels: ['email', 'slack'],
    },
  },
};
