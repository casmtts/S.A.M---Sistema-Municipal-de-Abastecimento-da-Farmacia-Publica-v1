# Checklist de segurança e acessibilidade (autoavaliação)

Referências de boa prática: OWASP ASVS nível 2, OWASP Top 10, WCAG 2.1 AA/eMAG, PPSI 2.0 (referência; obrigatório só para órgãos federais).

| Controle | Status |
|---|---|
| TLS 1.2+/HSTS em produção | ☐ validar no deploy |
| Cookies HttpOnly + SameSite + Secure (prod), rotação 10 min | ✅ |
| Algoritmo JWT fixado (HS256), vida absoluta de sessão | ✅ |
| Bloqueio de tentativas e anti-enumeração (login/cadastro) | ✅ |
| Autorização no backend (Guards, permissões) | ✅ |
| Validação de entrada (class-validator, whitelist) | ✅ |
| CSP, Permissions-Policy, checagem de Origin | ✅ |
| CPF mascarado em exportações; fórmulas neutralizadas | ✅ |
| Container não-root, healthcheck | ✅ |
| CodeQL + varredura de segredos no CI | ✅ |
| Dependabot habilitado | ✅ (branches de dependabot existentes) |
| MFA para perfis administrativos | 🔜 |
| Criptografia em repouso (volume + coluna CPF/telefone) | 🔜 |
| Backups 3-2-1 cifrados, teste de restauração trimestral | 🔜 |
| Lockout compartilhado (Redis) para múltiplas réplicas | 🔜 |
| Teste automatizado de acessibilidade (axe/Lighthouse) em CI | 🔜 |
| Teste manual com leitor de tela nas jornadas principais | ☐ |
| Declaração de acessibilidade publicada | ☐ |
