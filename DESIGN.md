# Design System: S.A.M. — Sistema de Assistência Farmacêutica Municipal

## 1. Tema e atmosfera

Interface institucional de saúde pública, clínica e operacional. O produto deve transmitir precisão e confiança, mantendo dados densos fáceis de localizar durante triagem, abastecimento e auditoria. O design de referência é o projeto Stitch **Sistema de Fármacia Municipal - UI UX Professional Redesign**. Os valores de referência são funcionais: não copiar números fictícios, nomes demonstrativos, integrações ou selos de conformidade para o produto.

## 2. Paleta e papéis

- **Canvas clínico** (`#F8F9FF`): fundo geral levemente azulado.
- **Superfície** (`#FFFFFF`): cartões, tabelas, formulários e barra superior.
- **Navegação lavanda** (`#EFF4FF`): sidebar e fundo do drawer, para separar navegação sem escurecer a interface.
- **Azul institucional** (`#0A3663`): ação primária, seleção da navegação e títulos de maior peso.
- **Azul profundo** (`#002042`): hierarquia e contraste institucional.
- **Verde-azulado** (`#00677E`): detalhes funcionais e estados informativos.
- **Ciano clínico** (`#00ADCF`): foco, seleção secundária e realces breves.
- **Texto** (`#0B1C30`) e **texto secundário** (`#64748B`).
- **Borda** (`#E2E8F0`), **sucesso** (`#059669`), **atenção** (`#D97706`) e **crítico** (`#DC2626`).

## 3. Tipografia

Usar **Inter**, que é a família definida no tema do projeto Stitch. Hierarquia compacta, porém legível: títulos de página fluidos entre 27 e 34 px no desktop; títulos de seção em 16 px; texto de interface em 13–14 px; metadados nunca abaixo de 11 px. Indicadores numéricos usam algarismos tabulares. No mobile, títulos usam `clamp()` e o texto corrido não fica abaixo de 14 px.

## 4. Componentes e interação

- **Sidebar:** fixa com 256 px no desktop, fundo lavanda, marca S.A.M., identificação “Rede ativa: Municipal”, itens de navegação e perfil no rodapé. Seleção em azul institucional; hover em azul claro; saída fica vermelha no hover. Em telas menores, navegação vira drawer.
- **Barra superior:** branca, busca global, rede municipal ativa e notificações. O menu de perfil permanece somente na sidebar.
- **Botões:** primário azul institucional; secundário claro com borda; hover nítido, foco visível e área de toque de pelo menos 44 px.
- **Painéis:** superfície branca, contorno leve, raio de 8–10 px e sombra discreta. Reservar cartões para agrupamentos com hierarquia real.
- **Tabelas:** cabeçalho lavanda, divisores discretos, números alinhados por algarismos tabulares e rolagem horizontal dentro do próprio contêiner em viewports estreitos.
- **Estado:** status combina texto e cor. Tooltips e rótulos acessíveis explicam ações por ícone.
- **Movimento:** transições curtas de cor e opacidade; feedback tátil discreto. Respeitar `prefers-reduced-motion`; não usar animações contínuas que distraiam de alertas clínicos.
- **Vazio e erro:** orientar a ação seguinte com texto simples; não apresentar dados ou capacidades inexistentes como se estivessem ativos.

## 5. Composição das telas

- **Acesso e cadastro:** layout dividido entre identidade institucional e formulário; a solicitação de acesso deixa claro que depende de aprovação.
- **Visão geral:** saudação contextual, ações rápidas, quatro indicadores, distribuição de estoque e alertas em colunas, seguida dos pedidos recentes.
- **Estoque:** quatro indicadores operacionais, filtros, inventário por medicamento/lote, saldo, limites, validade, fornecedor e ações.
- **Pedidos:** resumo dos estados do fluxo, filtros e fila de requisições; painel inferior mostra apenas pedidos realmente registrados. Frota, telemetria e cadeia fria só aparecem quando houver integração real.
- **Cadastros:** alternância entre fornecedores e unidades, indicadores, busca, status, tabela e informações de completude/regulação claramente marcadas como não integradas quando aplicável.
- **Relatórios:** período, resumo e exportação, indicadores calculados sobre dados reais, gráfico de movimentações, ranking e histórico.
- **Usuários:** indicadores de contas, abas de contas/permissões/histórico, aprovações, tabela de ações e matriz de papéis. Aprovação e privilégios devem refletir as regras efetivas do backend.

## 6. Layout responsivo

- Conteúdo centralizado com largura máxima aproximada de 1660 px e preenchimento fluido.
- Sidebar deixa de ocupar o canvas em telas menores que 950 px e abre por botão no drawer.
- Abaixo de 720 px, painéis e indicadores se reorganizam em uma coluna; filtros podem quebrar em linhas; as tabelas rolam em seu próprio quadro.
- Não permitir rolagem horizontal da página. Permitir rolagem horizontal somente em superfícies que contenham tabelas largas.
- Não fixar alturas que cortem conteúdo; filas longas podem ter rolagem interna com limite explícito.

## 7. Restrições visuais e de conteúdo

- Não usar roxo neon, brilho externo, gradientes decorativos, cursores customizados ou fontes serifadas de dashboard.
- Não criar sobreposição de texto e controles, colunas cortadas, alvos de toque pequenos ou estados indicados somente por cor.
- Não inventar nomes de pessoas, quantidades, percentuais, preços, veículos, contratos, certificações, integrações ou alegações de compliance.
- Evitar cartões repetidos sem função, texto abaixo dos mínimos de legibilidade e animações que concorram com alertas de estoque/validade.
