# Migração para SQL Server - JABOTI JS

## Resumo da Migração

**Data:** 28/08/2025  
**De:** PostgreSQL  
**Para:** SQL Server  
**Status:** ✅ Concluída com sucesso

## Configurações do Banco

- **Servidor:** WIN-ITALO\SQLEXPRESS
- **Porta:** 1433
- **Banco:** JABOTI_JS
- **Usuário:** admjaspi
- **Senha:** @jaspi123
- **Provider:** sqlserver

## Principais Alterações Realizadas

### 1. Schema do Prisma

- ✅ Alterado provider de `postgresql` para `sqlserver`
- ✅ Removidos todos os enums (não suportados pelo SQL Server)
- ✅ Substituídos tipos `Json` por `String` com `@db.NText`
- ✅ Substituídos arrays `String[]` por `String` com comentários explicativos
- ✅ Ajustadas ações de referência para evitar referências circulares

### 2. Tipos de Dados Mapeados

| PostgreSQL        | SQL Server                  | Observação                   |
| ----------------- | --------------------------- | ---------------------------- |
| `Json`            | `String @db.NText`          | JSON armazenado como texto   |
| `String[]`        | `String @db.VarChar(500)`   | Arrays separados por vírgula |
| `enum`            | `String @db.VarChar(20)`    | Valores como strings         |
| `autoincrement()` | `@default(autoincrement())` | Mantido compatível           |

### 3. Tabelas Criadas

✅ **Company** - Empresas  
✅ **Pessoa** - Usuários e Clientes  
✅ **CompanyUser** - Relacionamento Empresa-Usuário  
✅ **Department** - Departamentos  
✅ **DepartmentUser** - Relacionamento Departamento-Usuário  
✅ **Atendimento** - Atendimentos/Chats  
✅ **Message** - Mensagens  
✅ **Note** - Anotações  
✅ **IntegrationConfig** - Configurações de Integração  
✅ **ExternalApiUsage** - Uso de APIs Externas  
✅ **FileUpload** - Uploads de Arquivos  
✅ **RefreshToken** - Tokens de Renovação

## Arquivos de Configuração

### .env

```bash
DATABASE_URL="sqlserver://WIN-ITALO:1433;database=JABOTI_JS;user=admjaspi;password=@jaspi123;trustServerCertificate=true;encrypt=false"
```

### Scripts SQL

- `scripts/create-sqlserver-db.sql` - Criação do banco
- `scripts/list-tables.sql` - Listagem de tabelas
- `scripts/test-sqlserver-connection.js` - Teste de conexão

## Testes Realizados

✅ **Conexão:** Estabelecida com sucesso  
✅ **Migração:** Schema criado sem erros  
✅ **Inserção:** Teste de criação de empresa  
✅ **Consulta:** Teste de leitura de dados  
✅ **Limpeza:** Remoção de dados de teste

## Comandos Importantes

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Introspectar banco
npx prisma db pull

# Abrir Prisma Studio
npx prisma studio
```

## Próximos Passos

1. **Testar aplicação:** Verificar se todas as funcionalidades funcionam
2. **Ajustar código:** Adaptar queries que usavam tipos específicos do PostgreSQL
3. **Otimizar:** Ajustar índices e consultas para SQL Server
4. **Monitorar:** Acompanhar performance e logs

## Observações Importantes

- **JSON:** Dados JSON são armazenados como texto, necessitando parse/stringify
- **Arrays:** Campos de array são strings separadas por vírgula
- **Enums:** Valores são strings, validar no código da aplicação
- **Performance:** SQL Server pode ter comportamento diferente em consultas complexas

## Suporte

Para dúvidas ou problemas com a migração, consulte:

- [Documentação Prisma SQL Server](https://www.prisma.io/docs/concepts/database-connectors/sql-server)
- [Guia de Migração Prisma](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)
