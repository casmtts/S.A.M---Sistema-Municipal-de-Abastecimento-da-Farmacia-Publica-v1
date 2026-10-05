# S.A.M. — Stitch Design System

## Referência

Implementação do projeto Stitch **Sistema de Fármacia Municipal - UI UX Professional Redesign**. As telas de desktop foram desenhadas em 1280 px; a interface mantém densidade informativa, navegação institucional persistente e fundos azul-lavanda muito claros. O conteúdo deve ocupar a largura útil, sem cortes ou alturas fixas. Os dados mostrados nas telas do produto vêm da API: exemplos visuais do Stitch não são valores padrão do sistema.

## Tokens visuais

- Fonte de interface: **Inter**, conforme o tema configurado no projeto Stitch.
- Azul principal: `#0A3663`; azul profundo: `#002042`; texto: `#0B1C30`.
- Ciano clínico: `#00ADCF`; azul esverdeado: `#00677E`.
- Fundo de página: `#F4F6F8`; navegação: branca; superfícies: `#FFFFFF`.
- Texto secundário: `#64748B`; bordas: `#E2E8F0`.
- Semântica: crítico `#DC2626`, atenção `#D97706`, sucesso `#059669`.
- Cantos arredondados moderados, próximos de 8 px; sombras suaves e bordas discretas.

## Shell e navegação

- Sidebar fixa de cerca de 256 px em desktop, fundo azul-lavanda, marca S.A.M., cartão **Rede ativa: Municipal**, navegação vertical e perfil no rodapé.
- Item ativo em azul institucional com ícone e texto de alto contraste.
- Barra superior branca com busca global, unidade/rede ativa e notificações. O avatar permanece exclusivamente na sidebar.
- No mobile, a sidebar torna-se drawer; tabelas rolam dentro de seus contêineres.

## Páginas

- **Acesso e cadastro:** composição dividida de identidade institucional e formulário, com os mesmos tokens e mensagens de privacidade simples e precisas.
- **Visão geral:** título contextual, ações, quatro indicadores, estoque e alertas em colunas e tabela de pedidos recentes.
- **Estoque:** indicadores de inventário, níveis críticos, filtros e tabela que prioriza medicamento, lote, saldo e validade.
- **Pedidos:** quatro contagens de fluxo, abas por estado, filtros, tabela operacional e áreas de logística/rastreabilidade.
- **Cadastros:** indicadores de fornecedores e unidades, alternância entre listas, filtros e cartões de conformidade/rastreabilidade.
- **Relatórios:** seletor de período, resumo e ações de exportação, indicadores, série de movimentações, ranking real e histórico.
- **Usuários:** solicitações pendentes, indicadores de acesso, abas para usuários/permissões/auditoria, ações governadas e matriz de papéis.

## Componentes e comportamento

- KPIs em quatro colunas no desktop; cartões brancos com rótulo, valor tabular e detalhe.
- Tabelas compactas, cabeçalho azul-lavanda, divisores leves e foco visível; ações por ícone têm rótulos acessíveis e tooltip.
- Formulários com rótulos persistentes, foco ciano/azul esverdeado e alvos confortáveis.
- Criticidade sempre acompanhada de texto, não somente cor.
- Métricas sem fonte de dados e integrações indisponíveis devem aparecer como indisponíveis ou ainda não configuradas; nunca inventar valores, compliance ou frota.
- Transições discretas, respeitando `prefers-reduced-motion`.
