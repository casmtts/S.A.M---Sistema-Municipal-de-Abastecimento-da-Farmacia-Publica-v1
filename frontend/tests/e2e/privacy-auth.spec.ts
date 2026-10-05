import { expect, test, type Route } from '@playwright/test';

const corsHeaders = { 'access-control-allow-origin': 'http://localhost:3000', 'access-control-allow-credentials': 'true' };
const fulfillJson = (route: Route, status: number, json: unknown, headers: Record<string, string> = {}) => route.fulfill({ status, headers: { ...corsHeaders, ...headers }, json });

test('login usa cookie HttpOnly e abre o painel', async ({ page, context }) => {
  const apiCalls: { path: string; method: string; cookie?: string }[] = [];
  let authenticated = false;
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '3001') return route.continue();
    const path = url.pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...corsHeaders, 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' } });
    apiCalls.push({ path, method: request.method(), cookie: request.headers()['cookie'] });
    if (path === '/auth/session') return fulfillJson(route, 200, { usuario: authenticated ? { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null });
    if (path === '/auth/login') { authenticated = true; return fulfillJson(route, 200,
      { usuario: { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } },
      { 'set-cookie': 'sam_session=test-session; HttpOnly; Path=/; SameSite=Strict' },
    ); }
    if (path === '/permissoes/minhas') return fulfillJson(route, 200, []);
    if (path === '/medicamentos' || path === '/pedidos' || path === '/fornecedores' || path === '/unidades-saude' || path === '/usuarios') return fulfillJson(route, 200, []);
    if (path === '/auth/logout') return fulfillJson(route, 200, { message: 'ok' }, { 'set-cookie': 'sam_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict' });
    return fulfillJson(route, 200, []);
  });

  await page.goto('/');
  await page.getByLabel('E-mail').fill('admin@example.gov');
  await page.locator('input[type="password"]').first().fill('correct-test-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'Olá, Admin' })).toBeVisible();
  expect(apiCalls.filter(({ path }) => path === '/auth/session')).toHaveLength(2);
  expect(apiCalls.some(({ path }) => path === '/auth/me')).toBe(false);
  const sessionCookie = (await context.cookies('http://localhost:3001')).find(({ name }) => name === 'sam_session');
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(apiCalls.some(({ path, cookie }) => path === '/medicamentos' && cookie?.includes('sam_session=test-session'))).toBe(true);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test('não libera chamadas protegidas quando o navegador não recebe o cookie', async ({ page }) => {
  const apiCalls: string[] = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '3001') return route.continue();
    const path = url.pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...corsHeaders, 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' } });
    apiCalls.push(path);
    if (path === '/auth/session') return fulfillJson(route, 200, { usuario: null });
    if (path === '/auth/login') return fulfillJson(route, 200, { usuario: { id: 'user-1', nome: 'Admin de Teste', role: 'ADMIN' } });
    return fulfillJson(route, 200, []);
  });

  await page.goto('/');
  await page.getByLabel('E-mail').fill('admin@example.gov');
  await page.locator('input[type="password"]').first().fill('correct-test-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Não foi possível iniciar a sessão. Verifique se o navegador aceitou o cookie e tente novamente.')).toBeVisible();
  expect(apiCalls).not.toContain('/medicamentos');
  expect(apiCalls).not.toContain('/pedidos');
  expect(apiCalls).not.toContain('/permissoes/minhas');
});

