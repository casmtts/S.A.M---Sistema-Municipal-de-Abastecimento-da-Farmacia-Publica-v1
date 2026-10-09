import { ConflictException } from '@nestjs/common';
import { PedidosService } from './pedidos.service';

describe('PedidosService', () => {
  const pedido = {
    id: 'order-1', medicamentoId: 'medicine-1', medicamentoNome: 'Medicamento',
    quantidadeSolicitada: 8, quantidadeEntregue: 0, status: 'APROVADO',
  };

  it('baixa estoque e cria o movimento de saída junto com a entrega', async () => {
    const tx: any = {
      pedido: {
        findUnique: jest.fn().mockResolvedValueOnce(pedido),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...pedido, status: 'ENTREGUE', quantidadeEntregue: 8 }),
      },
      medicamento: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      movimentacao: { create: jest.fn().mockResolvedValue({ id: 'movement-1' }) },
    };
    const prisma: any = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new PedidosService(prisma);

    await service.registrarEntrega('order-1', 8, 'user-1', 'Farmacêutico');

    expect(tx.medicamento.updateMany).toHaveBeenCalledWith({
      where: { id: 'medicine-1', quantidadeAtual: { gte: 8 }, ativo: true },
      data: { quantidadeAtual: { decrement: 8 } },
    });
    expect(tx.movimentacao.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tipo: 'SAIDA', quantidade: 8, responsavelId: 'user-1' }) });
  });

  it('reverte a transação lógica se o estoque central não comporta a expedição', async () => {
    const tx: any = {
      pedido: { findUnique: jest.fn().mockResolvedValue(pedido), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      medicamento: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      movimentacao: { create: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new PedidosService(prisma);

    await expect(service.registrarEntrega('order-1', 8, 'user-1', 'Farmacêutico')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.movimentacao.create).not.toHaveBeenCalled();
  });
});
