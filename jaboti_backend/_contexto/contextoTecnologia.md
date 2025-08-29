# Arquitetura Backend - Jaboti (NestJS)

---

## 1. Tecnologias e Ferramentas

- Node.js + NestJS (framework modular e escalável)
- TypeScript
- Banco de dados: PostgreSQL
- ORM: Prisma
- Autenticação: JWT + Passport.js
- Cache / Mensageria: Redis (sessões, pub/sub)
- WebSocket: NestJS Gateway com socket.io
- Documentação API: Swagger
- Validação: class-validator + class-transformer

---

## 2. Estrutura Geral de Módulos

src/
|-- auth/ # Autenticação e controle de acesso (login, JWT, refresh)
|-- users/ # Gestão de atendentes
|-- companies/ # Gestão de empresas (multiempresa)
|-- departments/ # Gestão de departamentos
|-- clients/ # Gestão de clientes (CRM)
|-- chats/ # Atendimento (chat e histórico)
|-- notes/ # Notas associadas a clientes e atendimentos
|-- integrations/ # Configuração e integração CloudAPI e EvolutionAPI
|-- dashboard/ # Dados e endpoints para dashboard
|-- common/ # Utilitários, filtros, guards, interceptors
|-- websocket/ # Gateway websocket para eventos em tempo real
|-- main.ts # Bootstrap do app

---

## 3. Funcionalidades e Endpoints Principais

### 3.1 Autenticação e Controle de Acesso (auth)

- `POST /auth/login` — Login com retorno de JWT e refresh token
- `POST /auth/refresh` — Atualização do token JWT
- Middleware e guards para proteção de rotas e controle de roles (operador, supervisor, admin)
- Endpoint para listar empresas do usuário e selecionar empresa ativa na sessão

### 3.2 Gestão de Empresas (companies)

- `GET /companies` — Listar empresas associadas ao usuário
- `GET /companies/:id` — Detalhes da empresa
- Relacionamento de atendentes às empresas

### 3.3 Gestão de Departamentos (departments)

- CRUD completo (nome, descrição, atendentes vinculados)
- `GET /departments?companyId=...` — Listar departamentos por empresa
- Associação de atendentes a departamentos

### 3.4 Gestão de Atendentes (users)

- CRUD atendentes (nome, email, senha, status online/offline, departamentos)
- Atualização em tempo real do status online/offline
- Listagem de atendentes ativos por empresa/departamento

### 3.5 Gestão de Clientes (clients)

- CRUD clientes (dados pessoais, contatos, documentos)
- Busca avançada (nome, documento, telefone, email)
- Histórico de interações (relacionado ao chat)
- Endpoints para carregar e gerenciar anotações

### 3.6 Atendimento (chats)

- Listar atendimentos em categorias: Bot / Pendentes / Ativos
- Iniciar, encerrar e transferir atendimentos
- Envio/recebimento de mensagens via WebSocket + persistência
- Histórico pessoal do atendente

### 3.7 Notas (notes)

- CRUD de anotações vinculadas a clientes e atendimentos
- Registro do autor e timestamps

### 3.8 Integração e Configuração de Canais (integrations)

- CRUD configurações para CloudAPI e EvolutionAPI por empresa
- Gestão de status e credenciais
- Logs e histórico de chamadas

### 3.9 Dashboard (dashboard)

- Endpoints para indicadores:
  - Duração média dos atendimentos
  - Quantidade de atendimentos do dia
  - Custo acumulado CloudAPI (últimas 24h)
  - Tempo médio de espera
- Configuração e persistência de widgets e layout por usuário

---

## 4. Comunicação em Tempo Real (WebSocket)

- NestJS Gateway com `@WebSocketGateway()` usando socket.io
- Eventos emitidos:
  - Mensagens novas no chat
  - Atualização status atendentes
  - Notificações de transferência
  - Atualizações de dashboard em tempo real

---

## 5. Modelo de Dados (Esboço Prisma)

O projeto usará Prisma (PostgreSQL). Abaixo um esboço simplificado (versão inicial) que cobre relacionamentos chave e enumerações. Multiempresa é feita via `companyId` nas entidades de domínio ou tabelas de junção. Ajustes finos (índices, constraints adicionais, soft delete) virão em iterações.

