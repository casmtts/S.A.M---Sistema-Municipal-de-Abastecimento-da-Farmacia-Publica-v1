# Roadmap de conformidade (priorizado)

1. **MFA (TOTP)** para ADMIN/SUPER_ADMIN e RT farmacêutico.
2. **Criptografia de coluna** (CPF, telefone) com chave em cofre/KMS; busca por hash cego.
3. **Backups** 3-2-1 cifrados + teste de restauração trimestral (RPO ≤ 24 h, RTO ≤ 8 h).
4. **Ancoragem externa** diária do hash da trilha (WORM) + verificação automática.
5. **Expurgo automatizado** conforme [política de retenção](04-politica-de-retencao.md), respeitando a cadeia de hash (arquivar/anonimizar, não apagar elos).
6. **Painel público de estoque** sem dados pessoais (transparência ativa/LAI).
7. **Integração BNAFAR** (envio diário de estoque/entradas/saídas) — Portaria GM/MS 5.713/2024.
8. **Lockout distribuído** (Redis) e alertas de login anômalo/exportação em massa.
9. **axe/Lighthouse em CI** e declaração de acessibilidade.
10. Antes de pacientes: ver gatilho no [RIPD](03-ripd.md).
