# 🚀 Guia de Deploy - JabotiJS

## 📋 Opções de Deploy

### 1. 🖥️ **Deploy no Mesmo Servidor (Recomendado para início)**

#### Pré-requisitos:
- Node.js 18+ 
- PostgreSQL
- Redis
- PM2 (recomendado para produção)

#### Passos:
```bash
# 1. Clonar o repositório
git clone https://github.com/jaspisistemas/jaboti.git
cd jaboti

# 2. Instalar dependências
npm run install:all

# 3. Configurar variáveis de ambiente
cp jaboti_backend/env.example jaboti_backend/.env
cp jaboti_frontend/env.example jaboti_frontend/.env

# 4. Compilar
npm run build

# 5. Iniciar com PM2
pm2 start ecosystem.config.js
```

### 2. 🌐 **Deploy em Servidores Separados**

#### Frontend (Servidor 1):
```bash
cd jaboti_frontend
npm install
npm run build
# Servir a pasta dist com nginx/apache
```

#### Backend (Servidor 2):
```bash
cd jaboti_backend
npm install
npm run build
npm start
```

## ⚙️ **Configurações de Produção**

### Frontend:
- Porta: 3522 (dev) / 4173 (preview)
- Build: `npm run build`
- Preview: `npm run preview`

### Backend:
- Porta: 3523 (configurável via PORT)
- Build: `npm run build`
- Start: `npm start`

## 🔧 **Variáveis de Ambiente**

### Backend (.env):
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/jaboti_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3523
```

### Frontend (.env):
```bash
VITE_API_BASE_URL="https://api.seuservidor.com"
VITE_WS_URL="wss://api.seuservidor.com"
```

## 📁 **Estrutura de Deploy**

```
servidor/
├── jaboti_frontend/
│   ├── dist/           # Frontend compilado
│   └── package.json
├── jaboti_backend/
│   ├── dist/           # Backend compilado
│   ├── uploads/        # Arquivos enviados
│   └── package.json
└── ecosystem.config.js  # PM2 (opcional)
```

## 🚀 **Comandos Rápidos**

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Instalar dependências
npm run install:all

# Limpar builds
npm run clean
```

## 🔒 **Segurança em Produção**

1. **HTTPS obrigatório**
2. **Variáveis de ambiente seguras**
3. **CORS configurado corretamente**
4. **JWT_SECRET forte**
5. **Firewall configurado**
6. **Backup automático do banco**

## 📊 **Monitoramento**

- **PM2**: Para gerenciar processos Node.js
- **Logs**: Verificar logs do backend
- **Métricas**: Monitorar uso de recursos
- **Backup**: Backup automático do PostgreSQL
