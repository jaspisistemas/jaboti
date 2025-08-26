# Arquitetura Técnica - Jaboti Frontend

## 1. Tecnologias Base
- **Linguagem:** JavaScript/TypeScript
- **Framework:** React
- **Gerenciador de Pacotes:** npm
- **UI Library:** Material UI (MUI) + Styled Components
- **Gerenciamento de Estado:** Redux Toolkit + Redux Persist
- **Comunicação com Backend:** Axios (REST) + WebSockets (tempo real)
- **Roteamento:** React Router DOM
- **Controle de Formulários:** React Hook Form + Yup (validação)
- **Build & Deploy:** Vite ou Create React App (preferência por Vite para performance)
- **Internacionalização (futuro):** react-i18next

---

## 2. Estrutura de Pastas
/src
/api -> funções para chamadas HTTP (Axios)
/assets -> ícones, imagens, fontes
/components -> componentes reutilizáveis
/features -> cada módulo funcional (login, dashboard, chat, etc.)
/hooks -> hooks customizados
/layouts -> layouts principais
/pages -> páginas do sistema
/redux -> slices, store, middlewares
/routes -> configuração das rotas
/services -> integrações com WebSocket, etc.
/styles -> temas e variáveis globais
/utils -> funções utilitárias


---

## 3. Módulos Funcionais

### 3.1 Autenticação
- **Login** com usuário e senha.
- **Armazenamento de token JWT** no localStorage (via Redux Persist).
- **Proteção de rotas** para usuários autenticados.
- **Perfis de acesso:** Operador, Supervisor, Administrador.

---

### 3.2 Dashboard Personalizável
- Lista de **widgets** disponíveis (primeira fase):
  - Duração média dos atendimentos.
  - Quantidade de atendimentos do dia.
  - Custo acumulado da CloudAPI (janela de 24h).
  - Tempo médio de espera.
- **Drag-and-drop** para reordenar widgets.
- Persistência da configuração por usuário.

---

### 3.3 Gestão de Departamentos
- Visualizar lista de departamentos.
- Vincular atendentes a múltiplos departamentos.
- Filtro por departamento nas telas de atendimento.

---

### 3.4 Gestão de Atendentes
- Cadastro, edição e exclusão.
- Definir departamentos de atuação.
- Controle de status (online/offline).

---

### 3.5 Gestão de Clientes (CRM)
- Exibição de dados completos.
- Histórico de interações.
- Criação, edição e exclusão de anotações.
- Busca avançada.

---

### 3.6 Atendimento (Chat)
- Categorias:
  1. Bot (fluxo automatizado).
  2. Pendentes (aguardando atribuição).
  3. Ativos (atendimentos em andamento).
- Ações:
  - Iniciar atendimento.
  - Encerrar atendimento.
  - Transferir para outro atendente ou departamento.
  - Criar e consultar anotações.
- Histórico pessoal do atendente logado.

---

## 4. Comunicação com Backend
- **REST API** para dados estáticos e CRUDs.
- **WebSockets** para mensagens e eventos em tempo real.
- **Formato padrão de mensagens:** JSON padronizado com campos `id`, `timestamp`, `type`, `payload`.

---

## 5. Padrões de Código
- Componentes funcionais com hooks.
- Tipagem com TypeScript.
- Arquitetura **feature-based** para separar funcionalidades.
- Testes unitários com Jest + React Testing Library.
- ESLint + Prettier para padronização.

---

## 6. Segurança
- Armazenar JWT no `localStorage` com expiração.
- Revalidação automática de token.
- Controle de permissões no frontend e backend.

---

## 7. Futuras Expansões
- Modo dark/light.
- Integração com IA para sugestões no chat.
- Gráficos avançados com Recharts ou Chart.js.
- Notificações em tempo real com Service Workers.