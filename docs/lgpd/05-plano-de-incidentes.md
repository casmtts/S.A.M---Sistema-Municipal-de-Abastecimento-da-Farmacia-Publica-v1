# Plano de resposta a incidentes de segurança (Res. CD/ANPD nº 15/2024)

**Prazo-chave: 3 dias úteis** a contar do conhecimento de que o incidente afetou dados pessoais com risco ou dano relevante — comunicar à **ANPD** (formulário eletrônico; complemento em até 20 dias úteis) e aos **titulares** (linguagem simples; se não identificáveis, aviso no sítio por ≥ 3 meses).

## Fluxo
1. **Detectar/relatar** (qualquer servidor → encarregado e TI, imediatamente). Fontes: alertas de login/bloqueio, quebra de cadeia de hash, exportação em massa, relatos.
2. **Conter** (revogar sessões: incrementar `tokenVersion`; trocar `JWT_SECRET`/`AUDIT_IDENTIFIER_SECRET` se vazados; isolar host).
3. **Preservar evidências** (logs, `requestId`, cadeia de auditoria; não reiniciar sem copiar).
4. **Avaliar relevância** (dados sensíveis, larga escala, vulneráveis, impacto).
5. **Comunicar** ANPD e titulares se relevante; **registrar sempre** (relevante ou não) e guardar **5 anos**.
6. **Corrigir causa raiz** e atualizar RIPD.
7. **Simulado anual.**

## Registro de incidente (copiar por ocorrência)
Data/hora da ocorrência: __ · do conhecimento: __ · Natureza e categoria dos dados: __ · Nº de titulares (e vulneráveis): __ · Medidas de segurança existentes: __ · Riscos/impactos: __ · Medidas adotadas/a adotar: __ · Motivo de demora (se houver): __ · Comunicado à ANPD em: __ · Aos titulares em: __ · Encarregado: __

**Contrato com operadores:** exigir notificação ao controlador em até 24 h.