```prisma
// generator client { provider = "prisma-client-js" }
// datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum UserRole { OPERATOR SUPERVISOR ADMIN }
enum ChatStatus { BOT PENDING ACTIVE CLOSED }
enum SenderType { CLIENT ATTENDANT BOT }
enum Platform { CloudAPI EvolutionAPI }
enum IntegrationStatus { ACTIVE INACTIVE }

model Company {
  id            Int                @id @default(autoincrement())
  name          String             @unique
  users         CompanyUser[]
  departments   Department[]
  clients       Client[]
  chats         Chat[]
  integrations  IntegrationConfig[]
  apiUsage      ExternalApiUsage[]
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}

model User {
  id             Int               @id @default(autoincrement())
  name           String
  email          String            @unique
  passwordHash   String
  role           UserRole          @default(OPERATOR)
  online         Boolean           @default(false)
  companies      CompanyUser[]
  departments    DepartmentUser[]
  chats          Chat[]            @relation("ChatAttendant")
  notes          Note[]
  refreshTokens  RefreshToken[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  @@index([role])
  @@index([online])
}

model CompanyUser {
  companyId Int
  userId    Int
  company   Company @relation(fields: [companyId], references: [id])
  user      User    @relation(fields: [userId], references: [id])
  primary   Boolean @default(false)
  @@id([companyId, userId])
}

model Department {
  id         Int               @id @default(autoincrement())
  name       String
  companyId  Int
  company    Company           @relation(fields: [companyId], references: [id])
  users      DepartmentUser[]
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  @@unique([companyId, name])
  @@index([companyId])
}

model DepartmentUser {
  departmentId Int
  userId       Int
  department   Department @relation(fields: [departmentId], references: [id])
  user         User       @relation(fields: [userId], references: [id])
  @@id([departmentId, userId])
}

model Client {
  id         Int       @id @default(autoincrement())
  companyId  Int
  company    Company   @relation(fields: [companyId], references: [id])
  name       String
  document   String?   @db.VarChar(40)
  phone      String?   @db.VarChar(30)
  email      String?   @db.VarChar(120)
  chats      Chat[]
  notes      Note[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  @@index([companyId])
  @@index([companyId, phone])
  @@index([companyId, email])
  @@index([companyId, document])
}

model Chat {
  id             Int          @id @default(autoincrement())
  companyId      Int
  company        Company      @relation(fields: [companyId], references: [id])
  clientId       Int
  client         Client       @relation(fields: [clientId], references: [id])
  attendantId    Int?         @map("attendant_id")
  attendant      User?        @relation("ChatAttendant", fields: [attendantId], references: [id])
  status         ChatStatus   @default(BOT)
  startedAt      DateTime     @default(now())
  endedAt        DateTime?
  firstHumanAt   DateTime?
  messages       Message[]
  notes          Note[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([companyId, status])
  @@index([attendantId])
}

model Message {
  id         Int        @id @default(autoincrement())
  chatId     Int
  chat       Chat       @relation(fields: [chatId], references: [id])
  senderType SenderType
  content    String
  mediaType  String?    // para futuros anexos
  metadata   Json?
  timestamp  DateTime   @default(now())
  @@index([chatId])
}

model Note {
  id         Int       @id @default(autoincrement())
  companyId  Int
  company    Company   @relation(fields: [companyId], references: [id])
  clientId   Int?
  client     Client?   @relation(fields: [clientId], references: [id])
  chatId     Int?
  chat       Chat?      @relation(fields: [chatId], references: [id])
  authorId   Int
  author     User       @relation(fields: [authorId], references: [id])
  content    String
  createdAt  DateTime   @default(now())
  @@index([companyId])
  @@index([authorId])
}

model IntegrationConfig {
  id          Int               @id @default(autoincrement())
  companyId   Int
  company     Company           @relation(fields: [companyId], references: [id])
  platform    Platform
  apiKey      String
  status      IntegrationStatus @default(ACTIVE)
  extraConfig Json?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  @@unique([companyId, platform])
  @@index([companyId])
}

model RefreshToken {
  id         Int       @id @default(autoincrement())
  userId     Int
  user       User      @relation(fields: [userId], references: [id])
  tokenHash  String    // armazenar hash, não o token puro
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?
  replacedBy Int?
  @@index([userId])
  @@index([expiresAt])
}

model ExternalApiUsage {
  id         Int       @id @default(autoincrement())
  companyId  Int
  company    Company   @relation(fields: [companyId], references: [id])
  platform   Platform
  cost       Decimal   @db.Decimal(10,2)
  meta       Json?
  occurredAt DateTime  @default(now())
  @@index([companyId, platform])
  @@index([occurredAt])
}
```

