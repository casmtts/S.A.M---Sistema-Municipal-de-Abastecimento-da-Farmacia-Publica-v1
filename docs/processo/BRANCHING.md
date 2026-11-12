# Branches e fluxo de entrega

```
feat/* fix/* docs/*  ──PR──▶  dev  ──PR──▶  homolog  ──PR──▶  main (tag vX.Y.Z)
                                              ▲                    │
                                hotfix/* ◀────┴────────────────────┘ (parte de main, volta para homolog e dev)
```

| Branch | Critério para entrar | Ambiente |
|---|---|---|
| `dev` | CI verde (testes, CodeQL, segredos), 1 revisão | Dev — dados fictícios |
| `homolog` | Aceite funcional + checklist [segurança/acessibilidade](../lgpd/08-checklist-seguranca-acessibilidade.md) + sem vulnerabilidade crítica/alta aberta | Homologação — dados **anonimizados** |
| `main` | Aprovação do responsável técnico e do encarregado quando houver mudança em dados pessoais | Produção |

## Proteções recomendadas (GitHub → Settings → Branches)
Para `main`, `homolog` e `dev`: exigir pull request, ao menos 1 aprovação, checks "Segurança e qualidade" e "CodeQL" obrigatórios, bloquear force-push e exclusão. Em `main`, exigir também histórico linear ou merge commit assinado.

## Regras
- Commits no padrão Conventional Commits em português.
- Nunca commitar `.env`, dumps, exportações com dados pessoais ou dados reais de pacientes.
- Mudança que altere dados pessoais (campos, finalidade, compartilhamento) atualiza [ROPA](../lgpd/02-registro-de-operacoes.md) e [RIPD](../lgpd/03-ripd.md) no mesmo PR.
