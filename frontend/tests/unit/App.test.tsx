import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const { apiGet, apiPost, apiPatch } = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
vi.mock('../../src/services/api', () => ({
  default: { get: apiGet, post: apiPost, patch: apiPatch, delete: vi.fn() },
  getApiErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Falha genérica.',
}));

describe('App autenticação', () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  beforeEach(() => {
    apiPatch.mockResolvedValue({ data: { message: 'Senha alterada com sucesso.' } });
    let authenticated = false;
    apiGet.mockImplementation((path: string) => path === '/auth/session'
      ? Promise.resolve({ data: { usuario: authenticated ? { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } })
      : Promise.resolve({ data: [] }));
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: { usuario: { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } } });
    });
  });

  it('entra e mostra o painel após autenticação', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(/Olá, Admin/)).toBeTruthy();
    expect(apiPost).toHaveBeenCalledWith('/auth/login', { email: 'admin@example.gov', senha: 'strong-test-password' });
  });

  it('abre a lista ao clicar em notificações e navega para o pedido selecionado', async () => {
    let authenticated = false;
    apiGet.mockImplementation((path: string) => {
      if (path === '/auth/session') return Promise.resolve({ data: { usuario: authenticated ? { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } });
      if (path === '/pedidos') return Promise.resolve({ data: [{ id: 'pedido-123', status: 'PENDENTE', solicitante: { nome: 'UBS Jardim das Flores' }, medicamento: { nome: 'Dipirona 500 mg' }, quantidadeSolicitada: 20, dataSolicitacao: '2026-10-09' }] });
      return Promise.resolve({ data: [] });
    });
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: {} });
    });

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);

    fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 1 não lida' }));
    await waitFor(() => expect(document.querySelector('.topbar button[aria-label^="Notificações"]')?.getAttribute('aria-label')).toBe('Notificações: 0 não lidas'));
    const notification = await screen.findByRole('menuitem', { name: /UBS Jardim das Flores/ });
    expect(notification.textContent).toContain('Dipirona 500 mg');
    fireEvent.click(notification);

    expect(await screen.findByRole('heading', { name: 'Pedidos da Rede Municipal' })).toBeTruthy();
  });

  it('mostra todas as pendências operacionais e abre a fila de privacidade', async () => {
    let authenticated = false;
    apiGet.mockImplementation((path: string) => {
      if (path === '/auth/session') return Promise.resolve({ data: { usuario: authenticated ? { id: 'admin', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } });
      if (path === '/medicamentos') return Promise.resolve({ data: [
        { id: 'low-stock', nome: 'Estoque Baixo', quantidadeAtual: 2, quantidadeMinima: 10, quantidadeMaxima: 100, validade: '2027-01-01', lote: 'L-01' },
        { id: 'near-expiry', nome: 'Lote a Vencer', quantidadeAtual: 20, quantidadeMinima: 10, quantidadeMaxima: 100, validade: '2026-10-15', lote: 'L-02' },
      ] });
      if (path === '/pedidos') return Promise.resolve({ data: [{ id: 'pedido-123', status: 'EM_ANALISE', solicitante: { nome: 'UBS Central' }, medicamento: { nome: 'Dipirona' }, quantidadeSolicitada: 5 }] });
      if (path === '/usuarios') return Promise.resolve({ data: [{ id: 'user-pendente', nome: 'Servidor Pendente', email: 'servidor@example.gov', role: 'ATENDENTE', ativo: false }] });
      if (path === '/privacidade/solicitacoes/todas') return Promise.resolve({ data: [{ id: 'privacy-1', tipo: 'ACESSO', status: 'ABERTA', createdAt: '2026-10-09T12:00:00.000Z', usuario: { nome: 'Pessoa Solicitante', email: 'pessoa@example.gov' } }] });
      return Promise.resolve({ data: [] });
    });
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: {} });
    });

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);

    fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 5 não lidas' }));
    await waitFor(() => expect(document.querySelector('.topbar button[aria-label^="Notificações"]')?.getAttribute('aria-label')).toBe('Notificações: 0 não lidas'));
    expect(await screen.findByRole('menuitem', { name: /Estoque Baixo/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /Lote a Vencer/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /UBS Central/ })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: /Servidor Pendente/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: /Solicitação LGPD · Pessoa Solicitante/ }));

    expect(await screen.findByRole('heading', { name: 'Solicitações de privacidade' })).toBeTruthy();
    expect(screen.getByText('Pessoa Solicitante')).toBeTruthy();
  });

  it('organiza contas, fila de aprovação e funções e filtra pendentes', async () => {
    let authenticated = false;
    apiGet.mockImplementation((path: string) => {
      if (path === '/auth/session') return Promise.resolve({ data: { usuario: authenticated ? { id: 'admin', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } });
      if (path === '/usuarios') return Promise.resolve({ data: [
        { id: 'pending-user', nome: 'Servidor Pendente', email: 'pendente@example.gov', role: 'ATENDENTE', ativo: false, cargo: 'Atendente' },
        { id: 'active-user', nome: 'Servidor Ativo', email: 'ativo@example.gov', role: 'FARMACEUTICO', ativo: true, cargo: 'Farmacêutico' },
      ] });
      return Promise.resolve({ data: [] });
    });
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: {} });
    });

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);
    fireEvent.click(screen.getByRole('button', { name: 'Usuários & Permissões' }));

    expect(await screen.findByRole('heading', { name: 'Usuários cadastrados' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Aprovações' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Funções de acesso' })).toBeTruthy();
    fireEvent.click(screen.getByRole('group', { name: 'Filtrar contas por status' }).querySelectorAll('button')[2]);

    expect(screen.getByText('pendente@example.gov')).toBeTruthy();
    expect(screen.queryByText('ativo@example.gov')).toBeNull();
  });

  it('organiza exceções individuais por módulo e mostra acesso herdado e efetivo', async () => {
    let authenticated = false;
    apiGet.mockImplementation((path: string) => {
      if (path === '/auth/session') return Promise.resolve({ data: { usuario: authenticated ? { id: 'admin', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } });
      if (path === '/usuarios') return Promise.resolve({ data: [{ id: 'managed-user', nome: 'Gestor da UBS', email: 'gestor@example.gov', role: 'GESTOR', ativo: true, cargo: 'Gestor' }] });
      if (path === '/permissoes/usuarios/managed-user') return Promise.resolve({ data: {
        usuario: { id: 'managed-user', nome: 'Gestor da UBS', email: 'gestor@example.gov', role: 'GESTOR' },
        permissoes: [
          { chave: 'estoque.visualizar', modulo: 'estoque', acao: 'visualizar', nome: 'Visualizar estoque', permitido: true },
          { chave: 'estoque.editar', modulo: 'estoque', acao: 'editar', nome: 'Editar estoque', permitido: true },
          { chave: 'pedidos.aprovar', modulo: 'pedidos', acao: 'aprovar', nome: 'Aprovar pedidos', permitido: false },
        ],
        excecoes: [{ chave: 'estoque.editar', permitido: false }],
      } });
      return Promise.resolve({ data: [] });
    });
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: {} });
    });

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);
    fireEvent.click(screen.getByRole('button', { name: 'Usuários & Permissões' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Gerenciar permissões' }));

    expect(await screen.findByRole('heading', { name: 'Exceções de permissões' })).toBeTruthy();
    expect(screen.getAllByText('Gestor da UBS').length).toBeGreaterThan(0);
    expect(screen.getByText('Estoque')).toBeTruthy();
    expect(screen.getByText('Pedidos')).toBeTruthy();
    expect(screen.getByText('Exceções ativas')).toBeTruthy();
    expect(screen.getAllByText('Bloqueado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Permitido').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar permissão' }), { target: { value: 'Aprovar pedidos' } });
    expect(screen.getByText('Aprovar pedidos')).toBeTruthy();
    expect(screen.queryByText('Visualizar estoque')).toBeNull();
  });

  it('usa Escape para voltar pelas páginas visitadas', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);

    fireEvent.click(screen.getByRole('button', { name: 'Estoque de Medicamentos' }));
    expect(await screen.findByRole('heading', { name: 'Estoque de medicamentos' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos da Rede' }));
    expect(await screen.findByRole('heading', { name: 'Pedidos da Rede Municipal' })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByRole('heading', { name: 'Estoque de medicamentos' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByText(/Olá, Admin/)).toBeTruthy();
  });

  it('abre os dados da conta e permite trocar a senha pelo perfil', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu do perfil' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Meu perfil' }));

    expect(await screen.findByRole('heading', { name: 'Meu perfil' })).toBeTruthy();
    expect(screen.getByText('admin@example.gov')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'old-password-123' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'new-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'new-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));

    expect(await screen.findByText('Senha alterada com sucesso.')).toBeTruthy();
    expect(apiPatch).toHaveBeenCalledWith('/auth/password', { senhaAtual: 'old-password-123', novaSenha: 'new-password-123', confirmarSenha: 'new-password-123' });
  });

  it('permite que Admin corrija o próprio cadastro sem abrir solicitação', async () => {
    const originalGet = apiGet.getMockImplementation();
    apiGet.mockImplementation((path: string) => path === '/auth/me'
      ? Promise.resolve({ data: { usuario: { id: 'user-1', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN', cpf: '52998224725', telefone: '', cargo: 'Gestor' } } })
      : originalGet!(path));
    apiPatch.mockResolvedValue({ data: { usuario: { id: 'user-1', nome: 'Admin Atualizado', email: 'admin@example.gov', role: 'ADMIN', cpf: '52998224725', telefone: '11987654321', cargo: 'Gestor' } } });

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu do perfil' }));
    expect(screen.queryByRole('menuitem', { name: 'Solicitar correção' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Meu perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Editar meus dados' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Nome completo' }), { target: { value: 'Admin Atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados do perfil atualizados.')).toBeTruthy();
    expect(apiPatch).toHaveBeenCalledWith('/auth/profile', expect.objectContaining({ nome: 'Admin Atualizado', email: 'admin@example.gov', cpf: '52998224725' }));
  });

  it('usa seletores para função de acesso e cargo no cadastro administrativo', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Usuários & Permissões' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar usuário' }));

    expect(screen.getByRole('combobox', { name: 'Função de acesso' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Cargo / atribuição' })).toBeTruthy();
  });

  it('impede enviar cadastro com senha menor que 6 caracteres', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ainda não tenho acesso — criar cadastro' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Pessoa de Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.gov' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Cargo / Atribuição' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Farmacêutico' }));
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação de cadastro' }));

    expect(await screen.findByText('A senha deve ter pelo menos 6 caracteres.')).toBeTruthy();
    expect(apiPost).not.toHaveBeenCalledWith('/auth/register', expect.anything());
  });

  it('envia solicitação de cadastro com o cargo selecionado', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ainda não tenho acesso — criar cadastro' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Pessoa de Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.gov' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Cargo / Atribuição' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Farmacêutico' }));
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'senha6' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação de cadastro' }));

    expect(await screen.findByText('Cadastro enviado. Aguarde a aprovação do administrador geral para entrar.')).toBeTruthy();
    expect(apiPost).toHaveBeenCalledWith('/auth/register', {
      nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725', senha: 'senha6', cargo: 'Farmacêutico', telefone: undefined,
    });
  });

  it('usa seletores de UF e município nos cadastros da rede', async () => {
    let authenticated = false;
    apiGet.mockImplementation((path: string) => path === '/auth/session'
      ? Promise.resolve({ data: { usuario: authenticated ? { id: 'admin', nome: 'Admin de Teste', email: 'admin@example.gov', role: 'ADMIN' } : null } })
      : Promise.resolve({ data: [] }));
    apiPost.mockImplementation((path: string) => {
      if (path === '/auth/login') authenticated = true;
      return Promise.resolve({ data: {} });
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ nome: 'Campo Grande' }] }));

    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Olá, Admin/);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastros / Fornecedores' }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Adicionar fornecedor' }))[0]);

    const stateSelector = screen.getByRole('combobox', { name: 'UF' });
    expect(screen.getByRole('combobox', { name: 'Cidade' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Cidade' })).toBeNull();
    fireEvent.mouseDown(stateSelector);
    fireEvent.click(await screen.findByRole('option', { name: 'MS — Mato Grosso do Sul' }));

    const citySelector = screen.getByRole('combobox', { name: 'Cidade' });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.mouseDown(citySelector);
    fireEvent.click(await screen.findByRole('option', { name: 'Campo Grande' }));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/estados/MS/municipios'), expect.anything());

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: /Unidades de saúde \/ UBS \/ UPAs/ }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Adicionar unidade' }))[0]);
    expect(screen.getByLabelText('Responsável da unidade')).toBeTruthy();
  });

});