Notas:

- Campos de auditoria adicionais (ex: updatedBy) podem ser incluídos depois.
- Soft delete, se necessário, pode ser via campo `deletedAt` + filtros no repositório.
- Para alta escala de mensagens, considerar particionamento futuro ou fila intermediária.

---

## 6. Segurança e Boas Práticas

- Utilizar JWT com expiração para autenticação.
- Implementar Passport.js com guards baseados em roles para controle de acesso.
- Aplicar rate limiting para evitar abusos nas chamadas à API.
- Validar e sanitizar os dados de entrada usando DTOs e Pipes do NestJS.
- Controlar acesso a dados com base na empresa selecionada e perfil do usuário.
- Registrar logs de auditoria para ações críticas e alterações importantes.
- Desenvolver testes unitários e testes end-to-end para garantir qualidade.

---

## 7. Diretrizes de Banco de Dados e Constraints

### 7.1 Estratégia de Campos Nuláveis

**Princípio**: Todo campo deve ser nulável por padrão, exceto quando há uma regra de negócio específica que exige obrigatoriedade.

**Benefícios**:

- Evita problemas de inserção quando dados não estão disponíveis
- Permite flexibilidade na criação de registros
- Facilita migrações e evolução do schema
- Reduz erros de constraint violation

**Exemplo de implementação**:

```prisma
model Pessoa {
  id           Int      @id @default(autoincrement())
  name         String   // Campo obrigatório por regra de negócio
  email        String?  // Campo opcional
  phone        String?  // Campo opcional
  documento    String?  // Campo opcional
  // ... outros campos
}
```

### 7.2 Estratégia de Constraints

**Constraints Permitidas**:

- ✅ **Primary Key (PK)**: Para identificação única de registros
- ✅ **Foreign Key (FK)**: Para integridade referencial entre tabelas
- ✅ **Índices**: Para performance de consultas

**Constraints NÃO Permitidas**:

- ❌ **Unique Constraints**: Para validação de dados (ex: email único, username único)
- ❌ **Check Constraints**: Para validação de regras de negócio
- ❌ **Default Constraints**: Para valores padrão de aplicação

**Justificativa**:

- Validações devem ser feitas via código (DTOs, Services, Guards)
- Código é mais flexível e permite regras de negócio complexas
- Facilita testes e manutenção
- Evita problemas de migração e evolução do schema

### 7.3 Implementação de Validações

**Nível de DTO**:

