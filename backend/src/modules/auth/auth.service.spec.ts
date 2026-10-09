import { AuthService } from './auth.service';

describe('AuthService session lifecycle', () => {
  it('permite que um super admin atualize somente os dados do próprio perfil e audita os campos', async () => {
    const atual = { id: 'user-1', nome: 'Admin', email: 'admin@example.gov', cpf: '52998224725', telefone: null, cargo: 'Gestor', role: 'SUPER_ADMIN', ativo: true };
    const tx = { usuario: { update: jest.fn().mockResolvedValue({ ...atual, nome: 'Admin corrigido' }) } };
    const prisma = {
      usuario: { findUnique: jest.fn().mockResolvedValue(atual), findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as any, {} as any, auditoria as any);

    await service.atualizarPerfil('user-1', { nome: 'Admin corrigido' }, { requestId: 'request-1' });

    expect(tx.usuario.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' }, data: { nome: 'Admin corrigido' } }));
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ acao: 'PERFIL_ATUALIZADO', dadosDepois: { camposAtualizados: ['nome'] } }), tx);
  });

  it('permite que um usuário comum atualize apenas o próprio perfil', async () => {
    const atual = { id: 'user-1', nome: 'Atendente', email: 'atendente@example.gov', cpf: '52998224725', telefone: null, cargo: 'Atendente', role: 'ATENDENTE', ativo: true };
    const tx = { usuario: { update: jest.fn().mockResolvedValue({ ...atual, nome: 'Nome alterado' }) } };
    const prisma = {
      usuario: { findUnique: jest.fn().mockResolvedValue(atual), findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as any, {} as any, auditoria as any);

    await service.atualizarPerfil('user-1', { nome: 'Nome alterado' });

    expect(tx.usuario.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' }, data: { nome: 'Nome alterado' } }));
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 'user-1', acao: 'PERFIL_ATUALIZADO' }), tx);
  });

  it('revoga sessões no mesmo commit que registra logout', async () => {
    const tx = { usuario: { update: jest.fn().mockResolvedValue({}) } };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as any, {} as any, auditoria as any);

    await service.logout('user-1', { ip: '127.0.0.1', userAgent: 'browser', requestId: 'request-1' });

    expect(tx.usuario.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { tokenVersion: { increment: 1 } } });
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 'user-1', acao: 'LOGOUT' }), tx);
  });

  it('trata ausência de cookie como sessão anônima sem consultar o banco', async () => {
    const prisma = { usuario: { findUnique: jest.fn() } };
    const jwt = { verifyAsync: jest.fn() };
    const service = new AuthService(prisma as any, jwt as any, {} as any);

    await expect(service.obterSessao()).resolves.toEqual({ usuario: null });
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('trata token inválido como sessão anônima', async () => {
    const prisma = { usuario: { findUnique: jest.fn() } };
    const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')) };
    const service = new AuthService(prisma as any, jwt as any, {} as any);

    await expect(service.obterSessao('invalid-cookie')).resolves.toEqual({ usuario: null });
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('só restaura sessão ativa com a mesma versão de token', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', tokenVersion: 3 }) };
    const usuario = { id: 'user-1', nome: 'Operador', email: 'operador@example.gov', role: 'ATENDENTE', cargo: 'Atendente de Farmácia', ativo: true, tokenVersion: 3 };
    const prisma = { usuario: { findUnique: jest.fn().mockResolvedValue(usuario) } };
    const service = new AuthService(prisma as any, jwt as any, {} as any);

    await expect(service.obterSessao('valid-cookie')).resolves.toEqual({
      usuario: { id: 'user-1', nome: 'Operador', email: 'operador@example.gov', role: 'ATENDENTE', cargo: 'Atendente de Farmácia' },
    });
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, nome: true, email: true, role: true, cargo: true, ativo: true, tokenVersion: true },
    });
  });

  it('não restaura sessão revogada ou desativada', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', tokenVersion: 2 }) };
    const prisma = { usuario: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', ativo: true, tokenVersion: 3 }) } };
    const service = new AuthService(prisma as any, jwt as any, {} as any);

    await expect(service.obterSessao('old-cookie')).resolves.toEqual({ usuario: null });
  });
});
