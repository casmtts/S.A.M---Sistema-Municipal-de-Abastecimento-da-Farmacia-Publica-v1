import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicamentosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.medicamento.findMany({
      where: { ativo: true },
      include: {
        fornecedor: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const medicamento = await this.prisma.medicamento.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        movimentacoes: {
          orderBy: { data: 'desc' },
          take: 10,
        },
      },
    });

    if (!medicamento) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    return medicamento;
  }

  async create(createMedicamentoDto: CreateMedicamentoDto, responsavelId: string, responsavelNome: string) {
    try {
      // Barcodes repeat between lots; only the same barcode + lot is a duplicate.
      if (createMedicamentoDto.codigoBarras) {
        const existing = await this.prisma.medicamento.findFirst({
          where: { codigoBarras: createMedicamentoDto.codigoBarras, lote: createMedicamentoDto.lote },
        });
        
        if (existing) {
          throw new ConflictException('Já existe um cadastro para este código de barras e lote.');
        }
      }

      const { quantidadeAtual: saldoInicial, ...dadosCatalogo } = createMedicamentoDto;
      return await this.prisma.$transaction(async (tx) => {
        const medicamento = await tx.medicamento.create({
          data: {
            ...dadosCatalogo,
            quantidadeAtual: 0,
            fornecedorId: dadosCatalogo.fornecedorId || null,
            codigoBarras: dadosCatalogo.codigoBarras || null,
          },
          include: { fornecedor: true },
        });
        if (saldoInicial > 0) {
          await tx.movimentacao.create({ data: {
            medicamentoId: medicamento.id,
            medicamentoNome: medicamento.nome,
            lote: medicamento.lote,
            validade: medicamento.validade,
            tipo: 'ENTRADA',
            quantidade: saldoInicial,
            responsavelId,
            responsavelNome,
            documentoReferencia: 'Registro de saldo inicial do cadastro',
          } });
          return tx.medicamento.update({ where: { id: medicamento.id }, data: { quantidadeAtual: saldoInicial }, include: { fornecedor: true } });
        }
        return medicamento;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um cadastro para este código de barras e lote.');
        }
      }
      throw error;
    }
  }

  async update(id: string, updateMedicamentoDto: UpdateMedicamentoDto) {
    const current = await this.findOne(id);
    if (!current.ativo) throw new ConflictException('Medicamento inativado não pode ser alterado.');
    if (updateMedicamentoDto.quantidadeAtual !== undefined && updateMedicamentoDto.quantidadeAtual !== current.quantidadeAtual) {
      throw new BadRequestException('O saldo deve ser alterado por uma movimentação de estoque.');
    }

    const identificadoresAlterados = ['nome', 'principioAtivo', 'concentracao', 'formaFarmaceutica', 'codigoBarras', 'lote', 'validade']
      .some((field) => (updateMedicamentoDto as Record<string, unknown>)[field] !== undefined && String((updateMedicamentoDto as Record<string, unknown>)[field]) !== String((current as unknown as Record<string, unknown>)[field] ?? ''));
    if (identificadoresAlterados) {
      const [movimentacoes, pedidos] = await Promise.all([
        this.prisma.movimentacao.count({ where: { medicamentoId: id } }),
        this.prisma.pedido.count({ where: { medicamentoId: id } }),
      ]);
      if (movimentacoes || pedidos) throw new ConflictException('A identificação do medicamento e do lote não pode ser alterada após gerar movimentações ou pedidos. Cadastre um novo lote.');
    }

    // Barcodes repeat between lots; prevent duplicate registration of the same lot.
    if (updateMedicamentoDto.codigoBarras || updateMedicamentoDto.lote) {
      const codigoBarras = updateMedicamentoDto.codigoBarras ?? current.codigoBarras;
      const lote = updateMedicamentoDto.lote ?? current.lote;
      if (codigoBarras && lote) {
        const existing = await this.prisma.medicamento.findFirst({ where: { codigoBarras, lote, NOT: { id } } });
        if (existing) throw new ConflictException('Já existe um cadastro para este código de barras e lote.');
      }
    }

    const { quantidadeAtual: _saldoIgnorado, ...camposEditaveis } = updateMedicamentoDto;
    const data = {
      ...camposEditaveis,
      fornecedorId: updateMedicamentoDto.fornecedorId === '' ? null : updateMedicamentoDto.fornecedorId,
      codigoBarras: updateMedicamentoDto.codigoBarras || null,
    };
    
    return this.prisma.medicamento.update({
      where: { id },
      data,
      include: { fornecedor: true },
    });
  }

  async updateEstoque(id: string, quantidade: number, tipo: 'ENTRADA' | 'SAIDA', responsavelId: string, responsavelNome: string, documentoReferencia: string, observacao?: string) {
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) throw new BadRequestException('A quantidade deve ser um número inteiro positivo.');
    const medicamento = await this.findOne(id);
    if (!medicamento.ativo) throw new ConflictException('Não é permitido movimentar um medicamento inativado.');
    if (tipo === 'SAIDA' && quantidade > medicamento.quantidadeAtual) {
      throw new ConflictException(`Estoque insuficiente. Disponível: ${medicamento.quantidadeAtual}`);
    }
    const delta = tipo === 'ENTRADA' ? quantidade : -quantidade;
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.medicamento.updateMany({ where: { id, ativo: true, ...(delta < 0 ? { quantidadeAtual: { gte: quantidade } } : {}) }, data: { quantidadeAtual: { increment: delta } } });
      if (!changed.count) throw new ConflictException('Estoque insuficiente ou alterado por outra operação. Atualize o saldo e tente novamente.');
      const atualizado = await tx.medicamento.findUniqueOrThrow({ where: { id }, include: { fornecedor: true } });
      await tx.movimentacao.create({ data: { medicamentoId: id, medicamentoNome: medicamento.nome, lote: medicamento.lote, validade: medicamento.validade, tipo: tipo === 'ENTRADA' ? 'ENTRADA' : 'SAIDA', quantidade, responsavelId, responsavelNome, documentoReferencia, observacao } });
      return atualizado;
    });
  }

  async remove(id: string) {
    const medicamento = await this.findOne(id);
    if (!medicamento.ativo) throw new ConflictException('O medicamento já está inativado.');
    if (medicamento.quantidadeAtual > 0) throw new ConflictException('Não é possível inativar um lote com saldo. Registre a destinação do estoque e tente novamente.');
    // Make the zero-balance check atomic with deactivation. Without this guard,
    // a concurrent stock receipt could leave an inactive lot with positive balance.
    const result = await this.prisma.medicamento.updateMany({
      where: { id, ativo: true, quantidadeAtual: 0 },
      data: { ativo: false },
    });
    if (!result.count) throw new ConflictException('O lote recebeu movimentação durante a inativação. Atualize o saldo e tente novamente.');
    return this.findOne(id);
  }

  async reativar(id: string) {
    const medicamento = await this.findOne(id);
    if (medicamento.ativo) throw new ConflictException('O lote já está ativo.');
    return this.prisma.medicamento.update({ where: { id }, data: { ativo: true } });
  }

  async getAlertasEstoque() {
    const medicamentos = await this.prisma.medicamento.findMany({ where: { ativo: true } });
    
    const criticos = medicamentos.filter(
      m => m.quantidadeAtual <= m.quantidadeMinima * 0.5
    );
    
    const baixos = medicamentos.filter(
      m => m.quantidadeAtual <= m.quantidadeMinima && 
           m.quantidadeAtual > m.quantidadeMinima * 0.5
    );
    
    return { criticos, baixos };
  }

  async getProximosVencer(dias: number = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);
    
    return this.prisma.medicamento.findMany({
      where: {
        ativo: true,
        validade: {
          lte: dataLimite,
          gt: new Date(),
        },
      },
      orderBy: { validade: 'asc' },
    });
  }

  async getResumo() {
    const medicamentos = await this.prisma.medicamento.findMany({ where: { ativo: true } });
    
    const total = medicamentos.length;
    const valorTotal = medicamentos.reduce((sum, m) => sum + (m.quantidadeAtual * m.precoUnitario), 0);
    const unidadesTotal = medicamentos.reduce((sum, m) => sum + m.quantidadeAtual, 0);
    const criticos = medicamentos.filter(m => m.quantidadeAtual <= m.quantidadeMinima * 0.5).length;
    
    return { total, valorTotal, unidadesTotal, criticos };
  }
}
