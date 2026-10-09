// src/modules/pedidos/pedidos.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto, StatusPedido } from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pedido.findMany({
      include: {
        medicamento: true,
        solicitante: {
          select: { id: true, nome: true, email: true },
        },
        aprovador: {
          select: { id: true, nome: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        medicamento: true,
        solicitante: true,
        aprovador: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return pedido;
  }

  async create(createPedidoDto: CreatePedidoDto, solicitanteId: string) {
    const medicamento = await this.prisma.medicamento.findUnique({
      where: { id: createPedidoDto.medicamentoId },
    });

    if (!medicamento || !medicamento.ativo) {
      throw new NotFoundException('Medicamento não encontrado');
    }
    const hojeUtc = new Date();
    hojeUtc.setUTCHours(0, 0, 0, 0);
    if (medicamento.validade < hojeUtc) throw new BadRequestException('Não é possível solicitar um lote vencido.');
    if (createPedidoDto.dataPrevistaEntrega < hojeUtc) throw new BadRequestException('A previsão de entrega não pode estar no passado.');

    const valorTotal =
      medicamento.precoUnitario * createPedidoDto.quantidadeSolicitada;

    return this.prisma.pedido.create({
      data: {
        medicamentoId: createPedidoDto.medicamentoId,
        medicamentoNome: medicamento.nome,
        lote: medicamento.lote,
        validade: medicamento.validade,
        quantidadeSolicitada: createPedidoDto.quantidadeSolicitada,
        quantidadeEntregue: 0,
        dataPrevistaEntrega: createPedidoDto.dataPrevistaEntrega,
        valorUnitario: medicamento.precoUnitario,
        valorTotal,
        justificativa: createPedidoDto.justificativa,
        observacoes: createPedidoDto.observacoes,
        solicitanteId,
        status: StatusPedido.PENDENTE,
      },
      include: {
        medicamento: true,
        solicitante: true,
      },
    });
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto) {
    const pedido = await this.findOne(id);
    if (pedido.status !== StatusPedido.PENDENTE) throw new ConflictException('Somente pedidos pendentes podem ter seus dados de solicitação alterados.');
    return this.prisma.pedido.updateMany({ where: { id, status: StatusPedido.PENDENTE }, data: updatePedidoDto })
      .then(async (result) => {
        if (!result.count) throw new ConflictException('O pedido mudou de estado. Atualize os dados e tente novamente.');
        return this.findOne(id);
      });
  }

  async remove(id: string) {
    await this.findOne(id);
    throw new ConflictException('Pedidos são registros administrativos e não podem ser excluídos. Cancele o pedido com justificativa.');
  }

  async aprovar(id: string, aprovadorId: string) {
    const pedido = await this.findOne(id);

    if (pedido.status !== StatusPedido.PENDENTE) {
      throw new BadRequestException(
        `Pedido não pode ser aprovado. Status atual: ${pedido.status}`,
      );
    }

    const result = await this.prisma.pedido.updateMany({
      where: { id, status: StatusPedido.PENDENTE },
      data: {
        status: StatusPedido.APROVADO,
        aprovadorId,
      },
    });
    if (!result.count) throw new ConflictException('O pedido foi alterado por outra operação; atualize a lista antes de aprovar.');
    return this.findOne(id);
  }

  async registrarEntrega(id: string, quantidade: number, responsavelId: string, responsavelNome: string) {
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) throw new BadRequestException('A quantidade entregue deve ser um número inteiro positivo.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({ where: { id } });
        if (!pedido) throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        if (![StatusPedido.APROVADO, StatusPedido.ENVIADO].includes(pedido.status as StatusPedido)) {
          throw new BadRequestException(`Pedido não pode receber entrega. Status atual: ${pedido.status}`);
        }
        const hojeUtc = new Date();
        hojeUtc.setUTCHours(0, 0, 0, 0);
        if (pedido.validade && pedido.validade < hojeUtc) throw new ConflictException('O lote vinculado ao pedido está vencido e não pode ser expedido.');
        const novaQuantidadeEntregue = pedido.quantidadeEntregue + quantidade;
        if (novaQuantidadeEntregue > pedido.quantidadeSolicitada) throw new BadRequestException('Quantidade entregue excede a solicitada.');
        const completa = novaQuantidadeEntregue === pedido.quantidadeSolicitada;
        const alterado = await tx.pedido.updateMany({
          where: { id, quantidadeEntregue: pedido.quantidadeEntregue, status: pedido.status },
          data: {
            quantidadeEntregue: novaQuantidadeEntregue,
            ...(completa ? { status: StatusPedido.ENTREGUE, dataEntregaReal: new Date() } : {}),
          },
        });
        if (!alterado.count) throw new ConflictException('O pedido mudou durante o registro da entrega. Atualize e tente novamente.');
        const estoqueAtualizado = await tx.medicamento.updateMany({
          where: { id: pedido.medicamentoId, quantidadeAtual: { gte: quantidade }, ativo: true },
          data: { quantidadeAtual: { decrement: quantidade } },
        });
        if (!estoqueAtualizado.count) throw new ConflictException('Estoque central insuficiente para concluir esta entrega.');
        await tx.movimentacao.create({ data: {
          medicamentoId: pedido.medicamentoId,
          medicamentoNome: pedido.medicamentoNome,
          lote: pedido.lote,
          validade: pedido.validade,
          tipo: 'SAIDA',
          quantidade,
          responsavelId,
          responsavelNome,
          documentoReferencia: `Expedição do pedido ${pedido.id}`,
        } });
        return tx.pedido.findUniqueOrThrow({ where: { id }, include: { medicamento: true, solicitante: true, aprovador: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('A entrega foi concorrida por outra operação. Atualize o pedido e tente novamente.');
      }
      throw error;
    }
  }

  async cancelar(id: string, motivo: string) {
    const pedido = await this.findOne(id);

    if (pedido.status === StatusPedido.ENTREGUE) {
      throw new BadRequestException(
        'Pedido já entregue não pode ser cancelado',
      );
    }

    if (pedido.status === StatusPedido.CANCELADO) {
      throw new BadRequestException('Pedido já está cancelado');
    }

    const result = await this.prisma.pedido.updateMany({
      where: { id, status: pedido.status },
      data: {
        status: StatusPedido.CANCELADO,
        observacoes: `${pedido.observacoes || ''}\nCancelado: ${motivo}`,
      },
    });
    if (!result.count) throw new ConflictException('O pedido mudou de estado. Atualize os dados e tente novamente.');
    return this.findOne(id);
  }

  async getPedidosPendentes() {
    return this.prisma.pedido.findMany({
      where: { status: StatusPedido.PENDENTE },
      include: {
        medicamento: true,
        solicitante: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPedidosAprovados() {
    return this.prisma.pedido.findMany({
      where: { status: StatusPedido.APROVADO },
      include: {
        medicamento: true,
        solicitante: true,
      },
      orderBy: { dataPrevistaEntrega: 'asc' },
    });
  }

  async getPedidosAtrasados() {
    const hoje = new Date();
    return this.prisma.pedido.findMany({
      where: {
        status: { in: [StatusPedido.APROVADO, StatusPedido.ENVIADO] },
        dataPrevistaEntrega: { lt: hoje },
      },
      include: {
        medicamento: true,
        solicitante: true,
      },
      orderBy: { dataPrevistaEntrega: 'asc' },
    });
  }

  async getPedidosEntregues() {
    return this.prisma.pedido.findMany({
      where: { status: StatusPedido.ENTREGUE },
      include: {
        medicamento: true,
        solicitante: true,
        aprovador: true,
      },
      orderBy: { dataEntregaReal: 'desc' },
    });
  }

  async getResumo() {
    const pedidos = await this.prisma.pedido.findMany();

    const total = pedidos.length;
    const pendentes = pedidos.filter(
      (p) => p.status === StatusPedido.PENDENTE,
    ).length;
    const aprovados = pedidos.filter(
      (p) => p.status === StatusPedido.APROVADO,
    ).length;
    const entregues = pedidos.filter(
      (p) => p.status === StatusPedido.ENTREGUE,
    ).length;
    const cancelados = pedidos.filter(
      (p) => p.status === StatusPedido.CANCELADO,
    ).length;
    const valorTotal = pedidos.reduce((sum, p) => sum + p.valorTotal, 0);

    return {
      total,
      pendentes,
      aprovados,
      entregues,
      cancelados,
      valorTotal,
      taxaEntrega: total > 0 ? (entregues / total) * 100 : 0,
    };
  }
}
