# Design: S.A.M. — "livro de registro"

## Ideia
A farmácia pública trabalha com papel, carimbo e assinatura: livro de entrada e saída, receituário, etiqueta de lote. A interface parte dessa linguagem. Ela é tipográfica e de linhas finas, sem sombras suaves, sem gradientes e sem cantos arredondados. A confiança vem da legibilidade e da ordem, não de brilho.

## Paleta (tokens em `frontend/src/design.css`)
| Papel | Token | Valor |
| --- | --- | --- |
| Fundo (papel) | `--paper` | `#F3EEE3` |
| Folha (painéis) | `--sheet` | `#FBF8F1` |
| Tinta | `--ink` | `#1D2420` |
| Régua | `--rule` | `#CFC6B2` |
| Verde-floresta (ação, navegação) | `--forest` | `#1B3A2D` |
| Verde de estado "regular" | `--forest-2` | `#2F6B4F` |
| Vermelho de carimbo (crítico, foco, seleção) | `--stamp` | `#B8321F` |
| Ocre (atenção) | `--ochre` | `#A96B12` |
| Azul-denim (informativo) | `--denim` | `#2F5D7C` |

O vermelho é o único acento. Ele aparece em seleção de navegação, foco, estados críticos e gráfico de saídas. Contraste de texto principal sobre fundo: acima de 12:1.

## Tipografia
Fontes do sistema, sem download (a CSP do deploy só permite `font-src 'self'`).
- **Títulos e números grandes:** serifa de livro (`Iowan Old Style`, `Palatino`, `Georgia`).
- **Interface:** `Avenir Next` / `Segoe UI` / `system-ui`.
- **Rótulos, lotes, cabeçalhos de tabela, carimbos:** monoespaçada do sistema, caixa-alta, espaçamento aberto.
Algarismos tabulares em todo o sistema.

## Componentes
- **Navegação:** faixa verde-escura com filete duplo vermelho embaixo; item ativo sublinhado em vermelho. Logotipo tipográfico "S.A.M." com filete vertical vermelho.
- **Painéis e indicadores:** folha com borda fina e régua superior de 2 px; números em serifa grande; sem ícones decorativos em caixas.
- **Status:** carimbos retangulares com contorno, texto em caixa-alta monoespaçada. O estado crítico tem leve inclinação. Cor nunca é o único sinal: o texto sempre diz o estado.
- **Tabelas:** régua superior e inferior, cabeçalho com filete duplo, linhas com divisor fino e destaque ao passar o mouse.
- **Diálogos e menus:** borda de tinta, régua vermelha no topo e sombra dura deslocada (sem desfoque).
- **Acesso:** capa de livro; painel verde com pautas e margem vermelha, formulário na folha.

## Regras
- Raio de borda 0 (MUI `shape.borderRadius` = 2 apenas onde o componente exige).
- Sem sombras com desfoque, gradientes, brilhos, roxo, ou ícones em caixas coloridas.
- Alvos de toque de pelo menos 44 px; foco sempre visível (2 px vermelho).
- Respeitar `prefers-reduced-motion`.
- Não inventar números, integrações, certificações ou alegações de conformidade. Textos de marketing da tela de acesso descrevem apenas o que o sistema faz.
- Sem rolagem horizontal da página; tabelas rolam no próprio quadro.