test('usuário solicita correção pelo menu e encerra a sessão', async ({ page, context }) => {
  const requested: any[] = [];
  const profile = { id: 'user-1', nome: 'Servidor de Teste', email: 'servidor@example.gov', role: 'ATENDENTE', ativo: true, cpf: '52998224725', telefone: '', cargo: 'Atendente' };
  let updatedProfile: any;
  let authenticated = false;
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '3001') return route.continue();
    const path = url.pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...corsHeaders, 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' } });
    if (path === '/auth/session') return fulfillJson(route, 200, { usuario: authenticated ? profile : null });
    if (path === '/auth/login') { authenticated = true; return fulfillJson(route, 200, { usuario: profile }, { 'set-cookie': 'sam_session=test-session; HttpOnly; Path=/; SameSite=Strict' }); }
    if (path === '/auth/me') return fulfillJson(route, 200, { usuario: updatedProfile ? { ...profile, ...updatedProfile } : profile });
    if (path === '/auth/profile' && request.method() === 'PATCH') { updatedProfile = request.postDataJSON(); return fulfillJson(route, 200, { usuario: { ...profile, ...updatedProfile } }); }
    if (path === '/privacidade/solicitacoes' && request.method() === 'POST') { requested.push(request.postDataJSON()); return fulfillJson(route, 201, { id: 'privacy-1', status: 'ABERTA' }); }
    if (path === '/auth/logout') { authenticated = false; return fulfillJson(route, 200, { message: 'ok' }, { 'set-cookie': 'sam_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict' }); }
    if (path === '/permissoes/minhas') return fulfillJson(route, 200, []);
    if (['/medicamentos', '/pedidos', '/fornecedores', '/unidades-saude', '/usuarios'].includes(path)) return fulfillJson(route, 200, []);
    return fulfillJson(route, 200, []);
  });
  page.on('dialog', (dialog) => dialog.accept('Atualizar meu telefone'));

  await page.goto('/');
  await page.getByLabel('E-mail').fill('servidor@example.gov');
  await page.locator('input[type="password"]').first().fill('correct-test-password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Servidor' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible();
  await expect(page.getByText('servidor@example.gov')).toBeVisible();
  await page.getByRole('button', { name: 'Editar meus dados' }).click();
  await page.getByLabel('Nome completo').fill('Servidor Atualizado');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Dados do perfil atualizados.')).toBeVisible();
  expect(updatedProfile).toMatchObject({ nome: 'Servidor Atualizado', email: profile.email, cpf: profile.cpf });
  await page.getByRole('button', { name: 'Fechar' }).click();
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Solicitar correção' }).click();
  await expect.poll(() => requested.length).toBe(1);
  expect(requested[0]).toEqual({ tipo: 'CORRECAO', descricao: 'Atualizar meu telefone' });
  await expect(page.getByText('Solicitação registrada para análise do administrador.')).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  expect((await context.cookies('http://localhost:3001')).some(({ name }) => name === 'sam_session')).toBe(false);
});

test('administrador corrige o próprio cadastro diretamente pelo perfil', async ({ page }) => {
  let authenticated = false;
  let updatedProfile: any;
  const profile = { id: 'admin-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'SUPER_ADMIN', ativo: true, cpf: '52998224725', telefone: '', cargo: 'Administrador da rede' };
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '3001') return route.continue();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...corsHeaders, 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' } });
    if (url.pathname === '/auth/session') return fulfillJson(route, 200, { usuario: authenticated ? profile : null });
    if (url.pathname === '/auth/login') { authenticated = true; return fulfillJson(route, 200, { usuario: profile }, { 'set-cookie': 'sam_session=admin-session; HttpOnly; Path=/; SameSite=Strict' }); }
    if (url.pathname === '/auth/me') return fulfillJson(route, 200, { usuario: profile });
    if (url.pathname === '/auth/profile' && request.method() === 'PATCH') { updatedProfile = request.postDataJSON(); return fulfillJson(route, 200, { usuario: { ...profile, ...updatedProfile } }); }
    if (url.pathname === '/permissoes/minhas') return fulfillJson(route, 200, []);
    return fulfillJson(route, 200, []);
  });

  await page.goto('/');
  await page.getByLabel('E-mail').fill(profile.email);
  await page.locator('input[type="password"]').first().fill('correct-test-password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Admin' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await expect(page.getByRole('menuitem', { name: 'Solicitar correção' })).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
  await page.getByRole('button', { name: 'Editar meus dados' }).click();
  await page.getByLabel('Nome completo').fill('Admin Atualizado');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Dados do perfil atualizados.')).toBeVisible();
  expect(updatedProfile).toMatchObject({ nome: 'Admin Atualizado', email: profile.email, cpf: profile.cpf });
});
