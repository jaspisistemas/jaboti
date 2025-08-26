# Checklist de Desenvolvimento - Jaboti Backend (NestJS)

- [ ] Configuração Inicial do Projeto
    - [ ] Criar projeto NestJS com CLI
    - [ ] Configurar TypeScript e ambiente
    - [ ] Instalar dependências principais (Prisma, Passport, JWT, class-validator, class-transformer, socket.io)
    - [ ] Configurar ESLint e Prettier

- [ ] Estruturação dos Módulos
    - [ ] Criar módulos: auth, users, companies, departments, clients, chats, notes, integrations, dashboard, websocket, common
    - [ ] Implementar DTOs e entidades para cada módulo
    - [ ] Configurar conexão com banco PostgreSQL

- [ ] Autenticação e Autorização
    - [ ] Implementar login com JWT e refresh token
    - [ ] Criar guards para roles (operador, supervisor, admin)
    - [ ] Implementar seleção de empresa na sessão
    - [ ] Proteger rotas com guards baseados em perfil e empresa

- [ ] Gestão de Empresas, Departamentos e Usuários
    - [ ] CRUD empresas e departamentos com relacionamentos
    - [ ] CRUD usuários (atendentes) com vínculo a departamentos e empresas
    - [ ] Endpoint para atualização status online/offline do usuário

- [ ] Gestão de Clientes (CRM)
    - [ ] CRUD clientes e busca avançada
    - [ ] Histórico de interações e associações com atendimentos e notas

- [ ] Módulo de Atendimento (Chat)
    - [ ] Listagem de chats por categoria (bot, pendentes, ativos)
    - [ ] Iniciar, encerrar e transferir atendimentos
    - [ ] Persistência e recuperação de mensagens
    - [ ] Histórico pessoal de atendimentos do usuário logado

- [ ] Notas e Anotações
    - [ ] CRUD notas vinculadas a clientes e atendimentos
    - [ ] Controle de autoria e timestamps

- [ ] Integração com CloudAPI e EvolutionAPI
    - [ ] CRUD configurações por empresa para cada plataforma
    - [ ] Gerenciamento de credenciais e status das integrações
    - [ ] Logs e monitoramento das chamadas das APIs externas

- [ ] Dashboard e Indicadores
    - [ ] Endpoints para métricas: duração média, quantidade atendimentos, custo CloudAPI, tempo de espera
    - [ ] Persistência da configuração dos widgets por usuário

- [ ] Comunicação em Tempo Real (WebSocket)
    - [ ] Implementar Gateway WebSocket com socket.io
    - [ ] Eventos para mensagens, status atendentes, transferências, dashboard

- [ ] Validação e Segurança
    - [ ] Validar dados de entrada com class-validator
    - [ ] Aplicar rate limiting e sanitização
    - [ ] Implementar logs de auditoria

- [ ] Testes
    - [ ] Desenvolver testes unitários para serviços e controllers
    - [ ] Desenvolver testes e2e para fluxos críticos (autenticação, atendimento, transferência)

- [ ] Documentação
    - [ ] Gerar documentação Swagger para todas as APIs REST
    - [ ] Documentar eventos WebSocket e payloads
    - [ ] Atualizar documentação conforme evolução

- [ ] Deploy e Monitoramento
    - [ ] Configurar scripts de build e deploy
    - [ ] Monitorar logs e métricas de uso em ambiente produtivo

- [ ] Futuras Expansões
    - [ ] Relatórios gráficos e filtros avançados
    - [ ] Integração com IA para sugestões e automações
    - [ ] Aprimoramento das notificações em tempo real

