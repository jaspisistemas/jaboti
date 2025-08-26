# Contratos de Integração Frontend x API (Jaboti)

Este documento descreve o mapeamento de entidades e as regras para manter compatibilidade entre o frontend e a API.

## Princípios
- Fonte da verdade: Swagger (swagger.json) e Postman Collection (jaboti_backend.postman_collection.json).
- Somente variáveis VITE_ no .env são usadas no frontend.
- Evitar acoplamento: tipar modelos com campos opcionais e tolerância a mudanças.
- Preferir thunks assíncronos com tratamento de erro e feedback visual (Snackbar).

## Autenticação
- Login: POST /auth/login { email, password } → retorna { accessToken, refreshToken, companies? }.
- Refresh: POST /auth/refresh { refreshToken } → { accessToken, refreshToken? }.
- Seleção de empresa: POST /auth/select-company { companyId } → novo accessToken válido para empresa ativa.
- Frontend injeta Authorization: Bearer <accessToken> via interceptor.

## Empresas
- Listagem: GET /companies → [{ id:number, name?:string }].
- Seleção: usar id retornado (companyId) em /auth/select-company.
- UI: SelectCompanyPage carrega lista e envia seleção, só então navega.

## Departamentos
- Endpoints:
  - GET /departments
  - POST /departments { name, description? }
  - PATCH /departments/{id} { name?, description? }
  - DELETE /departments/{id}
- Frontend: departmentsSlice com thunks (fetch/create/update/delete). Snackbar em sucesso/erro.

## Pessoas (Atendentes)
- Atendente = Pessoa com type = USUARIO.
- Swagger: CreatePessoaDto/UpdatePessoaDto contem: name (obrig.), email?, phone?, chatName?, type('CLIENTE'|'USUARIO').
- Endpoints:
  - GET /pessoas?tipo=USUARIO (listagem de atendentes)
  - POST /pessoas { name, email?, phone?, chatName?, type:'USUARIO' }
  - PATCH /pessoas/{id} { name?, email?, phone?, chatName? }
  - DELETE /pessoas/{id}
- Frontend: pessoasSlice (fetch/create/update/delete). Campos extras (username, status, departments, photo) são mantidos localmente via setAttendantExtras até suporte na API.

### Mapeamentos UI ↔ API
- UI.name ↔ API.name
- UI.displayName ↔ API.chatName
- UI.email ↔ API.email
- UI.username (extra, local)
- UI.status (extra, local: 'online'|'offline')
- UI.departments (extra, local; aguarda endpoint de vínculo)
- UI.photo (extra, local; aguarda upload/media API)

## Erros e Compatibilidade
- Todos os thunks retornam rejectWithValue com message legível.
- Snackbar global exibe sucesso/erro.
- Tolerância a campos ausentes: modelos no frontend usam opcionais e não quebram ao receber mais/menos campos.
- IDs tratados como number|string; no Select manter string, ao enviar para API converter para number quando apropriado.

## Procedimento ao mudar a API
1. Atualize swagger.json e/ou Postman Collection no repositório.
2. Ajuste tipos dos modelos afetados.
3. Revise thunks dos slices correspondentes.
4. Atualize telas que consomem os dados (labels, validação).
5. Teste: DevTools → Network, validar payload/response.
6. Se contrato mudou significativamente, registre a mudança aqui.

## TODOs de Integração
- [ ] Endpoints para vincular atendente a departamentos.
- [ ] Upload de foto do atendente e storage.
- [ ] Campos de autenticação para atendente (username/password) se fizerem parte de outro domínio (ex: auth/usuarios).
- [ ] Paginação e busca (q) em pessoas e departamentos.
- [ ] RBAC/roles por empresa.
