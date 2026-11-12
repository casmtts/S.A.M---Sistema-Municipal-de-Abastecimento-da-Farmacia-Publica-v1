# Design: S.A.M. — "azul-medicamento"

## Ideia
Interface de saúde pública que parece instrumento de trabalho, não site institucional. O chrome (navegação, cabeçalho de página, acesso) é azul-marinho profundo; o conteúdo fica em cinza-azulado claro para tabelas e gráficos densos. Dois motivos de farmácia: a **cápsula** (logotipo, status) e a **cartela blister** (textura de pontos nas faixas azuis).

## Paleta (tokens em `frontend/src/design.css`)
| Papel | Valor |
| --- | --- |
| Marinho 950 / 900 / 800 | `#07162B` / `#0B2447` / `#0F3060` |
| Azul de ação | `#1D5FD1` |
| Ciano de soro (acento, foco, seleção) | `#3DD5F3` |
| Verde regular | `#2FBF8F` |
| Âmbar atenção | `#E9A23B` |
| Vermelho crítico | `#E5484D` |
| Fundo / cartão / linha | `#EEF3F9` / `#FFFFFF` / `#D8E2EE` |
| Texto / secundário | `#0B1B33` / `#55687F` |

## Tipografia
- **Manrope** (interface e títulos, pesos 400–800) e **JetBrains Mono** (lotes, rótulos, números de tabela), carregadas do Google Fonts. A CSP de `frontend/vercel.json` libera `fonts.googleapis.com` e `fonts.gstatic.com`. Sem rede, cai para `Avenir Next` / `Segoe UI` / `system-ui` e `ui-monospace`.
- Algarismos tabulares em todo o sistema; indicadores grandes em Manrope 800.

## Componentes
- **Navegação:** faixa marinho com cartela; item ativo em cápsula ciano translúcida.
- **Cabeçalho de página:** faixa marinho arredondada com brilho ciano, título em branco e ação principal em ciano.
- **Dashboards:** indicadores em cartões brancos com barra lateral de estado (azul, âmbar, verde); barras de nível em gradiente; gráficos Recharts em azul e verde, tooltip marinho.
- **Status:** cápsulas tintadas com ponto de cor e texto (nunca só cor).
- **Tabelas:** cabeçalho cinza-azulado em caixa-alta, linhas com realce azul claro ao passar o mouse, valores em monoespaçada.
- **Acesso:** painel marinho com cartela e brilho ciano; formulário em cartão branco.

## Regras
- Foco sempre visível (2 px ciano), alvos de toque de 44 px, `prefers-reduced-motion` respeitado.
- Contraste: texto sobre marinho e sobre branco acima de 7:1.
- Não inventar números, integrações, certificações ou alegações de conformidade.
- Sem rolagem horizontal da página; tabelas rolam no próprio quadro.

## Responsividade
Testado sem rolagem horizontal em 320, 375, 390, 414, 768 e 1280 px.
- **≥ 951 px:** navegação superior, cards de indicador em 4 colunas.
- **≤ 950 px:** navegação vira drawer (botão ☰), painéis em coluna única, cards em 2 colunas.
- **≤ 560 px:** cabeçalho de página compacto com ação em largura total, filtros empilhados, tabelas rolam no próprio quadro, abas rolam na horizontal, alvos de toque de 44 px, diálogos quase em tela cheia, status "Rede ativa" oculto.
- **≤ 380 / 340 px:** cards continuam em 2 colunas com tipografia reduzida; valores monetários encolhem com a largura e nunca quebram no meio.
