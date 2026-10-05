import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const { apiGet, apiPost, apiPatch } = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
vi.mock('../../src/services/api', () => ({
  default: { get: apiGet, post: apiPost, patch: apiPatch, delete: vi.fn() },
  getApiErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Falha genérica.',
}));

describe('App autenticação', () => {
  afterEach(cleanup);

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

    expect(await screen.findByRole('heading', { name: 'Olá, Admin' })).toBeTruthy();
    expect(apiPost).toHaveBeenCalledWith('/auth/login', { email: 'admin@example.gov', senha: 'strong-test-password' });
  });

  it('usa Escape para voltar pelas páginas visitadas', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('heading', { name: 'Olá, Admin' });

    fireEvent.click(screen.getByRole('button', { name: 'Estoque de Medicamentos' }));
    expect(await screen.findByRole('heading', { name: 'Estoque de medicamentos' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos da Rede' }));
    expect(await screen.findByRole('heading', { name: 'Pedidos da Rede Municipal' })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByRole('heading', { name: 'Estoque de medicamentos' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByRole('heading', { name: 'Olá, Admin' })).toBeTruthy();
  });

  it('abre os dados da conta e permite trocar a senha pelo perfil', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@example.gov' } });
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'strong-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('heading', { name: 'Olá, Admin' });
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
    await screen.findByRole('heading', { name: 'Olá, Admin' });
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

  it('impede enviar cadastro com senha menor que 12 caracteres', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ainda não tenho acesso — criar cadastro' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Pessoa de Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.gov' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Cargo / Atribuição' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Farmacêutico' }));
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'short123' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'short123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação de cadastro' }));

    expect(await screen.findByText('A senha deve ter pelo menos 12 caracteres.')).toBeTruthy();
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
    fireEvent.change(screen.getByLabelText('Senha de acesso'), { target: { value: 'senha-forte-123' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha-forte-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação de cadastro' }));

    expect(await screen.findByText('Cadastro enviado. Aguarde a aprovação do administrador geral para entrar.')).toBeTruthy();
    expect(apiPost).toHaveBeenCalledWith('/auth/register', {
      nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725', senha: 'senha-forte-123', cargo: 'Farmacêutico', telefone: undefined,
    });
  });

});
