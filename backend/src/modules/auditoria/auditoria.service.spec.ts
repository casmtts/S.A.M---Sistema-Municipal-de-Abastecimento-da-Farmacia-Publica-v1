import { AuditoriaService } from './auditoria.service';
import { AuditoriaStatus } from './dto/auditoria-query.dto';

describe('AuditoriaService', () => {
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
