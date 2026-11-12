# Pacote de conformidade LGPD e segurança — S.A.M.

> **Aviso:** material técnico de apoio, **não é parecer jurídico**. Bases legais, prazos de retenção e atos normativos devem ser validados pela procuradoria municipal e pelo encarregado. Fundamentação: relatório de pesquisa de 12/11/2026 (LGPD, Res. CD/ANPD 15/2024, 18/2024, 19/2024, Portaria SVS/MS 344/98, Portaria GM/MS 5.713/2024, Lei 13.146/2015, Marco Civil, LAI).

O S.A.M. (controlador: **município**; software: operador/ferramenta) trata hoje dados de **servidores** e logística de medicamentos. Dados de **pacientes não são tratados**; se isso mudar, siga a seção "Gatilho de pacientes" do [RIPD](03-ripd.md) antes de qualquer desenvolvimento.

## Plano de conformidade e status

| # | Ação | Responsável | Status |
|---|------|-------------|--------|
| 1 | Aviso de privacidade público no login e no menu do perfil, com contato do encarregado (`GET /privacidade/aviso`) | Software | ✅ Implementado |
| 2 | Direitos do titular com protocolo, SLA de 15 dias (`venceEm`/`atrasada`) e regra "retenção legal impede eliminação" | Software | ✅ Implementado |
| 3 | Minimização: CPF mascarado em exportações (`***.456.789-**`) | Software | ✅ Implementado |
| 4 | Exportações Excel protegidas contra injeção de fórmulas | Software | ✅ Implementado |
| 5 | Sessão por cookie HttpOnly com rotação a cada 10 min, bloqueio de login, CSP, hash de IP em auditoria, trilha encadeada | Software | ✅ Implementado (ver [SECURITY.md](../../SECURITY.md)) |
| 6 | Registro das operações de tratamento (ROPA) | Prefeitura + TI | 📄 [Modelo pronto](02-registro-de-operacoes.md) — falta validar |
| 7 | RIPD | Prefeitura + TI | 📄 [Modelo pronto](03-ripd.md) — falta assinar |
| 8 | Política de retenção | Prefeitura | 📄 [Modelo pronto](04-politica-de-retencao.md) — falta tabela de temporalidade |
| 9 | Plano de resposta a incidentes + registro (5 anos) | Prefeitura + TI | 📄 [Modelo pronto](05-plano-de-incidentes.md) |
| 10 | Ato formal de designação do encarregado | Prefeitura | 📄 [Modelo](01-ato-encarregado.md) — **pendente de publicação** |
| 11 | Termo de uso e responsabilidade dos servidores | Prefeitura | 📄 [Modelo pronto](06-termo-de-uso.md) |
| 12 | Cláusulas LGPD para contrato de hospedagem/operador | Prefeitura | 📄 [Modelo](07-clausulas-operador.md) |
| 13 | Checklist de segurança e acessibilidade (ASVS/WCAG) | TI | 📄 [Checklist](08-checklist-seguranca-acessibilidade.md) |
| 14 | MFA, criptografia de coluna (CPF/telefone), backups cifrados e testados, ancoragem externa da cadeia de hash, expurgo automático por retenção, integração BNAFAR | TI | 🔜 Backlog priorizado em [ROADMAP](09-roadmap.md) |

## Variáveis de ambiente relacionadas

`CONTROLADOR_NOME`, `ENCARREGADO_NOME`, `ENCARREGADO_EMAIL` (aparecem no aviso de privacidade). Configure-as em cada ambiente.
