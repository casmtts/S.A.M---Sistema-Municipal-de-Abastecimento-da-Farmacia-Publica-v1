import { expect, test, type Route } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-origin': 'http://localhost:3000',
  'access-control-allow-credentials': 'true',
};

const users = [
  { id: 'pending-user', nome: 'Servidor Pendente', email: 'pendente@example.gov', role: 'ATENDENTE', ativo: false, cargo: 'Atendente' },
  { id: 'active-user', nome: 'Servidor Ativo', email: 'ativo@example.gov', role: 'FARMACEUTICO', ativo: true, cargo: 'Farmacêutico' },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '3001') return route.continue();

    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...corsHeaders, 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' } });
    }

    const path = url.pathname;
    if (path === '/auth/session') return fulfillJson(route, 200, { usuario: { id: 'admin', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } });
    if (path === '/permissoes/minhas') return fulfillJson(route, 200, []);
    if (path === '/usuarios') return fulfillJson(route, 200, users);
    if (['/medicamentos', '/pedidos', '/fornecedores', '/unidades-saude', '/movimentacoes'].includes(path)) return fulfillJson(route, 200, []);
    return fulfillJson(route, 200, []);
  });

  await page.goto('/');
  await expect(page.getByText(/^Olá, Admin/)).toBeVisible();
  await page.getByRole('button', { name: 'Usuários & Permissões' }).click();
  await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toBeVisible();
});

test('cada ação por ícone mostra sua descrição ao passar o mouse', async ({ page }) => {
  const pendingUserRow = page.getByRole('row').filter({ hasText: 'Servidor Pendente' });
  const actions = pendingUserRow.locator('.user-row-actions button');
  const expectedTitles = ['Aprovar cadastro', 'Editar usuário', 'Gerenciar permissões', 'Excluir usuário'];

  for (const [index, title] of expectedTitles.entries()) {
    await actions.nth(index).hover();
    await expect(page.getByRole('tooltip').filter({ hasText: title })).toBeVisible();
  }

  const activeUserRow = page.getByRole('row').filter({ hasText: 'Servidor Ativo' });
  await activeUserRow.locator('.user-row-actions > span[tabindex="0"]').first().hover();
  await expect(page.getByRole('tooltip').filter({ hasText: 'Cadastro já aprovado' })).toBeVisible();
});

test('tooltips também aparecem quando ações recebem foco pelo teclado', async ({ page }) => {
  const pendingUserRow = page.getByRole('row').filter({ hasText: 'Servidor Pendente' });
  const approveButton = pendingUserRow.getByRole('button', { name: 'Aprovar cadastro' });
  const editButton = pendingUserRow.getByRole('button', { name: 'Editar usuário' });
  await approveButton.focus();
  await page.keyboard.press('Tab');
  await expect(editButton).toBeFocused();
  await expect(page.getByRole('tooltip', { name: 'Editar usuário' })).toBeVisible();

  const activeUserRow = page.getByRole('row').filter({ hasText: 'Servidor Ativo' });
  await pendingUserRow.getByRole('button', { name: 'Excluir usuário' }).focus();
  await page.keyboard.press('Tab');
  await expect(activeUserRow.locator('.user-row-actions > span[tabindex="0"]').first()).toBeFocused();
  await expect(page.getByRole('tooltip', { name: 'Cadastro já aprovado' })).toBeVisible();
});

test('páginas operacionais mantêm as seções de referência do Stitch sem rolagem horizontal global', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByText(/^Olá, Admin/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pedidos recentes' })).toBeVisible();

  await page.getByRole('button', { name: 'Pedidos da Rede' }).click();
  await expect(page.getByRole('heading', { name: 'Pedidos da Rede Municipal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fluxo de distribuição da rede' })).toBeVisible();

  await page.getByRole('button', { name: 'Cadastros / Fornecedores' }).click();
  await expect(page.getByRole('heading', { name: 'Fornecedores & Unidades de Saúde' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Documentação dos fornecedores' })).toBeVisible();

  await page.getByRole('button', { name: 'Relatórios & Análises' }).click();
  await expect(page.getByRole('heading', { name: 'Relatórios e análises' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fluxo de estoque' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

function fulfillJson(route: Route, status: number, json: unknown) {
  return route.fulfill({ status, headers: corsHeaders, json });
}
