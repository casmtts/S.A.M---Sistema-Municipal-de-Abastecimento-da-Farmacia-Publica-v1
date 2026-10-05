import { AuditoriaService } from './auditoria.service';
import { AuditoriaStatus } from './dto/auditoria-query.dto';
import { createHmac } from 'crypto';

describe('AuditoriaService', () => {
  it('persiste auditoria sem identificadores diretos e preserva apenas o IP com HMAC', async () => {
    const create = jest.fn().mockResolvedValue({});
    const transaction = { logAuditoria: { create } };
    const service = new AuditoriaService({ logAuditoria: { create }, $transaction: jest.fn((callback) => callback(transaction)) } as any);
    const oldJwt = process.env.JWT_SECRET;
    const oldAuditSecret = process.env.AUDIT_IDENTIFIER_SECRET;
    process.env.JWT_SECRET = 'a-test-secret-that-is-long-enough';
    process.env.AUDIT_IDENTIFIER_SECRET = 'a-different-test-secret-long-enough';

    await service.registrar({
      usuarioId: 'user-12345678', acao: 'USUARIO_EDITADO', modulo: 'usuarios', descricao: 'Registro alterado',
      ip: '192.0.2.5', userAgent: 'browser', dadosAntes: { nome: 'Nome privado', cpf: '52998224725' },
      dadosDepois: { email: 'person@example.gov', telefone: '11999999999', ativo: true },
    });

    const data = create.mock.calls[0][0].data;
    expect(data.usuarioNome).toBe('Conta user-123');
    expect(data.usuarioEmail).toBeUndefined();
    expect(data.ip).toBe(createHmac('sha256', process.env.AUDIT_IDENTIFIER_SECRET).update('192.0.2.5').digest('hex'));
    expect(data.userAgent).toBeUndefined();
    expect(data.dadosAntes).toEqual({});
    expect(data.dadosDepois).toEqual({ ativo: true });

    if (oldJwt === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldJwt;
    if (oldAuditSecret === undefined) delete process.env.AUDIT_IDENTIFIER_SECRET;
    else process.env.AUDIT_IDENTIFIER_SECRET = oldAuditSecret;
  });

  it('monta opções distintas para os filtros do histórico', async () => {
    const prisma = {
      logAuditoria: {
        findMany: jest.fn()
          .mockResolvedValueOnce([{ acao: 'LOGIN_SUCESSO' }, { acao: 'USUARIO_CRIADO' }])
          .mockResolvedValueOnce([{ modulo: 'auth' }])
          .mockResolvedValueOnce([{ recurso: 'Usuario' }, { recurso: null }])
          .mockResolvedValueOnce([{ usuarioId: 'id-1', usuarioNome: 'Admin', usuarioEmail: 'admin@sam.local' }]),
      },
    };
    const service = new AuditoriaService(prisma as any);

    await expect(service.opcoes()).resolves.toEqual({
      acoes: ['LOGIN_SUCESSO', 'USUARIO_CRIADO'],
      modulos: ['auth'],
      recursos: ['Usuario'],
      usuarios: [{ id: 'id-1', nome: 'Admin', email: 'admin@sam.local' }],
      status: [
        { valor: AuditoriaStatus.SUCESSO, nome: 'Sucesso' },
        { valor: AuditoriaStatus.FALHA, nome: 'Falha' },
      ],
    });
  });

  it('converte o status do filtro em sucesso booleano', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      logAuditoria: { findMany, count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn().mockImplementation((queries) => Promise.all(queries)),
    };
    const service = new AuditoriaService(prisma as any);

    await service.listar({ status: AuditoriaStatus.FALHA, page: '1', limit: '20' });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ sucesso: false }) }));
  });
});
