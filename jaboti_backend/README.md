# Jaboti Backend

Backend multiempresa de atendimento (NestJS + Prisma + PostgreSQL + WebSockets) integrando CloudAPI e EvolutionAPI.

## Stack
- NestJS 10
- Prisma / PostgreSQL
- JWT + Refresh Tokens
- Redis (futuro: cache, pub/sub)
- Socket.io WebSocket Gateway
- Swagger Docs (/docs)

## Setup Inicial
1. Configurar variável `DATABASE_URL` no `.env`.
2. Instalar dependências.
3. Gerar cliente Prisma e aplicar migrations.
4. Rodar servidor em modo desenvolvimento.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run prisma:migrate`
- `npm run test`

## Próximos Passos
- Implementar módulo `prisma` (PrismaService + middleware de logging)
- Implementar `auth` (JWT + Refresh + seleção empresa)
- Implementar guard multiempresa
- Definir eventos WebSocket e gateway

## Licença
MIT
