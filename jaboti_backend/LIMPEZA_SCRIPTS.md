# Limpeza de Scripts - Jaboti Backend

## Resumo da Limpeza

Este documento descreve a limpeza realizada no diretório `scripts/` para remover scripts desnecessários e manter apenas os essenciais.

## Scripts Removidos

Foram removidos os seguintes scripts que não são mais necessários:

### Scripts de Teste e Debug

- `test-service-create.js`
- `test-multiple-pessoas.js`
- `test-simple-create.js`
- `test-create-pessoa.js`
- `test-sqlserver-connection.js`

### Scripts de Verificação de Constraints

- `check-pessoa-data.js`
- `check-user-column-constraints.js`
- `check-table-level-constraints.js`
- `check-table-level-constraints-2.js`
- `check-all-constraints.js`
- `check-all-possible-constraints.js`
- `check-hidden-constraints.js`
- `check-constraints.js`
- `check-table-constraints.js`
- `deep-constraint-check.js`

### Scripts Temporários

- `fix-multiempresa.js`

## Scripts Mantidos

### Scripts Essenciais

- **`fix-remaining-errors.js`** - Script para correção automática de erros relacionados ao empCod como PK
- **`create-admin-user.js`** - Script para criar usuário administrador padrão
- **`create-custom-admin.js`** - Script para criar usuário administrador personalizado
- **`create-upload-dirs.js`** - Script para criar diretórios de upload
- **`create-chat-upload-dirs.js`** - Script para criar diretórios específicos de chat

### Scripts de Sistema

- **`create-admin.bat`** - Script batch para Windows
- **`create-admin.sh`** - Script shell para Linux/Mac

### Scripts SQL

- **`create-sqlserver-db.sql`** - Script para criar banco de dados
- **`list-tables.sql`** - Script para listar tabelas

### Documentação

- **`README.md`** - Documentação atualizada dos scripts

## Benefícios da Limpeza

1. **Organização**: Diretório mais limpo e organizado
2. **Manutenção**: Menos arquivos para manter e atualizar
3. **Clareza**: Foco apenas nos scripts essenciais
4. **Performance**: Menos arquivos para indexar e processar
5. **Documentação**: README atualizado com informações relevantes

## Resultado Final

- **Scripts removidos**: 14
- **Scripts mantidos**: 10
- **Redução**: ~58% dos scripts foram removidos

## Próximos Passos

1. Mantenha apenas scripts essenciais e bem documentados
2. Remova scripts temporários após uso
3. Atualize documentação conforme necessário
4. Considere criar um script de limpeza automática para scripts temporários

## Observações

- Todos os scripts removidos eram temporários ou de debug
- Nenhuma funcionalidade essencial foi perdida
- A documentação foi atualizada para refletir apenas os scripts mantidos
- O projeto mantém todas as funcionalidades necessárias
