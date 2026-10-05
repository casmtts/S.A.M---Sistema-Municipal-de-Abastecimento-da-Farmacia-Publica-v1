import { PrivacidadeService } from './privacidade.service';

describe('PrivacidadeService', () => {
  it('registra a solicitação e a auditoria na mesma transação', async () => {
    const pedido = { id: 'request-1', usuarioId: 'user-1', tipo: 'ACESSO' };
    const tx = { solicitacaoPrivacidade: { create: jest.fn().mockResolvedValue(pedido) } };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new PrivacidadeService(prisma as any, auditoria as any);

    await expect(service.solicitar('user-1', { tipo: 'ACESSO', descricao: '  ' } as any, 'request-id')).resolves.toBe(pedido);

    expect(tx.solicitacaoPrivacidade.create).toHaveBeenCalledWith({ data: { usuarioId: 'user-1', tipo: 'ACESSO', descricao: null } });
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 'user-1', acao: 'DIREITO_PRIVACIDADE_SOLICITADO' }), tx);
  });

  it('exige pedido de eliminação concluído antes da pseudonimização', async () => {
    const tx = {
      usuario: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', role: 'ATENDENTE' }) },
      solicitacaoPrivacidade: { findFirst: jest.fn().mockResolvedValue({ status: 'EM_ANALISE' }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new PrivacidadeService(prisma as any, { registrar: jest.fn() } as any);

    await expect(service.pseudonimizar('user-1', 'admin-1')).rejects.toThrow('Conclua e avalie a solicitação de eliminação');
    expect((tx.usuario as any).update).toBeUndefined();
  });

  it('pseudonimiza o cadastro e nomes operacionais e invalida sessões', async () => {
    const tx = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-1', role: 'ATENDENTE' }),
        update: jest.fn().mockResolvedValue({ id: 'user-1', ativo: false }),
      },
      solicitacaoPrivacidade: {
        findFirst: jest.fn().mockResolvedValue({ status: 'CONCLUIDA' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      movimentacao: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new PrivacidadeService(prisma as any, auditoria as any);

    await service.pseudonimizar('user-1', 'admin-1', 'request-id');

    expect(tx.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({ ativo: false, tokenVersion: { increment: 1 }, telefone: null, cargo: null }),
    }));
    expect(tx.movimentacao.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { responsavelId: 'user-1' } }));
    expect(tx.solicitacaoPrivacidade.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { usuarioId: 'user-1' }, data: { descricao: null, resposta: null } }));
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 'admin-1', acao: 'DADOS_PESSOAIS_PSEUDONIMIZADOS' }), tx);
  });
});
