# Changelog

## [Revisão 2026-11] — design e segurança
### Design
- Nova identidade "azul-medicamento": chrome marinho com textura de cartela blister, conteúdo claro, acento ciano, status em cápsula, dashboards com indicadores e gráficos redesenhados.
- Novo logotipo (cápsula + wordmark) e novo favicon; textos da tela de acesso reescritos sem alegações não verificáveis.
- Fontes Manrope e JetBrains Mono via Google Fonts; CSP do `vercel.json` ajustada para permitir apenas esses dois hosts (antes as fontes eram bloqueadas).
- `DESIGN.md` reescrito.
- Responsividade para 320–1280 px (cards em 2 colunas no celular, alvos de toque de 44 px, sem rolagem horizontal); cards de indicador unificados (estoque, pedidos, cadastros, relatórios, usuários).
### Segurança e infraestrutura
- Backend em contêiner não-root com healthcheck.
- Banco de desenvolvimento limitado a `127.0.0.1`.
- Correção: `AUDIT_IDENTIFIER_SECRET` obrigatório e repassado no compose de produção.
- URL do repositório corrigida em `package.json` e README.
- Sessão: rotação do cookie de autenticação a cada 10 min (`SESSION_ROTATE_SECONDS`), vida máxima de 8 h (`SESSION_ABSOLUTE_MAX_SECONDS`), JWT fixado em HS256.
- Senhas: mínimo de 10 e máximo de 72 caracteres (frontend e backend); nova senha precisa diferir da atual.
- Login: bloqueio por conta após 5 falhas em 15 min e tempo de resposta uniforme para e-mails inexistentes.
- Cadastro público devolve apenas a mensagem; ativação/desativação de usuários e fornecedores validada por DTO; admin não pode desativar/remover a si mesmo.
- Cabeçalho `Permissions-Policy` na API; workflow CodeQL adicionado.
### Documentação
- Adicionados `SECURITY.md` e `CHANGELOG.md`; README atualizado.
