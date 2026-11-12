# Política de retenção e eliminação (modelo)

Constantes de referência no código: `backend/src/common/utils/retention.policy.ts`. Validar com a tabela de temporalidade municipal (Lei 8.159/1991).

| Dado | Prazo de referência | Fundamento | Fim do prazo |
|---|---|---|---|
| Registros de acesso (login, IP com hash) | ≥ 6 meses (180 dias) | Marco Civil art. 15 (boa prática para o município) | Expurgo |
| Trilha de auditoria e movimentações | ≥ 2 anos (730 dias) ou prazo da tabela municipal | Portaria 344/98 art. 64; art. 16, I da LGPD | Anonimizar/arquivar conforme tabela |
| Conta de servidor desligado | Bloquear no desligamento; manter identificação mínima enquanto houver documento que a referencie | LGPD art. 16, I | Pseudonimizar (fluxo existente) |
| Solicitações de titulares | 5 anos após encerramento (sugestão) | Prestação de contas | Eliminar |
| Registro de incidentes | 5 anos | Res. CD/ANPD 15/2024 art. 10 | Eliminar |
| Backups | 30–90 dias (definir) | Continuidade | Sobrescrever |

**Regra:** pedido de eliminação **não** apaga movimentações nem trilha de auditoria dentro do prazo de guarda (LGPD art. 16, I); o sistema pseudonimiza dados diretos e o encarregado responde de forma fundamentada (art. 18, §4º).
**Ambientes:** proibido usar dados reais em desenvolvimento/homologação sem anonimização.