```typescript
export class CreatePessoaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

**Nível de Service**:

```typescript
async create(dto: CreatePessoaDto) {
  // Validação de email único (se necessário)
  if (dto.email) {
    const existing = await this.prisma.pessoa.findFirst({
      where: { email: dto.email }
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }
  }

  // Validação de username único (apenas para usuários)
  if (dto.type === 'USUARIO' && dto.user) {
    const existing = await this.prisma.pessoa.findFirst({
      where: { user: dto.user }
    });
    if (existing) {
      throw new ConflictException('Username já cadastrado');
    }
  }

  // Criação do registro
  return this.prisma.pessoa.create({ data: dto });
}
```

### 7.4 Exemplo de Schema Sem Constraints de Validação

```prisma
model Pessoa {
  empCod       Int      @map("EmpCod")
  id           Int      @map("PesCod")
  name         String   @map("PesNom")
  email        String?  @map("PesEml") @db.VarChar(120)
  user         String?  @map("PesUsr") @db.VarChar(30)
  phone        String?  @map("PesFon") @db.VarChar(30)
  documento    String?  @map("PesDoc") @db.VarChar(40)
  type         String   @map("PesTip") @db.VarChar(20)
  passwordHash String?  @map("PesSenha")
  role         String   @default("OPERATOR") @db.VarChar(20)
  active       Boolean  @default(true) @map("PesIsAtv")
  online       Boolean  @default(false) @map("PesIsOnline")
  
  // Relacionamentos
  company      Empresa  @relation(fields: [empCod], references: [id])
  departments  DepartamentoPessoa[]
  
  // Chave primária composta (empCod + id)
  @@id([empCod, id])
  
  // Índices para performance
  @@index([type])
  @@index([online])
  @@index([email])
  @@index([user])
  @@index([empCod])
}
```

### 7.5 Arquitetura Multiempresa com EmpCod

**Princípio Fundamental**: Todas as tabelas do sistema incluem `empCod` como parte da chave primária, garantindo isolamento total de dados entre empresas.

**Estrutura das Chaves Primárias**:
- **`@@id([empCod, id])`** - Chave primária composta em todas as tabelas
- **`empCod`** - Sempre o primeiro campo da chave primária
- **`id`** - Identificador único dentro da empresa

**Benefícios da Arquitetura**:
- ✅ **Isolamento Total**: Dados de empresas nunca se misturam
- ✅ **Segurança**: Usuário só acessa dados da empresa ativa
- ✅ **Performance**: Índices otimizados por empresa
- ✅ **Escalabilidade**: Sistema suporta múltiplas empresas
- ✅ **Manutenibilidade**: Estrutura consistente em todas as tabelas

**Exemplo de Uso**:
```typescript
// Usuário logado na empresa ID = 1
const empCod = 1;

// Criar pessoa na empresa 1
await prisma.pessoa.create({
  data: {
    empCod: empCod,        // ← Sempre a empresa ativa
    name: "João Silva",
    type: "CLIENTE"
  }
});

// Buscar pessoas da empresa 1
const pessoas = await prisma.pessoa.findMany({
  where: { empCod: empCod } // ← Sempre a empresa ativa
});
```

**Tabelas com Arquitetura Multiempresa**:
- `Pessoa` - `@@id([empCod, id])`
- `Departamento` - `@@id([empCod, id])`
- `Atendimento` - `@@id([empCod, id])`
- `Mensagem` - `@@id([empCod, id])`
- `Note` - `@@id([empCod, id])`
- `IntegrationConfig` - `@@id([empCod, id])`
- `RefreshToken` - `@@id([empCod, id])`
- `ExternalApiUsage` - `@@id([empCod, id])`
- `FileUpload` - `@@id([empCod, id])`
- `EmpresaUser` - `@@id([empCod, userId])`
- `DepartamentoPessoa` - `@@id([empCod, depCod, userId])`

---

## 8. Exemplos de Endpoints REST

| Método | Rota                       | Descrição                   |
| ------ | -------------------------- | --------------------------- |
| POST   | /auth/login                | Autenticar e obter token    |
| POST   | /auth/refresh              | Atualizar token JWT         |
| GET    | /companies                 | Listar empresas do usuário  |
| GET    | /companies/:id             | Detalhes da empresa         |
| GET    | /departments?companyId=... | Listar departamentos        |
| POST   | /departments               | Criar departamento          |
| PUT    | /departments/:id           | Atualizar departamento      |
| GET    | /users                     | Listar atendentes           |
| POST   | /users                     | Criar atendente             |
| PUT    | /users/:id                 | Atualizar atendente         |
| GET    | /clients                   | Buscar clientes             |
| POST   | /clients                   | Criar cliente               |
| GET    | /chats?category=active     | Listar chats ativos         |
| POST   | /chats/:id/start           | Iniciar atendimento         |
| POST   | /chats/:id/end             | Encerrar atendimento        |
| POST   | /chats/:id/transfer        | Transferir atendimento      |
| POST   | /notes                     | Criar anotação              |
| GET    | /dashboard/metrics         | Dados para indicadores      |
| GET    | /integrations/config       | Listar configurações canais |
| POST   | /integrations/config       | Criar/editar configuração   |

---

**Quer que eu gere um exemplo de código NestJS para algum módulo específico?**  
Posso ajudar a montar autenticação, chat, integração ou qualquer outra parte!
