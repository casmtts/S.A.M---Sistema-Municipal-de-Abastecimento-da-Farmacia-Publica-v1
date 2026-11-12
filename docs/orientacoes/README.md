# Orientações de Uso — S.A.M.
## Sistema Municipal de Abastecimento da Farmácia Pública

> **Público-alvo:** servidores municipais, gestores e administradores do sistema.  
> Este documento explica cada módulo, o que é possível fazer e quem pode acessar.

---

## Sumário
1. [Visão geral](#1-visão-geral)
2. [Perfis de acesso](#2-perfis-de-acesso)
3. [Módulo: Visão geral (Dashboard)](#3-módulo-visão-geral-dashboard)
4. [Módulo: Estoque de medicamentos](#4-módulo-estoque-de-medicamentos)
5. [Módulo: Pedidos](#5-módulo-pedidos)
6. [Módulo: Cadastros (Fornecedores e Unidades)](#6-módulo-cadastros-fornecedores-e-unidades)
7. [Módulo: Relatórios e análises](#7-módulo-relatórios-e-análises)
8. [Módulo: Usuários, permissões e conformidade](#8-módulo-usuários-permissões-e-conformidade)
9. [Fluxo de trabalho típico por perfil](#9-fluxo-de-trabalho-típico-por-perfil)
10. [Perguntas frequentes](#10-perguntas-frequentes)

---

## 1. Visão geral

O **S.A.M.** é um sistema web de gestão de estoque e abastecimento para farmácias públicas municipais. Ele permite:

- Controlar o estoque de medicamentos em tempo real
- Registrar entradas, saídas e dispensações para pacientes e unidades de saúde
- Enviar e acompanhar pedidos de reposição
- Gerar relatórios de inventário em PDF e Excel
- Gerenciar usuários e permissões de acesso
- Registrar e auditar todas as ações (trilha de auditoria imutável)
- Atender às exigências da LGPD (Lei Geral de Proteção de Dados)

### Tecnologia

- **Frontend:** aplicação web responsiva, acessível em computadores, tablets e celulares
- **Backend:** servidor seguro com banco de dados PostgreSQL
- **Acesso:** login com e-mail e senha; sessão expira automaticamente após 8 horas ou 10 minutos de inatividade
- **Horário:** todos os registros e relatórios utilizam o horário oficial de **Brasília (GMT-3)**

---

## 2. Perfis de acesso

| Perfil | Quem usa | O que pode fazer |
|---|---|---|
| **Super Administrador** | TI / responsável técnico | Acesso irrestrito; gerencia outros admins |
| **Administrador** | Coordenador de farmácia | Acesso completo a todos os módulos |
| **Gestor** | Gestor municipal de saúde | Opera estoque, aprova pedidos, vê relatórios |
| **Farmacêutico** | Farmacêutico responsável | Movimenta medicamentos, consulta estoque |
| **Atendente / Dispensador** | Atendente de farmácia | Registra solicitações, consulta estoque |
| **Consultor** | Auditores, controle interno | Consulta relatórios e histórico |

> **Novo usuário:** o cadastro fica como **"Pendente"** até ser aprovado por um Administrador. Enquanto pendente, o login é bloqueado.

### Como aprovar um usuário pendente
1. Acesse o módulo **Usuários** (ícone de pessoas no menu lateral)
2. Vá para a aba **Contas e aprovações**
3. Localize o usuário com status **Pendente** (tarja laranja)
4. Clique no ícone verde de aprovação (✓) na linha do usuário

---

## 3. Módulo: Visão geral (Dashboard)

**Acesso:** todos os perfis (Consultor vê apenas leitura)

O painel inicial exibe:

### Cards de indicadores
| Indicador | O que significa |
|---|---|
| **Itens em estoque** | Total de unidades de todos os medicamentos cadastrados |
| **Alertas ativos** | Medicamentos com estoque abaixo do mínimo ou validade próxima (≤ 30 dias) |
| **Pedidos em aberto** | Pedidos aguardando entrega (Pendente, Em análise, Aprovado, Em entrega) |
| **Valor em estoque** | Soma de `quantidade × preço unitário` de todos os medicamentos |

> Clique em qualquer card para ver o detalhamento.

### Barra de estoque
Lista os 5 primeiros medicamentos com barra de progresso colorida:
- 🟢 **Verde** — acima de 70% da capacidade máxima
- 🟡 **Amarelo** — entre 20% e 70%
- 🔴 **Vermelho** — abaixo de 20% (crítico)

### Gráfico Consumo × Estoque
Exibe os medicamentos com maior consumo nos últimos 30 dias comparado ao estoque atual. Útil para identificar itens que precisam de reposição urgente.

### Estimativas de planejamento
Tabela automática com medicamentos cuja cobertura é menor que 60 dias, mostrando:
- **Consumo 30d** — saídas e dispensações registradas
- **Cobertura estimada** — quantos dias o estoque atual dura no ritmo atual de consumo
- **Repor (até máx)** — quantidade necessária para atingir o estoque máximo
- **Valor em estoque** — valor financeiro do item

> As estimativas dependem dos registros de movimentação. Quanto mais completo o histórico, mais precisa a projeção.

---

## 4. Módulo: Estoque de medicamentos

**Acesso:** Administrador, Gestor, Farmacêutico, Atendente (consulta)

### O que é possível
- **Adicionar** um novo medicamento ao catálogo
- **Editar** dados (nome, princípio ativo, concentração, forma farmacêutica, validade, preço, fornecedor)
- **Movimentar** estoque: registrar entradas, saídas para unidades de saúde ou dispensações a pacientes
- **Buscar** por nome, lote, princípio ativo ou código de barras

### Tipos de movimentação
| Tipo | Quando usar |
|---|---|
| **Entrada** | Recebimento de medicamentos do fornecedor |
| **Saída** | Transferência para uma unidade de saúde (selecione a unidade destino) |
| **Dispensação** | Entrega direta ao paciente na farmácia |

> Toda movimentação exige um **documento de referência** (nota fiscal, requisição, receita) e fica registrada na trilha de auditoria.

### Alertas de estoque
- **Crítico** (vermelho): estoque atual ≤ 50% do mínimo cadastrado
- **Atenção** (laranja): estoque atual entre 50% e 100% do mínimo
- **Regular** (verde): estoque acima do mínimo

### Alertas de validade
- Medicamentos com validade em até **30 dias** aparecem em alerta na tela de estoque e no painel.

---

## 5. Módulo: Pedidos

**Acesso:** todos os perfis (aprovação apenas Gestor/Administrador)

### Fluxo de um pedido

```
Atendente/Farmacêutico           Gestor/Administrador
        │                                │
        ▼                                │
  [Novo pedido] ──── PENDENTE ────► Em análise
                                         │
                              ┌──────────┴───────────┐
                              │                       │
                           APROVADO               CANCELADO
                              │
                           ENVIADO (em entrega)
                              │
                          ENTREGUE ◄── registra recebimento
```

### Como criar um pedido
1. Clique em **Novo pedido** (painel ou módulo de Pedidos)
2. Selecione o medicamento, a quantidade solicitada e a previsão de entrega
3. Adicione uma justificativa (opcional)
4. Clique em Salvar

### Como avançar o status (Gestor/Administrador)
1. Na lista de pedidos, localize o pedido desejado
2. Clique no botão de avanço de status (seta) na coluna de Ações
3. Confirme a ação

---

## 6. Módulo: Cadastros (Fornecedores e Unidades)

**Acesso:** Administrador, Gestor

### Fornecedores
Empresas que fornecem medicamentos ao município. Cada fornecedor tem:
- CNPJ, cidade, UF
- Prazo de entrega em dias (usado para estimativas)

### Unidades de saúde
UBS, UPA, Hospitais e outras unidades da rede municipal. Cada unidade tem:
- Código, tipo, cidade, UF
- Nome do responsável

> As unidades cadastradas aparecem no **modal de movimentação** de estoque, permitindo registrar para qual unidade o medicamento foi enviado.

---

## 7. Módulo: Relatórios e análises

**Acesso:** Administrador, Gestor, Farmacêutico, Consultor

### Período de análise
Selecione o período no menu superior:
- Últimos 30 dias
- Último trimestre (90 dias)
- Este ano

### Gráfico de fluxo de estoque
Barras de entradas e saídas no período selecionado.

### Top medicamentos por movimentação
Ranking dos itens com maior volume de entradas, saídas e dispensações.

### Exportação de relatórios
| Botão | O que faz |
|---|---|
| **Visualizar PDF** | Abre o relatório em uma nova aba do navegador |
| **Exportar PDF** | Baixa o arquivo PDF no computador |
| **Exportar Excel** | Baixa a planilha `.xlsx` com todos os dados |

> Os relatórios exportados incluem o carimbo de **geração no horário de Brasília**.

### Relatório de auditoria (aba Histórico)
Registros de todas as ações do sistema. Permite filtrar por:
- Tipo de ação
- Módulo
- Usuário
- Período
- Status (sucesso ou falha)

Pode ser exportado como PDF ou CSV.

---

## 8. Módulo: Usuários, permissões e conformidade

**Acesso:** Administrador, Super Administrador

### Aba: Contas e aprovações
- Lista todos os usuários cadastrados
- Usuários **pendentes** (tarja laranja) precisam de aprovação
- É possível editar, inativar ou remover um usuário

> **Inativar um usuário:** o acesso é bloqueado imediatamente, o e-mail é liberado para outro cadastro, e toda a trilha de auditoria é preservada. O histórico de movimentações do usuário inativado não é excluído.

### Aba: Permissões
Permite configurar quais ações cada perfil de acesso pode realizar (por módulo e operação). Exceções individuais podem ser criadas para usuários específicos.

### Aba: Solicitações LGPD
Exibe as solicitações de titulares de dados (servidores usuários do sistema):
- **Acesso** — solicitação de relatório com dados pessoais
- **Correção** — solicitação de correção de dado incorreto
- **Eliminação** — solicitação de exclusão de dados

Cada solicitação tem prazo de **15 dias úteis** para resposta (art. 19, II, LGPD). Solicitações vencidas aparecem em destaque.

### Aba: Histórico
Trilha de auditoria completa do sistema.

---

## 9. Fluxo de trabalho típico por perfil

### Atendente / Dispensador
1. Acompanha o estoque no painel
2. Registra a **dispensação** ao entregar um medicamento ao paciente
3. Cria pedidos de reposição quando o estoque está baixo
4. Consulta o status dos pedidos

### Farmacêutico
1. Recebe medicamentos do fornecedor → registra **Entrada** no estoque
2. Distribui para unidades → registra **Saída** com a unidade destino
3. Monitora validades e alertas no painel
4. Gera relatórios de inventário

### Gestor
1. Acompanha os KPIs e estimativas no painel
2. Aprova ou cancela pedidos de reposição
3. Analisa relatórios de consumo e curva de estoque
4. Gerencia cadastros de fornecedores e unidades

### Administrador
1. Aprova novos usuários
2. Configura permissões por perfil
3. Atende solicitações LGPD
4. Verifica integridade da auditoria
5. Exporta relatórios oficiais

---

## 10. Perguntas frequentes

**Por que meu login está bloqueado?**  
Seu cadastro pode estar **Pendente** (aguardando aprovação do administrador) ou sua conta foi **inativada**. Entre em contato com o administrador do sistema.

**O que acontece após 5 tentativas de login incorretas?**  
O acesso fica bloqueado por 15 minutos automaticamente. Aguarde ou solicite ao administrador.

**Por que a sessão expira?**  
Por segurança, a sessão é encerrada após 8 horas de uso contínuo ou após inatividade. Faça o login novamente.

**Como altero minha senha?**  
Acesse o menu do seu perfil (canto superior direito, ícone com suas iniciais) → **Meu perfil** → altere a senha.

**Como exporto um relatório?**  
Acesse o módulo **Relatórios**, selecione o período desejado e clique em um dos botões de exportação (PDF ou Excel).

**O que é a "cobertura estimada"?**  
É uma estimativa de quantos dias o estoque atual vai durar, calculada dividindo o estoque atual pelo consumo médio diário dos últimos 30 dias. Requer histórico de movimentações registradas.

**Como registro a saída para uma unidade?**  
No módulo **Estoque**, clique em **Movimentar** no medicamento desejado → selecione o tipo **Saída** → escolha a unidade de destino na lista.

**Dados do sistema são públicos?**  
Não. O acesso é restrito a servidores autorizados. Os dados pessoais são tratados conforme a LGPD. Acesse **Aviso de privacidade** no menu do perfil para mais informações.

---

*Documento gerado em 12/11/2026 — versão 1.0*  
*S.A.M. — Sistema Municipal de Abastecimento da Farmácia Pública*
