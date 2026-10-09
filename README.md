# S.A.M. — Sistema Municipal de Assistência Farmacêutica

Plataforma web para apoiar a gestão do abastecimento de medicamentos na rede municipal de saúde. Reúne estoque, movimentações, pedidos, unidades, fornecedores, relatórios e governança de acesso em uma operação integrada.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Problemas que ajuda a resolver](#problemas-que-ajuda-a-resolver)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como usar](#como-usar)
- [Principais endpoints](#principais-endpoints)
- [Testes](#testes)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Sobre o projeto

O S.A.M. foi desenvolvido para dar mais visibilidade ao estoque municipal, apoiar o planejamento de reposição e manter o histórico das operações farmacêuticas. O sistema oferece interfaces para gestores, farmacêuticos e atendentes, com acesso definido por função e permissões.

O software é uma ferramenta de apoio à operação. A implantação deve ser conduzida pelo município, que define os processos assistenciais, regras sanitárias, bases legais, responsabilidades e políticas de guarda aplicáveis.

## Problemas que ajuda a resolver

- Falta de visibilidade dos saldos e níveis de estoque.
- Compras e reposições feitas sem dados consolidados de consumo.
- Perdas por vencimento sem acompanhamento de lotes.
- Processos de solicitação, aprovação e movimentação sem rastreabilidade centralizada.

## Funcionalidades

### Estoque e medicamentos

- Cadastro de medicamentos, lotes, fornecedores e níveis mínimos.
- Consulta de saldo, validade e alertas de reposição ou vencimento.
- Registro de entradas, saídas e demais movimentações com usuário responsável.
- Histórico de movimentações e indicadores operacionais.

### Pedidos e abastecimento

- Solicitação de reposição para unidades de saúde.
- Triagem, aprovação, entrega e acompanhamento do status do pedido.
- Validação de disponibilidade antes de movimentar o estoque.
- Registro das operações relacionadas ao pedido.

### Unidades e fornecedores

- Cadastro e consulta de unidades municipais e fornecedores.
- Associação de medicamentos a fornecedores.
- Acompanhamento de cadastros ativos e informações operacionais.

### Relatórios e governança

- Indicadores de estoque, pedidos e movimentações.
- Exportação de relatórios em PDF, Excel e CSV conforme o módulo.
- Contas com aprovação administrativa, papéis de acesso e exceções individuais.
- Histórico de auditoria com verificação da integridade da cadeia de eventos.
- Sessão autenticada por cookie `HttpOnly`.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Material UI, Recharts |
| API | Node.js, NestJS, TypeScript |
| Persistência | PostgreSQL, Prisma ORM |
| Testes | Vitest, Testing Library, Playwright, Jest |
| Desenvolvimento | Docker Compose, Git |

## Pré-requisitos

- Docker Desktop ou Docker Engine com Docker Compose v2 para banco e API.
- Node.js compatível com o Vite instalado no frontend e npm.
- Git para clonar o repositório.

## Instalação e execução

### 1. Obtenha o código

```bash
git clone git@github.com:casmtts/sam-sistema-municipal-abastecimento-v2.git
cd sam-sistema-municipal-abastecimento-v2
```

### 2. Inicie banco e API

Na raiz do projeto:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

O PostgreSQL fica disponível no host pela porta `5433` e a API em `http://localhost:3001`. O backend aplica as migrations versionadas ao iniciar.

Os valores padrão do Compose são exclusivamente para desenvolvimento local. Para personalizá-los, crie um `.env` na raiz com, por exemplo:

```env
POSTGRES_DB=farmacia_municipal
POSTGRES_USER=sam
POSTGRES_PASSWORD=defina-uma-senha-local
POSTGRES_HOST_PORT=5433
JWT_SECRET=gere-uma-chave-aleatoria-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=15m
AUDIT_IDENTIFIER_SECRET=gere-outra-chave-aleatoria-com-pelo-menos-32-caracteres
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NODE_ENV=development
```

Não reutilize valores de desenvolvimento em ambientes compartilhados ou de produção. Nunca versione arquivos `.env` ou credenciais.

### 3. Inicie o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

O frontend ficará disponível em `http://localhost:3000`. `frontend/.env.example` define `VITE_API_URL=http://localhost:3001`; crie `frontend/.env` somente se precisar substituir esse endereço.

### Parar os serviços

```bash
docker compose down
```

Esse comando mantém os dados do volume PostgreSQL. Para apagar o banco local e seus dados, `docker compose down -v` remove o volume; use somente quando essa perda for intencional.

### Execução sem Docker

O banco PostgreSQL precisa estar instalado e acessível. Configure `backend/.env` a partir de `backend/.env.example`, ajuste `DATABASE_URL`, `JWT_SECRET` e `AUDIT_IDENTIFIER_SECRET`, então execute:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run start:dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

## Estrutura do projeto

```text
.
├── backend/
│   ├── prisma/              # Schema e migrations do PostgreSQL
│   ├── src/modules/         # Autenticação, estoque, pedidos, auditoria etc.
│   └── test/                # Testes de integração da API
├── frontend/
│   ├── public/              # Favicon e identidade visual
│   ├── src/                 # Aplicação React e componentes
│   └── tests/               # Testes unitários e fluxos Playwright
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## Como usar

1. Solicite uma conta pela tela inicial. Cadastros públicos aguardam aprovação administrativa.
2. Após a aprovação, entre com e-mail e senha.
3. Consulte alertas de estoque e validade no painel e no módulo **Estoque de Medicamentos**.
4. Registre movimentações e acompanhe solicitações no módulo **Pedidos da Rede**.
5. Mantenha os cadastros de unidades e fornecedores atualizados.
6. Use **Relatórios & Análises** para consultar e exportar informações disponíveis para seu perfil.
7. Administradores podem aprovar contas, administrar papéis e consultar a trilha de auditoria em **Usuários & Permissões**.

O primeiro administrador deve ser provisionado pelo responsável técnico do ambiente, seguindo o procedimento administrativo documentado em [backend/README.md](backend/README.md). Não há credenciais administrativas padrão para uso compartilhado.

## Principais endpoints

As rotas protegidas exigem sessão válida. O acesso efetivo depende do papel e das permissões atribuídas.

| Área | Endpoints principais |
| --- | --- |
| Saúde da API | `GET /health/check` |
| Autenticação | `POST /auth/login`, `POST /auth/register`, `GET /auth/session`, `GET /auth/me`, `POST /auth/logout` |
| Medicamentos | `GET /medicamentos`, `GET /medicamentos/alertas`, `GET /medicamentos/resumo`, `PATCH /medicamentos/:id/estoque` |
| Movimentações | `GET /movimentacoes`, `GET /movimentacoes/entradas`, `GET /movimentacoes/saidas`, `POST /movimentacoes` |
| Pedidos | `GET /pedidos`, `GET /pedidos/pendentes`, `POST /pedidos`, `PATCH /pedidos/:id/aprovar`, `PATCH /pedidos/:id/entregar` |
| Unidades e fornecedores | `/unidades-saude` e `/fornecedores` |
| Relatórios | `POST /relatorios/exportar` |
| Permissões | `GET /permissoes/minhas`, `/permissoes/papeis`, `/permissoes/usuarios/:id` |
| Auditoria | `GET /auditoria`, `GET /auditoria/exportar`, `GET /auditoria/integridade` |
| Privacidade | `GET /privacidade/dados`, `POST /privacidade/solicitacoes`, `GET /privacidade/minhas` |

Consulte os controllers em `backend/src/modules` para métodos, validações e controles de acesso atualizados.

## Testes

Frontend:

```bash
cd frontend
npm run test:unit
npm run test:e2e
```

Backend:

```bash
cd backend
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Os testes Playwright podem exigir os serviços e contas de teste configurados em `frontend/playwright.config.ts`. Não execute testes E2E contra dados operacionais.

## Segurança e privacidade

- A sessão usa cookie `HttpOnly`; o token de autenticação não é armazenado no `localStorage`.
- Senhas são armazenadas com hash bcrypt. A API aplica autenticação, papéis e permissões por operação.
- A trilha de auditoria registra ações relevantes e encadeia hashes para detectar alterações. A documentação explica limites, retenção e proteção operacional.
- O fluxo de privacidade permite solicitações de acesso, correção e eliminação/pseudonimização conforme análise administrativa.
- A proteção técnica do código não constitui, por si só, certificação ou garantia de conformidade legal. Antes de operar com dados reais, o município deve definir base legal e finalidade, papéis de controlador/operador, aviso de privacidade, retenção documental, segurança de infraestrutura, backups, gestão de incidentes e responsabilidades.

Veja [controles de operação e segurança do backend](backend/README.md) e a [documentação do módulo de privacidade](backend/src/modules/privacidade/README.md).

## Contribuição

1. Crie uma branch a partir da branch de trabalho acordada.
2. Faça alterações pequenas e mantenha ou amplie a cobertura de testes.
3. Execute build e testes relevantes antes de abrir um pull request.
4. Use mensagens de commit claras, preferencialmente no padrão Conventional Commits em português.

Não inclua dados reais de pacientes, credenciais, arquivos `.env`, dumps de banco ou exportações com dados pessoais em commits e issues.

## Licença

Este repositório ainda não declara uma licença de distribuição. O uso, redistribuição ou implantação devem ser autorizados pelo titular do projeto e pelo município responsável.
