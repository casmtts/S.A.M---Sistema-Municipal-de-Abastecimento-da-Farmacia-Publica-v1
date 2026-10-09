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

## Auditoria append-only

- Registros de auditoria são encadeados por SHA-256 e recebem sequência, hash anterior e hash do evento.
- Triggers PostgreSQL rejeitam `UPDATE`, `DELETE` e `TRUNCATE` na tabela de auditoria. O identificador do ator é preservado como dado histórico, sem chave estrangeira que altere registros quando uma conta é excluída.
- Falhas para registrar auditoria são retornadas ao fluxo e não são descartadas silenciosamente. Alterações de usuários, permissões e credenciais são gravadas na mesma transação que a alteração correspondente.
- Admin e Super Admin podem verificar a cadeia em `GET /auditoria/integridade`; os hashes também aparecem nos detalhes e exportações.
- A cadeia detecta alterações ou remoções no histórico, mas um administrador com privilégios de superusuário no PostgreSQL ainda pode alterar esquema e triggers. Para proteção contra esse nível de acesso, ancore/exporte os hashes para armazenamento externo sob controle independente.

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
| `GET` | `/auditoria/integridade` | ADMIN/SUPER_ADMIN |
| `GET` | `/auditoria/opcoes` | ADMIN/SUPER_ADMIN |
| `GET` | `/auditoria/exportar?formato=PDF|CSV` | ADMIN/SUPER_ADMIN |

## Build e testes

```bash
npm run build
npx jest --runInBand --passWithNoTests --watchman=false --transform='{"^.+\\.tsx?$":"ts-jest"}'
```

O build gera a aplicação em `dist/src/main.js`, que é o arquivo iniciado pelo Docker.

## Privacidade, LGPD e controles operacionais

- A sessão JWT é enviada somente em cookie `HttpOnly`, `SameSite=Strict`; mutações com cookie exigem `Origin` presente e listado em `CORS_ORIGINS`. Configure HTTPS em produção (`Secure` é ativado por `NODE_ENV=production`) e mantenha frontend/API no mesmo site para o cookie estrito.
- `GET /privacidade/dados` exporta os dados operacionais associados à própria conta. `POST /privacidade/solicitacoes` registra pedidos `ACESSO`, `CORRECAO` ou `ELIMINACAO`; `GET /privacidade/minhas` consulta o andamento. Administradores tratam a fila em `/privacidade/solicitacoes/todas` e `PATCH /privacidade/solicitacoes/:id`. `POST /privacidade/usuarios/:id/pseudonimizar` é restrito ao Super Admin, exige solicitação de eliminação concluída e invalida sessões; preserva referências operacionais e não equivale a anonimização irreversível.
- A exportação cobre conta, pedidos, movimentações e solicitações. A pseudonimização remove dados cadastrais diretos e nomes/texto livre de movimentações e solicitações, preservando chaves técnicas de vínculos históricos. Cópias de segurança e exportações previamente baixadas exigem processo separado de retenção e descarte.
- Registros de auditoria minimizam identificadores diretos: conta pseudonimizada, IP transformado por HMAC e user-agent omitido. Defina `AUDIT_IDENTIFIER_SECRET` como segredo independente de pelo menos 32 caracteres em produção; rotação deve ser planejada para preservar comparação histórica dos hashes.
- Novas senhas exigem ao menos 6 caracteres e são armazenadas com bcrypt custo 12. A sessão permanece limitada ao vencimento configurado em `JWT_EXPIRES_IN`, até 24 horas.

Este código oferece controles técnicos, mas não declara conformidade legal por si só. Antes da operação, o controlador municipal deve aprovar aviso de privacidade, finalidade e base legal por tratamento, contato do encarregado, papéis de controlador/operador, matriz de acesso, prazos de guarda por classe documental, política de backups, registro de operações, avaliação de impacto quando aplicável, treinamento e plano de resposta a incidentes. Para incidentes que possam causar risco ou dano relevante, a Resolução CD/ANPD nº 15/2024 prevê comunicação à ANPD e aos titulares em até três dias úteis e guarda do registro por pelo menos cinco anos. A eliminação de documentos públicos deve seguir a tabela de temporalidade e a aprovação arquivística aplicáveis; não use a pseudonimização como substituto desse processo.

### Barreiras obrigatórias antes de produção

- Use HTTPS ponta a ponta, PostgreSQL com TLS e criptografia de volume/backup gerida pela infraestrutura. O código não cifra dados pessoais em coluna.
- Separe o usuário de migration/DDL do usuário de runtime. O runtime não deve ser dono da tabela de auditoria nem poder alterar triggers; conceda somente `SELECT`/`INSERT` para `logs_auditoria` e `SELECT` para a função de integridade.
- Exija MFA para contas administrativas, mantenha segredo JWT e `AUDIT_IDENTIFIER_SECRET` em cofre de secrets, e restrinja acesso ao banco por rede e função.
- Configure alertas e escalação para incidentes 24/7, com inventário de dados afetados e fluxo para cumprir os prazos de comunicação aplicáveis. O código não envia notificações legais automaticamente.
- Aprove e documente tabelas de temporalidade, descarte de backups, exportações locais e revisão periódica de permissões. O fluxo de pseudonimização não elimina registros de estoque/pedidos nem cópias externas.
