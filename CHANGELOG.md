# Changelog

## [Revisão 2026-11] — design e segurança
### Design
- Nova identidade "livro de registro": paleta de papel e tinta, vermelho de carimbo, tipografia serifada e monoespaçada do sistema, tabelas e painéis de linhas finas.
- Novo logotipo tipográfico e novo favicon; textos da tela de acesso reescritos sem alegações não verificáveis.
- Removida a dependência do Google Fonts (bloqueada pela CSP do deploy).
- `DESIGN.md` reescrito.
### Segurança e infraestrutura
- Backend em contêiner não-root com healthcheck.
- Banco de desenvolvimento limitado a `127.0.0.1`.
- Correção: `AUDIT_IDENTIFIER_SECRET` obrigatório e repassado no compose de produção.
- URL do repositório corrigida em `package.json` e README.
### Documentação
- Adicionados `SECURITY.md` e `CHANGELOG.md`; README atualizado.
