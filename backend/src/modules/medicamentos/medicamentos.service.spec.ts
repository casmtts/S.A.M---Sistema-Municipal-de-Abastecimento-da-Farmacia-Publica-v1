import { ConflictException } from '@nestjs/common';
import { MedicamentosService } from './medicamentos.service';

describe('MedicamentosService', () => {
  it('evita inativar um lote se uma entrada concorrente já aumentou o saldo', async () => {
    const prisma: any = {
      medicamento: {
        findUnique: jest.fn().mockResolvedValue({ id: 'lot-1', ativo: true, quantidadeAtual: 0 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = new MedicamentosService(prisma);

    await expect(service.remove('lot-1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.medicamento.updateMany).toHaveBeenCalledWith({
      where: { id: 'lot-1', ativo: true, quantidadeAtual: 0 },
      data: { ativo: false },
    });
  });
});
