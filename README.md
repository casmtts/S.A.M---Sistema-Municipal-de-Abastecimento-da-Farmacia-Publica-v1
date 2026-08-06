# S.A.M. — Sistema Municipal de Abastecimento

Aplicação web de gestão de medicamentos para redes públicas de saúde. O frontend React usa o layout do showcase e consome a API NestJS, que persiste as operações no PostgreSQL via Prisma.

## Funcionalidades

- Dashboard com indicadores, gráficos, alertas e pedidos recentes.
- Gestão de estoque, medicamentos, fornecedores e unidades de saúde.
- Fluxo de pedidos com aprovação, entrega e movimentações persistidas.
- Relatórios exportados em PDF e Excel pelo backend.
- Login JWT e controle de acesso por função.
- Cadastro público de usuários com aprovação do administrador geral.

## Arquitetura local

| Serviço | Execução | Endereço |
| --- | --- | --- |
| PostgreSQL | Docker Compose | rede interna `db:5432` |
| Backend NestJS | Docker Compose | `http://localhost:3001` |
| Frontend React/Vite | processo local | `http://localhost:3000` |

O PostgreSQL do Compose usa o volume `sam-postgres-data` e não publica a porta 5432 no host. Assim, ele não conflita com uma instalação local do PostgreSQL.

## Pré-requisitos

- Docker Desktop ou Docker Engine com Docker Compose v2.
- Node.js 20+ e npm, para executar o frontend localmente.

## Executar com Docker

Antes de subir o Compose, pare qualquer backend local que esteja usando a porta 3001.

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

O backend aplica as migrations do Prisma automaticamente antes de iniciar. Para parar os containers mantendo os dados:

```bash
docker compose down
```

Para remover também o banco persistido, use somente quando quiser perder os dados locais:

```bash
docker compose down -v
```

### Variáveis do Compose

Os valores abaixo possuem defaults para desenvolvimento. Para customizar, crie um arquivo `.env` na raiz:

```env
POSTGRES_DB=farmacia_municipal
POSTGRES_USER=sam
POSTGRES_PASSWORD=troque-esta-senha
JWT_SECRET=troque-esta-chave
JWT_EXPIRES_IN=1d
NODE_ENV=production
```

Não versione o arquivo `.env`. Em ambientes compartilhados ou de produção, use secrets do ambiente de execução.

## Criar o primeiro administrador

O cadastro público cria usuários inativos com o papel `ATENDENTE`. Para criar o primeiro administrador no ambiente Docker:

1. Cadastre um usuário pela tela de login ou pela API:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Administrador Geral","email":"admin@sam.local","cpf":"00000000000","senha":"troque-esta-senha"}'
```

2. Promova o cadastro diretamente no banco:

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE usuarios SET role = '\''ADMIN'\'', ativo = true WHERE email = '\''admin@sam.local'\'';"'
```

Depois disso, entre no frontend com o e-mail e a senha cadastrados. O administrador verá novos cadastros pendentes na página **Usuários** e poderá aprová-los pelo botão de confirmação.

## Executar sem Docker

### Backend e banco local

```bash
cp backend/.env.example backend/.env
# ajuste DATABASE_URL e JWT_SECRET
cd backend
npm install
npx prisma migrate deploy
npm run start:dev
```

### Frontend

Em outro terminal:

```bash
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:3001
cd frontend
npm install
npm run dev
```

O frontend usa `VITE_API_URL` para localizar a API. Por padrão, ele aponta para `http://localhost:3001`.

## Endpoints principais

- `POST /auth/login` — autenticação JWT.
- `POST /auth/register` — solicitação pública de cadastro.
- `GET /medicamentos` e `PATCH /medicamentos/:id/estoque` — estoque e movimentações.
- `GET /pedidos`, `PATCH /pedidos/:id/aprovar` e `PATCH /pedidos/:id/entregar` — pedidos.
- `GET/PATCH/POST/DELETE /fornecedores` — fornecedores.
- `GET/PATCH/POST/DELETE /unidades-saude` — unidades de saúde.
- `GET /usuarios` e `PATCH /usuarios/:id/toggle` — gestão e aprovação de usuários, restrita ao `ADMIN`.
- `POST /relatorios/exportar` — exportação de relatórios.

## Tecnologias

- React + TypeScript + Vite
- Material UI e Recharts
- NestJS + Prisma
- PostgreSQL
- Docker Compose
