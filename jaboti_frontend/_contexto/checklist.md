# Checklist de Desenvolvimento - Jaboti Frontend

- [ ] Estrutura Inicial do Projeto
    - [ ] Configurar projeto React com Vite
    - [ ] Instalar dependências principais (Material UI, Styled Components, Redux Toolkit, Axios, WebSockets, React Router, React Hook Form, Yup)
    - [ ] Configurar ESLint, Prettier e editorconfig

- [ ] Organização de Pastas
    - [ ] Criar estrutura conforme contextoTecnologia.md: src, api, assets, components, features, hooks, layouts, pages, redux, routes, services, styles, utils

- [ ] Configuração de Internacionalização
    - [ ] Adicionar react-i18next e configurar idioma padrão

- [ ] Autenticação e Controle de Acesso
    - [ ] Implementar tela de login
    - [ ] Gerenciar token JWT e perfis de acesso
    - [ ] Implementar seleção de empresa no login (multiempresa)
    - [ ] Proteger rotas conforme perfil

- [ ] Dashboard Personalizável
    - [ ] Criar componentes de widgets
    - [ ] Implementar drag-and-drop e persistência de configuração por usuário

- [ ] Gestão de Departamentos
    - [ ] Listar, criar, editar e vincular atendentes a departamentos
    - [ ] Implementar filtros por departamento

- [ ] Gestão de Atendentes
    - [ ] Cadastro, edição, exclusão e status online/offline

- [ ] Gestão de Clientes (CRM)
    - [ ] Visualizar dados completos, histórico de interações e notas
    - [ ] Implementar busca avançada

- [ ] Módulo de Atendimento (Chat)
    - [ ] Categorizar conversas (Bot, Pendentes, Ativos)
    - [ ] Implementar ações: iniciar, encerrar, transferir, anotar, consultar histórico

- [ ] Integração e Configuração de Canais (CloudAPI, EvolutionAPI)
    - [ ] Criar interfaces para configuração e gestão dos canais
    - [ ] Gerenciar credenciais, parâmetros e status das integrações

- [ ] Comunicação com Backend
    - [ ] Configurar Axios para REST e WebSockets para tempo real
    - [ ] Padronizar formato de mensagens

- [ ] Testes e Validação
    - [ ] Implementar testes unitários e de integração
    - [ ] Validar fluxos críticos (login, seleção de empresa, atendimento)

- [ ] Documentação
    - [ ] Documentar arquitetura, fluxos e APIs
    - [ ] Atualizar contexto conforme evolução do projeto

- [ ] Futuras Expansões
    - [ ] Relatórios gráficos, filtros avançados, integração com IA, WebSockets para atualização em tempo real
