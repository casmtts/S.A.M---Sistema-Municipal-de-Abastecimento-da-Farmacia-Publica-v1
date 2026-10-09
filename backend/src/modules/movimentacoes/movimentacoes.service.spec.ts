import { BadRequestException, ConflictException } from '@nestjs/common';
import { MovimentacoesService } from './movimentacoes.service';

describe('MovimentacoesService', () => {
  it('não registra dispensação como saída genérica', async () => {
    const prisma: any = {
      medicamento: { findUnique: jest.fn().mockResolvedValue({ id: 'medicine-1', nome: 'Medicamento', ativo: true, quantidadeAtual: 10 }) },
      $transaction: jest.fn(),
    };
    const service = new MovimentacoesService(prisma);

    await expect(service.create({ medicamentoId: 'medicine-1', tipo: 'DISPENSA', quantidade: 1 } as any, 'user-1', 'Atendente'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('impede saldo negativo concorrente e não cria movimento sem baixa', async () => {
    const tx: any = {
      medicamento: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      movimentacao: { create: jest.fn() },
    };
    const prisma: any = {
      medicamento: { findUnique: jest.fn().mockResolvedValue({ id: 'medicine-1', nome: 'Medicamento', ativo: true, quantidadeAtual: 5 }) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new MovimentacoesService(prisma);

    await expect(service.create({ medicamentoId: 'medicine-1', tipo: 'SAIDA', quantidade: 5 } as any, 'user-1', 'Atendente'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.movimentacao.create).not.toHaveBeenCalled();
  });

  it('não permite apagar uma movimentação histórica', async () => {
    const prisma: any = {
      movimentacao: { findUnique: jest.fn().mockResolvedValue({ id: 'movement-1' }), delete: jest.fn() },
    };
    const service = new MovimentacoesService(prisma);

    await expect(service.remove('movement-1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.movimentacao.delete).not.toHaveBeenCalled();
  });
});
