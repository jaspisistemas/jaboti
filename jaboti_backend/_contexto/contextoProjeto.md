# Projeto: Jaboti Frontend
**Tipo**: Interface Web de Atendimento Multiatendente  
**Tecnologia base**: React (com futura integração ao backend NestJS)  
**Integrações principais**: CloudAPI e EvolutionAPI (canais de entrada do cliente)


## Objetivo Geral
*Desenvolver um painel de atendimento e gestão para operadores, supervisores e administradores, com foco em **produtividade, monitoramento em tempo real** e **integração total com o middleware Jaboti**.
O Jaboti é um sistema multiatendente e multicanal, centralizando a implementação das APIs do WhatsApp e disponibilizando uma API própria para integração com outros projetos internos. Isso permite que diferentes canais de atendimento sejam gerenciados de forma unificada, ampliando a flexibilidade e o alcance do sistema.*
O sistema será multiempresa, permitindo que um atendente tenha acesso a múltiplas empresas. No login, caso o usuário esteja vinculado a mais de uma empresa, deverá selecionar em qual empresa deseja atuar na sessão.
Além disso, haverá integração direta com as plataformas CloudAPI e EvolutionAPI, que serão os canais de entrada dos clientes. Interfaces específicas serão desenvolvidas para configuração e gestão dessas integrações, garantindo flexibilidade e controle sobre os canais de atendimento.*


## Objetivos Específicos
1. Fornecer um **dashboard personalizável** com indicadores de performance.
2. Facilitar **atendimento multiusuário e multidisciplinar**, com possibilidade de transferência e histórico.
3. Garantir **acesso controlado** via autenticação e gestão de usuários.
4. Permitir **visualização e manipulação de dados do cliente** integrados ao CRM.
5. Oferecer **ferramentas rápidas** de anotação e consulta histórica para decisões mais assertivas.

---

## Módulos Principais
### 0. Integração e Configuração de Canais (CloudAPI e EvolutionAPI)
- Interfaces para configuração das plataformas CloudAPI e EvolutionAPI.
- Definição dos canais de entrada do cliente.
- Gestão de credenciais, parâmetros e status das integrações.
- Visualização dos canais ativos por empresa.

### 1. Autenticação e Controle de Acesso
  - Seleção de empresa no login, caso o atendente tenha acesso a múltiplas empresas.


### 2. Dashboard Inicial Personalizável
- Adicionar/remover **widgets** a partir de um seletor.
- Indicadores disponíveis (primeira fase):
  - Duração média dos atendimentos.
  - Quantidade de atendimentos do dia.
  - Custo total acumulado da CloudAPI (por janela de 24h).
  - Tempo médio de espera para atendimento.
- Layout com **drag-and-drop** e persistência de configuração por usuário.

---

### 3. Gestão de Departamentos
- Um atendente pode pertencer a múltiplos departamentos.
- Lista de departamentos com nome, descrição e atendentes vinculados.
- Filtros por departamento nas telas de atendimento.

---

### 4. Gestão de Atendentes
- Cadastro/edição de atendentes.
- Definição de departamentos de atuação.
- Status online/offline.

---

### 5. Gestão de Clientes (CRM Integrado)
- Visualização de dados completos do cliente.
- Histórico de interações.
- Notas associadas ao cliente (criação, edição, exclusão).
- Busca avançada por nome, documento, telefone, e-mail.

---

### 6. Módulo de Atendimento (Chat)
- Três categorias de conversas:
  1. **Bot**: conversas ainda em fluxo automatizado.
  2. **Pendentes**: aguardando atribuição dentro dos departamentos que o atendente tem acesso.
  3. **Ativos**: atendimentos em andamento com o atendente logado.
- Ações no atendimento:
  - Iniciar atendimento.
  - Encerrar atendimento.
  - Transferir para outro atendente ou departamento.
  - Criar anotações para aquele cliente.
  - Consultar anotações anteriores.
- **Histórico pessoal**: lista dos últimos atendimentos realizados pelo atendente logado.

---

## Futuras Expansões
- Relatórios gráficos de desempenho.
- Filtros avançados por tempo, departamento, atendente.
- Integração com IA para sugestões de respostas e classificação automática.
- Integração com WebSockets para atualização em tempo real.
