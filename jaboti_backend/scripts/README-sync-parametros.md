# Scripts de Sincronização de Parâmetros

Este diretório contém scripts para sincronizar a tabela `Parametro` com os últimos códigos realmente utilizados em cada tabela correspondente.

## Problema

Quando o sistema de códigos sequenciais é implementado em um banco que já possui dados, é necessário sincronizar a tabela `Parametro` com o estado atual das outras tabelas para evitar conflitos de ID.

## Scripts Disponíveis

### 1. Script Node.js (`sync-parametros-codigos.js`)

**Vantagens:**
- Mais flexível e fácil de manter
- Usa o Prisma Client (mesmo da aplicação)
- Tratamento de erros robusto
- Logs detalhados

**Como executar:**
```bash
cd jaboti_backend
node scripts/sync-parametros-codigos.js
```

### 2. Script SQL (`sync-parametros-codigos.sql`)

**Vantagens:**
- Execução direta no banco
- Não depende do Node.js
- Mais rápido para grandes volumes

**Como executar:**
```bash
# Via sqlcmd
sqlcmd -S WIN-ITALO -d JABOTI_JS -U admjaspi -P "@jaspi123" -i scripts/sync-parametros-codigos.sql

# Via SQL Server Management Studio
# Abrir o arquivo e executar
```

## O que os Scripts Fazem

### Para cada empresa no sistema:

1. **PESSOA**: Busca o maior `PesCod` e atualiza `ParUltCod`
2. **EMPRESA**: Define `ParUltCod` como o próprio ID da empresa
3. **DEPARTAMENTO**: Busca o maior `DepCod` e atualiza `ParUltCod`

### Ações realizadas:

- **Se o registro existe**: Atualiza o `ParUltCod`
- **Se o registro não existe**: Cria um novo registro com o código correto
- **Sequenciais**: Gerencia automaticamente o campo `ParSeq`

## Exemplo de Saída

```
🔄 Iniciando sincronização dos parâmetros...
📊 Encontradas 1 empresas

🏢 Processando empresa: Jaboti Sistemas (ID: 1)
  👤 PESSOA: Atualizado para código 1
  🏢 EMPRESA: Atualizado para código 1
  🏛️ DEPARTAMENTO: Criado com código 0

✅ Sincronização concluída com sucesso!

📋 Status atual dos parâmetros:
================================================================================
Empresa: Jaboti Sistemas (1)
  Tipo: PESSOA
  Último Código: 1
  Sequencial: 1
  Nome: Controle de códigos sequenciais para Pessoas
----------------------------------------
Empresa: Jaboti Sistemas (1)
  Tipo: EMPRESA
  Último Código: 1
  Sequencial: 2
  Nome: Controle de códigos sequenciais para Empresas
----------------------------------------
Empresa: Jaboti Sistemas (1)
  Tipo: DEPARTAMENTO
  Último Código: 0
  Sequencial: 3
  Nome: Controle de códigos sequenciais para Departamentos
----------------------------------------
```

## Quando Executar

### ✅ **Execute quando:**
- Implementar o sistema de códigos sequenciais pela primeira vez
- Migrar de um sistema legado
- Corrigir inconsistências na tabela `Parametro`
- Adicionar novas empresas ao sistema

### ❌ **NÃO execute quando:**
- O sistema já está funcionando normalmente
- Durante operações de produção críticas
- Sem backup do banco de dados

## Verificação Pós-Execução

Após executar o script, verifique se:

1. **A tabela `Parametro` foi populada corretamente**
2. **Os valores de `ParUltCod` refletem os últimos códigos usados**
3. **Não há conflitos de ID ao criar novas entidades**

## Troubleshooting

### Erro: "Unique constraint failed"
- Execute o script de sincronização primeiro
- Verifique se há dados duplicados na tabela `Parametro`

### Erro: "Foreign key constraint failed"
- Verifique se todas as empresas referenciadas existem
- Execute o script em ordem: primeiro empresas, depois outras entidades

### Script não executa
- Verifique as credenciais do banco
- Confirme se o Prisma Client está atualizado (`npx prisma generate`)
- Verifique se todas as tabelas existem

## Backup Recomendado

**SEMPRE faça backup antes de executar:**
```sql
-- Backup da tabela Parametro
SELECT * INTO Parametro_Backup_YYYYMMDD_HHMMSS 
FROM Parametro;
```

## Próximos Passos

Após a sincronização:

1. **Teste a criação de uma nova pessoa** - deve funcionar sem conflitos
2. **Verifique os logs** - confirme que os IDs estão sendo gerados corretamente
3. **Monitore** - observe se o sistema está funcionando como esperado

## Suporte

Se encontrar problemas:
1. Verifique os logs de erro
2. Confirme se todas as dependências estão instaladas
3. Execute o script em um ambiente de teste primeiro
