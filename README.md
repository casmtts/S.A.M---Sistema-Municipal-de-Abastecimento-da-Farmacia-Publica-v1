# S.A.M. — Sistema Municipal de Abastecimento

Aplicação web de gestão de medicamentos para redes públicas de saúde. O frontend React usa o layout do showcase e consome a API NestJS, que persiste as operações no PostgreSQL via Prisma.

## Funcionalidades

- Dashboard com indicadores, gráficos, alertas e pedidos recentes.
- Gestão de estoque, medicamentos, fornecedores e unidades de saúde.
- Fluxo de pedidos com aprovação, entrega e movimentações persistidas.
- Relatórios exportados em PDF e Excel pelo backend.
- Login JWT e controle de acesso por função.
- Permissões granulares por módulo e ação, com exceções individuais.
- Histórico permanente de auditoria com exportação em PDF e CSV.
- Cadastro público de usuários com aprovação do administrador geral.

## Arquitetura local

| Serviço | Execução | Endereço |
| --- | --- | --- |
| PostgreSQL | Docker Compose | `localhost:5433` no host e `db:5432` na rede interna |
| Backend NestJS | Docker Compose | `http://localhost:3001` |
| Frontend React/Vite | processo local | `http://localhost:3000` |

O PostgreSQL do Compose usa o volume `sam-postgres-data`. A porta externa padrão é `5433`, mantendo a porta interna `5432` e evitando conflito com uma instalação local do PostgreSQL. Para alterar a porta externa, defina `POSTGRES_HOST_PORT` no `.env`.

### Conectar pelo DBeaver

Com os containers em execução (`docker compose up -d`), crie uma conexão PostgreSQL no DBeaver com:

- Host: `localhost`
- Porta: `5433`
- Banco: valor de `POSTGRES_DB` (padrão: `farmacia_municipal`)
- Usuário: valor de `POSTGRES_USER` (padrão: `sam`)
- Senha: valor de `POSTGRES_PASSWORD` (padrão: `sam_docker_password`)

Se a porta `5433` já estiver ocupada, defina `POSTGRES_HOST_PORT=55432` no `.env`, recrie os serviços e use essa porta no DBeaver.

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
JWT_SECRET=gere-uma-chave-aleatoria-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=15m
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NODE_ENV=development
```

Não versione o arquivo `.env`. Em ambientes compartilhados ou de produção, use secrets do ambiente de execução.

Para produção, use `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`, informe todos os secrets obrigatórios e não publique a porta do PostgreSQL. A API rejeita origens CORS que não estejam listadas em `CORS_ORIGINS`.

## Criar o primeiro administrador

O cadastro público cria usuários inativos com o papel `ATENDENTE`. Para criar o primeiro administrador no ambiente Docker:

1. Cadastre um usuário pela tela de login ou pela API:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Administrador Geral","email":"admin@sam.local","cpf":"52998224725","senha":"troque-esta-senha"}'
```

2. Promova o cadastro diretamente no banco:

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE usuarios SET role = '\''ADMIN'\'', ativo = true WHERE email = '\''admin@sam.local'\'';"'
```

Depois disso, entre no frontend com o e-mail e a senha cadastrados. O administrador verá novos cadastros pendentes na página **Usuários** e poderá aprová-los pelo botão de confirmação.

O primeiro usuário promovido para `ADMIN` será convertido automaticamente em `SUPER_ADMIN` na inicialização do backend. O `SUPER_ADMIN` possui acesso total e não pode ser editado, desativado ou removido.

Na página **Usuários**, as abas **Permissões** e **Histórico** permitem configurar ações por papel, criar exceções individuais e consultar/exportar a auditoria.

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

- `GET /health/check` — verificação pública mínima de disponibilidade da API.
- `POST /auth/login` — autenticação JWT.
- `POST /auth/register` — solicitação pública de cadastro.
- `GET /medicamentos` e `PATCH /medicamentos/:id/estoque` — estoque e movimentações.
- `GET /pedidos`, `PATCH /pedidos/:id/aprovar` e `PATCH /pedidos/:id/entregar` — pedidos.
- `GET/PATCH/POST/DELETE /fornecedores` — fornecedores.
- `GET/PATCH/POST/DELETE /unidades-saude` — unidades de saúde.
- `GET /usuarios` e `PATCH /usuarios/:id/toggle` — gestão e aprovação de usuários, restrita ao `ADMIN`.
- `GET /permissoes/minhas` — permissões efetivas do usuário autenticado.
- `GET /permissoes/papeis` e `PUT /permissoes/papeis/:role` — matriz de permissões por papel.
- `GET /auditoria` e `GET /auditoria/exportar` — histórico administrativo e exportações PDF/CSV.
- `GET /auditoria/opcoes` — opções dinâmicas de ação, módulo, recurso, usuário e status para os filtros do histórico.
- `POST /relatorios/exportar` — exportação de relatórios.

## Tecnologias

- React + TypeScript + Vite
- Material UI e Recharts
- NestJS + Prisma
- PostgreSQL
- Docker Compose
