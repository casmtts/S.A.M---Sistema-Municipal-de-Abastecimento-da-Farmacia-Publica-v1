# Registro das operações de tratamento (ROPA) — LGPD art. 37

Controlador: Município de ________ / Secretaria de Saúde · Encarregado: ________ · Versão 1.0 · 12/11/2026

| Operação | Dados | Titulares | Finalidade | Base legal | Acesso | Compartilhamento | Retenção | Segurança |
|---|---|---|---|---|---|---|---|---|
| Cadastro e autenticação de servidores | nome, e-mail, CPF, telefone, cargo, perfil, hash de senha | Servidores | Identificar e autorizar acesso | Art. 7º, II e III; art. 23 | Administradores; o próprio titular | Nenhum | Vigência do vínculo + guarda dos documentos que o referenciam | bcrypt custo 12, cookie HttpOnly, rotação 10 min, bloqueio de tentativas |
| Movimentações de estoque e pedidos | Identificador do responsável, data/hora, documento | Servidores | Controle patrimonial e sanitário (accountability) | Art. 7º, II | Perfis com permissão | BNAFAR/MS quando exigido (Portaria GM/MS 5.713/2024) — *se aplicável* | ≥ 2 anos (Portaria 344/98, art. 64) | RBAC, auditoria encadeada |
| Trilha de auditoria | usuário, ação, IP (hash HMAC), user-agent | Servidores | Segurança, rastreabilidade, apuração de incidentes | Art. 7º, II; art. 46 | Administradores com permissão | Autoridades mediante requisição legal | ≥ 2 anos (negócio); acessos ≥ 6 meses | Hash encadeado, mascaramento de CPF/telefone |
| Atendimento a titulares | Protocolo, descrição, resposta | Servidores | Cumprir arts. 18 e 19 | Art. 7º, II | Administradores; titular | Nenhum | 5 anos após encerramento (sugestão) | Auditoria de cada decisão |
| Relatórios/exportações | Nome, e-mail, CPF mascarado, cargo | Servidores | Gestão | Art. 7º, III | Perfis autorizados | Nenhum | Não retidos pelo sistema | Neutralização de fórmulas; ação auditada |

*Operadores/suboperadores (hospedagem, backup, e-mail):* ________ · *País de armazenamento:* ________ (se fora do Brasil, ver Res. CD/ANPD 19/2024).
