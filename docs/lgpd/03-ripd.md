# Relatório de Impacto à Proteção de Dados Pessoais (RIPD) — modelo preenchido (LGPD arts. 5º XVII, 32, 38)

Versão 1.0 · 12/11/2026 · **Rascunho técnico a ser revisado e assinado pelo controlador.** Regulamento específico da ANPD ainda em elaboração.

1. **Descrição do tratamento:** gestão de estoque e pedidos de medicamentos; cadastro de servidores usuários.
2. **Dados:** identificação de servidores (nome, e-mail, CPF, telefone, cargo) e registros de uso. **Sem dados de saúde de pacientes.**
3. **Volume/escala:** local (município); número de servidores a preencher: ____.
4. **Coleta:** cadastro pelo próprio servidor + aprovação administrativa; registros automáticos.
5. **Medidas de segurança existentes:** cookie HttpOnly/SameSite com rotação, RBAC no backend, bloqueio de tentativas, CSP/HSTS, hash de IP, trilha encadeada, CPF mascarado em exportações, neutralização de fórmulas, container não-root, CodeQL e varredura de segredos no CI.
6. **Riscos identificados e mitigação**

| Risco | Prob. | Impacto | Mitigação existente | Mitigação planejada |
|---|---|---|---|---|
| Acesso indevido a CPF/telefone | Média | Médio | RBAC, auditoria | Criptografia de coluna; MFA para administradores |
| Vazamento por exportação | Baixa | Médio | CPF mascarado, log de exportação | Marca d'água |
| Perda/adulteração de logs | Baixa | Alto | Cadeia de hash | Ancoragem externa (WORM) |
| Indisponibilidade/perda de dados | Média | Alto | Docker + volume | Backups cifrados 3-2-1 com teste trimestral |
| Eliminação indevida de dado sujeito a guarda legal | Baixa | Alto | Regra de retenção no fluxo de titulares | Expurgo automatizado por política |

## Gatilho de pacientes (obrigatório antes de implementar)
Se o S.A.M. passar a registrar **dispensação nominal**: (a) atualizar este RIPD (dado sensível, art. 11); (b) base legal art. 11, II "a", "b" ou "f"; (c) confirmar com a vigilância sanitária o regime de escrituração de controlados (Portaria 344/98, art. 63 §1º); (d) planejar integração BNAFAR/RNDS; (e) preferir referenciar o prontuário existente em vez de duplicar dados clínicos; (f) reavaliar retenção (Lei 13.787/2018: 20 anos se compuser prontuário).

Assinaturas: Controlador ________ · Encarregado ________ · TI ________
