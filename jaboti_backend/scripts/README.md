# Scripts de Utilitários do Jaboti Backend

Este diretório contém scripts úteis para gerenciamento e manutenção do backend do Jaboti.

## Scripts Disponíveis

### 🔧 Correção de Erros

- **`fix-remaining-errors.js`** - Script para corrigir automaticamente erros relacionados à adição do `empCod` como chave primária

### 👤 Administração de Usuários

- **`create-admin-user.js`** - Criar usuário administrador padrão
- **`create-custom-admin.js`** - Criar usuário administrador personalizado

### 🗄️ Banco de Dados

- **`create-sqlserver-db.sql`** - Script SQL para criar banco de dados SQL Server
- **`list-tables.sql`** - Consulta para listar todas as tabelas do banco

### 📁 Estrutura de Diretórios

- **`create-upload-dirs.js`** - Criar diretórios de upload necessários
- **`create-chat-upload-dirs.js`** - Criar diretórios específicos para upload de chat

### 🖥️ Scripts de Sistema

- **`create-admin.bat`** - Script batch para Windows (criar admin)
- **`create-admin.sh`** - Script shell para Linux/Mac (criar admin)

## Como Usar

### Correção Automática de Erros

```bash
# Corrigir erros relacionados ao empCod como PK
node scripts/fix-remaining-errors.js
```

### Criar Usuário Administrador

```bash
# Usar script Node.js
node scripts/create-admin-user.js

# Usar script do sistema operacional
# Windows:
scripts/create-admin.bat

# Linux/Mac:
./scripts/create-admin.sh
```

### Criar Diretórios de Upload

```bash
# Criar todos os diretórios de upload
node scripts/create-upload-dirs.js

# Criar diretórios específicos para chat
node scripts/create-chat-upload-dirs.js
```

### Banco de Dados

```bash
# Executar no SQL Server Management Studio ou cliente SQL
# Criar banco de dados
scripts/create-sqlserver-db.sql

# Listar tabelas
scripts/list-tables.sql
```

## Notas Importantes

- Todos os scripts Node.js devem ser executados no diretório raiz do projeto
- Scripts de banco de dados devem ser executados com privilégios de administrador
- Scripts de sistema podem precisar de permissões de execução (`chmod +x` no Linux/Mac)
- Sempre faça backup antes de executar scripts que modificam dados

## Manutenção

- Scripts temporários são removidos após uso
- Apenas scripts essenciais são mantidos neste diretório
- Documentação é atualizada conforme scripts são modificados
