# S.A.M. — Frontend

Frontend React + TypeScript do Sistema Municipal de Abastecimento. A aplicação usa Material UI, Recharts e Vite, consumindo a API NestJS com dados persistidos no PostgreSQL.

## Funcionalidades

- Login JWT e solicitação pública de cadastro.
- Visualização operacional de estoque, pedidos, alertas e indicadores.
- CRUD de medicamentos, fornecedores, unidades e usuários.
- Aprovação administrativa de cadastros pendentes.
- Movimentações de estoque e avanço de pedidos pela API.
- Exportação de relatórios gerados pelo backend.

## Configuração

Requisitos: Node.js 20+ e npm.

```bash
cp .env.example .env
```

Configure a URL da API em `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

O valor padrão também é `http://localhost:3001` quando a variável não existe.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O Vite disponibiliza HMR para atualizar a interface durante o desenvolvimento.

O backend pode ser iniciado localmente ou pelo Compose na raiz do projeto:

```bash
cd ..
docker compose up --build -d
```

## Build e validação

```bash
npx tsc --noEmit
npm run build
npm run preview
```

## Integração com autenticação

- O token JWT é armazenado na sessão do navegador e enviado como `Authorization: Bearer ...`.
- Usuários recém-cadastrados ficam pendentes até o administrador geral aprovar o acesso.
- O botão de olho nos campos de senha permite alternar entre texto visível e oculto.
- Erros `401` encerram a sessão local e retornam o usuário à tela de autenticação.

## Estrutura principal

- `src/App.tsx`: shell da aplicação, telas ativas e integração com a API.
- `src/services/api.ts`: cliente Axios, URL da API e interceptores JWT.
- `src/App.css`: layout responsivo e estilos da interface.

Para a arquitetura completa, Docker, banco e endpoints, consulte o [README da raiz](../README.md) e o [README do backend](../backend/README.md).
