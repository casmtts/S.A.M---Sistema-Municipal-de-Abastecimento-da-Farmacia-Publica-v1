# S.A.M. — Sistema Municipal de Abastecimento

Uma aplicação web de gestão de medicamentos para redes públicas de saúde. A interface usa o layout do showcase e consome o backend NestJS, persistindo as operações no PostgreSQL via Prisma.

## O que a aplicação inclui

- Dashboard com indicadores, gráfico de consumo, alertas e pedidos recentes.
- Gestão de estoque com busca, cadastro, edição, exclusão e movimentação de itens.
- Gestão do fluxo de pedidos, fornecedores, unidades de saúde e usuários.
- Relatórios com filtros e exportação em PDF/Excel gerada pelo backend.
- Login JWT e controle de acesso por função.

## Executar localmente

```bash
cp backend/.env.example backend/.env
# ajuste DATABASE_URL e JWT_SECRET no arquivo criado
cd backend && npm install && npx prisma migrate deploy && npm run start:dev

# em outro terminal
cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run dev
```

O frontend usa `VITE_API_URL` para localizar a API (por padrão `http://localhost:3001`). O primeiro usuário precisa ser criado pela rota pública `POST /auth/register`.

## Tecnologias

- React + TypeScript + Vite
- Material UI
- Recharts
- NestJS + Prisma + PostgreSQL
