# S.A.M. — Backend

API NestJS do Sistema Municipal de Abastecimento. O backend implementa autenticação JWT, permissões granulares, auditoria permanente, regras de estoque e persistência PostgreSQL com Prisma.

## Módulos

- `auth`: login, cadastro público e emissão de JWT.
- `usuarios`: gestão administrativa e aprovação de cadastros.
- `medicamentos`: catálogo, estoque e alertas.
- `movimentacoes`: entradas, saídas e dispensações persistidas.
- `pedidos`: solicitação, aprovação, entrega e cancelamento.
- `fornecedores` e `unidades-saude`: cadastros operacionais.
- `relatorios`: exportação de relatórios em PDF e Excel.
- `permissoes`: matriz por papel e exceções individuais.
- `auditoria`: histórico permanente de ações e exportações PDF/CSV.

## Variáveis de ambiente

Crie `backend/.env` a partir do exemplo:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/farmacia_municipal
JWT_SECRET=troque-esta-chave-em-producao
JWT_EXPIRES_IN=15m
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TRUST_PROXY=false
PORT=3001
```

`JWT_SECRET` deve ter pelo menos 32 caracteres. `CORS_ORIGINS` aceita somente origens exatas separadas por vírgula. `JWT_EXPIRES_IN` aceita valores como `15m`, `12h` ou segundos numéricos.

## Execução local

```bash
npm install
npx prisma migrate deploy
npm run start:dev
```

A API fica disponível em [http://localhost:3001](http://localhost:3001).

## Execução com Docker

A configuração oficial fica na raiz do projeto e sobe o backend junto com um PostgreSQL persistente:

```bash
cd ..
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

O container executa `prisma migrate deploy` antes de iniciar o NestJS. Para parar sem remover os dados:

```bash
docker compose down
```

Consulte o [README da raiz](../README.md) para variáveis do Compose, volume do banco e criação do primeiro administrador.

## Prisma

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

As migrations versionadas estão em `prisma/migrations`. Em produção, use `migrate deploy`; não use `migrate dev` contra o banco operacional.

## Autenticação e autorização

- `POST /auth/register` cria um usuário inativo com papel `ATENDENTE`.
- `POST /auth/login` só autentica usuários ativos.
- `PATCH /auth/password` altera a senha e revoga os tokens anteriores.
- `POST /auth/logout-all` encerra todas as sessões do usuário.
- Rotas administrativas usam JWT, papel e permissões granulares.
- `ADMIN` e `SUPER_ADMIN` têm acesso total; o primeiro `ADMIN` é promovido automaticamente para `SUPER_ADMIN`.
- O `SUPER_ADMIN` não pode ser editado, desativado, ter o papel alterado ou ser removido.
- `PATCH /usuarios/:id/toggle` aprova ou desativa um usuário.
- O usuário autenticado é usado nas operações de movimentação de estoque.

## Endpoints principais

| Método | Endpoint | Acesso |
| --- | --- | --- |
| `GET` | `/health/check` | Público |
| `POST` | `/auth/login` | Público |
| `POST` | `/auth/register` | Público |
| `GET` | `/medicamentos` | JWT |
| `PATCH` | `/medicamentos/:id/estoque` | ADMIN/FARMACEUTICO |
| `GET/POST/PATCH/DELETE` | `/pedidos` | Conforme função |
| `GET/POST/PATCH/DELETE` | `/fornecedores` | Conforme função |
| `GET/POST/PATCH/DELETE` | `/unidades-saude` | Conforme função |
| `GET` | `/usuarios` | ADMIN |
| `PATCH` | `/usuarios/:id/toggle` | ADMIN |
| `POST` | `/relatorios/exportar` | ADMIN/GESTOR |
| `GET` | `/permissoes/minhas` | JWT |
| `GET/PUT` | `/permissoes/papeis` | ADMIN/SUPER_ADMIN |
| `GET/PUT` | `/permissoes/usuarios/:id` | ADMIN/SUPER_ADMIN |
| `GET` | `/auditoria` | ADMIN/SUPER_ADMIN |
| `GET` | `/auditoria/exportar?formato=PDF|CSV` | ADMIN/SUPER_ADMIN |

## Build e testes

```bash
npm run build
npx jest --runInBand --passWithNoTests --watchman=false --transform='{"^.+\\.tsx?$":"ts-jest"}'
```

O build gera a aplicação em `dist/src/main.js`, que é o arquivo iniciado pelo Docker.
