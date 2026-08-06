export type PermissionKey = string;

export type PermissionDefinition = {
  chave: PermissionKey;
  modulo: string;
  acao: string;
  nome: string;
};

const actionLabels: Record<string, string> = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  movimentar: 'Movimentar',
  aprovar: 'Aprovar',
  entregar: 'Entregar',
  cancelar: 'Cancelar',
  desativar: 'Desativar',
  exportar: 'Exportar',
};

const moduleLabels: Record<string, string> = {
  dashboard: 'Visão geral',
  estoque: 'Estoque',
  pedidos: 'Pedidos',
  fornecedores: 'Fornecedores',
  unidades: 'Unidades de saúde',
  usuarios: 'Usuários',
  relatorios: 'Relatórios',
  auditoria: 'Auditoria',
  permissoes: 'Permissões',
};

const actionsByModule: Record<string, string[]> = {
  dashboard: ['visualizar'],
  estoque: ['visualizar', 'criar', 'editar', 'excluir', 'movimentar'],
  pedidos: ['visualizar', 'criar', 'editar', 'excluir', 'aprovar', 'entregar', 'cancelar'],
  fornecedores: ['visualizar', 'criar', 'editar', 'excluir'],
  unidades: ['visualizar', 'criar', 'editar', 'excluir'],
  usuarios: ['visualizar', 'criar', 'editar', 'aprovar', 'desativar', 'excluir'],
  relatorios: ['visualizar', 'exportar'],
  auditoria: ['visualizar', 'exportar'],
  permissoes: ['visualizar', 'editar'],
};

export const PERMISSION_CATALOG: PermissionDefinition[] = Object.entries(actionsByModule)
  .flatMap(([modulo, actions]) => actions.map((acao) => ({
    chave: `${modulo}.${acao}`,
    modulo,
    acao,
    nome: `${moduleLabels[modulo]} — ${actionLabels[acao]}`,
  })));

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  GESTOR: PERMISSION_CATALOG
    .filter(({ modulo, acao }) => ['dashboard', 'estoque', 'pedidos', 'relatorios'].includes(modulo)
      && !['excluir', 'editar'].includes(acao))
    .map(({ chave }) => chave),
  FARMACEUTICO: PERMISSION_CATALOG
    .filter(({ modulo, acao }) => ['dashboard', 'estoque', 'pedidos'].includes(modulo)
      && !['excluir', 'aprovar', 'cancelar'].includes(acao))
    .map(({ chave }) => chave),
  ATENDENTE: ['dashboard.visualizar', 'estoque.visualizar', 'estoque.movimentar', 'pedidos.visualizar', 'pedidos.criar'],
  CONSULTOR: ['dashboard.visualizar', 'estoque.visualizar', 'pedidos.visualizar', 'relatorios.visualizar', 'relatorios.exportar'],
};
