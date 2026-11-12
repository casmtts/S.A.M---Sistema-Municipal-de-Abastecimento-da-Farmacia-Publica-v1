# Changelog

## [Revisão 2026-11] — design e segurança
### Design
- Nova identidade "azul-medicamento": chrome marinho com textura de cartela blister, conteúdo claro, acento ciano, status em cápsula, dashboards com indicadores e gráficos redesenhados.
- Novo logotipo (cápsula + wordmark) e novo favicon; textos da tela de acesso reescritos sem alegações não verificáveis.
- Fontes Manrope e JetBrains Mono via Google Fonts; CSP do `vercel.json` ajustada para permitir apenas esses dois hosts (antes as fontes eram bloqueadas).
- `DESIGN.md` reescrito.
### Segurança e infraestrutura
- Backend em contêiner não-root com healthcheck.
- Banco de desenvolvimento limitado a `127.0.0.1`.
- Correção: `AUDIT_IDENTIFIER_SECRET` obrigatório e repassado no compose de produção.
- URL do repositório corrigida em `package.json` e README.
### Documentação
- Adicionados `SECURITY.md` e `CHANGELOG.md`; README atualizado.
