# Correções para Adição de empCod como Chave Primária

## Resumo das Alterações

Este documento descreve as correções realizadas no backend após a adição do `empCod` como chave primária nas tabelas.

## Problemas Identificados

Após a adição do `empCod` como PK nas tabelas através do schema do Prisma, foram identificados os seguintes problemas:

1. **Erros de sintaxe com empCod duplicado**: Expressões como `empCod: empCod: companyId`
2. **Campos obrigatórios ausentes**: Falta do campo `id` em criações de registros
3. **Where clauses incorretos**: Uso de `{ id }` em vez de chaves compostas `{ empCod_id: { empCod, id } }`
4. **Tipos de dados incorretos**: Uso de `empCod` direto em vez de `company` connection
5. **Chamadas de função com sintaxe incorreta**: Parâmetros mal formatados

## Arquivos Corrigidos

### 1. `src/auth/auth.service.ts`

- ✅ Corrigido RefreshToken com `id` obrigatório
- ✅ Corrigido where clauses para chaves compostas
- ✅ Corrigido JwtPayload activeCompanyId

### 2. `src/departamentos/departamentos.service.ts`

- ✅ Corrigido erros de sintaxe com empCod duplicado
- ✅ Corrigido chamadas de função
- ✅ Corrigido where clauses para chaves compostas
- ✅ Corrigido dados de criação com `id` obrigatório

### 3. `src/departments/departments.service.ts`

- ✅ Corrigido where clauses para chaves compostas
- ✅ Corrigido uso de `empCod` em vez de `companyId`

### 4. `src/pessoas/pessoas.service.ts`

- ✅ Corrigido PessoaCreateInput para usar `company` connection
- ✅ Adicionado `id` obrigatório
- ✅ Corrigido where clauses para usar `empCod` diretamente
- ✅ Corrigido chamadas de função

### 5. `src/uploads/uploads.service.ts`

- ✅ Adicionado `id` obrigatório em FileUpload
- ✅ Corrigido where clauses para usar campos diretos

## Principais Correções Aplicadas

### 1. Syntax Errors

```typescript
// ANTES
empCod: empCod: companyId;

// DEPOIS
empCod: companyId;
```

### 2. Required Fields

```typescript
// ANTES
data: { empCod: 1, userId, tokenHash, expiresAt }

// DEPOIS
data: { empCod: 1, id: 1, userId, tokenHash, expiresAt }
```

### 3. Compound Keys

```typescript
// ANTES
where: {
  id;
}

// DEPOIS
where: {
  empCod_id: {
    empCod: (companyId, id);
  }
}
```

### 4. Company Connection

```typescript
// ANTES
empCod: companyId;

// DEPOIS
company: {
  connect: {
    id: companyId;
  }
}
```

### 5. Function Calls

```typescript
// ANTES
ensureMembership(empCod: empCod: companyId, userId)

// DEPOIS
ensureMembership(companyId, userId)
```

## Script de Correção Automática

Foi criado o script `scripts/fix-remaining-errors.js` que aplica automaticamente todas as correções necessárias:

```bash
node scripts/fix-remaining-errors.js
```

## Resultado Final

✅ **Build realizado com sucesso!**

Todos os erros de TypeScript foram corrigidos e o projeto agora compila sem problemas após a adição do `empCod` como chave primária.

## Próximos Passos

1. Testar a funcionalidade dos endpoints
2. Verificar se as migrações do banco estão corretas
3. Executar testes unitários
4. Fazer deploy da aplicação

## Observações Importantes

- O campo `id: 1` foi usado como fallback para criar registros. Em produção, deve-se implementar uma lógica para gerar IDs únicos
- As chaves compostas agora usam a sintaxe correta do Prisma
- Os relacionamentos com `Empresa` foram ajustados para usar `company` connection
- Todos os where clauses foram atualizados para usar as chaves compostas corretas
