# JabotiJS - Sistema de Atendimento e Chat

Sistema completo de atendimento ao cliente com chat integrado, desenvolvido em React (frontend) e NestJS (backend).

## 🚀 Tecnologias

### Frontend
- **React 19** com TypeScript
- **Material-UI (MUI)** para componentes
- **Redux Toolkit** para gerenciamento de estado
- **React Router** para navegação
- **Vite** para build e desenvolvimento
- **Socket.io** para comunicação em tempo real

### Backend
- **NestJS** com TypeScript
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **Redis** para cache e sessões
- **JWT** para autenticação
- **Socket.io** para WebSockets
- **Multer** para upload de arquivos

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** 9+
- **PostgreSQL** 15+
- **Redis** 7+

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/jabotijs.git
cd jabotijs
```

### 2. Instale as dependências
```bash
npm run install:all
```

### 3. Configure as variáveis de ambiente

#### Backend
```bash
cd jaboti_backend
cp env.example .env
# Edite o arquivo .env com suas configurações
```

#### Frontend
```bash
cd jaboti_frontend
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Configure o banco de dados
```bash
# No diretório raiz
npm run db:migrate
npm run db:seed
```

## 🚀 Desenvolvimento

### Executar em modo de desenvolvimento
```bash
# Executa frontend e backend simultaneamente
npm run dev

# Ou individualmente:
npm run dev:frontend    # Frontend na porta 5173
npm run dev:backend     # Backend na porta 3000
```

### Build para produção
```bash
npm run build
```

## 📁 Estrutura do Projeto

```
jabotijs/
├── jaboti_frontend/          # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── features/         # Funcionalidades específicas
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── hooks/            # Custom hooks
│   │   ├── redux/            # Store Redux
│   │   └── utils/            # Utilitários
│   └── public/               # Arquivos estáticos
├── jaboti_backend/           # Backend NestJS
│   ├── src/
│   │   ├── auth/             # Autenticação
│   │   ├── chats/            # Sistema de chat
│   │   ├── atendimentos/     # Gestão de atendimentos
│   │   ├── users/            # Usuários
│   │   └── prisma/           # Configuração do banco
│   └── uploads/              # Arquivos enviados
└── shared/                   # Código compartilhado
    ├── types/                # Tipos TypeScript
    ├── constants/            # Constantes
    └── utils/                # Utilitários
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa frontend e backend em desenvolvimento
- `npm run build` - Build de produção para ambos os projetos
- `npm run install:all` - Instala dependências de todos os projetos
- `npm run clean` - Remove node_modules e dist de todos os projetos
- `npm run db:migrate` - Executa migrações do banco
- `npm run db:seed` - Popula o banco com dados de exemplo

## 🌐 Portas

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **PostgreSQL**: 5432
- **Redis**: 6379

## 📝 Funcionalidades

### Sistema de Chat
- Chat em tempo real com WebSockets
- Histórico de mensagens
- Suporte a diferentes tipos de mídia (texto, áudio, imagem, arquivo)
- Sistema de controle de áudio avançado com modal flutuante
- Controle de velocidade de reprodução
- Barra de progresso interativa

### Gestão de Atendimentos
- Criação e acompanhamento de atendimentos
- Sistema de filas
- Histórico completo
- Integração com WhatsApp

### Autenticação
- Login/logout
- Controle de acesso baseado em roles
- JWT para sessões

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para suporte@jaboti.com ou abra uma issue no GitHub.
