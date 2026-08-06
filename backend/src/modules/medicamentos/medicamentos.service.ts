import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicamentosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.medicamento.findMany({
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

  async create(createMedicamentoDto: CreateMedicamentoDto) {
    try {
      // Verificar se código de barras já existe
      if (createMedicamentoDto.codigoBarras) {
        const existing = await this.prisma.medicamento.findFirst({
          where: { codigoBarras: createMedicamentoDto.codigoBarras },
        });
        
        if (existing) {
          throw new ConflictException('Já existe um medicamento com este código de barras');
        }
      }

      const data = {
        ...createMedicamentoDto,
        fornecedorId: createMedicamentoDto.fornecedorId || null,
        codigoBarras: createMedicamentoDto.codigoBarras || null,
      };
      
      return await this.prisma.medicamento.create({
        data,
        include: { fornecedor: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um medicamento com este código de barras');
        }
      }
      throw error;
    }
  }

  async update(id: string, updateMedicamentoDto: UpdateMedicamentoDto) {
    await this.findOne(id);

    // Verificar se código de barras já existe (se estiver sendo alterado)
    if (updateMedicamentoDto.codigoBarras) {
      const existing = await this.prisma.medicamento.findFirst({
        where: { 
          codigoBarras: updateMedicamentoDto.codigoBarras,
          NOT: { id },
        },
      });
      
      if (existing) {
        throw new ConflictException('Já existe um medicamento com este código de barras');
      }
    }

    const data = {
      ...updateMedicamentoDto,
      fornecedorId: updateMedicamentoDto.fornecedorId === '' ? null : updateMedicamentoDto.fornecedorId,
      codigoBarras: updateMedicamentoDto.codigoBarras || null,
    };
    
    return this.prisma.medicamento.update({
      where: { id },
      data,
      include: { fornecedor: true },
    });
  }

  async updateEstoque(id: string, quantidade: number, tipo: 'ENTRADA' | 'SAIDA', responsavelId: string, responsavelNome: string) {
    const medicamento = await this.findOne(id);
    if (tipo === 'SAIDA' && quantidade > medicamento.quantidadeAtual) {
      throw new ConflictException(`Estoque insuficiente. Disponível: ${medicamento.quantidadeAtual}`);
    }
    const delta = tipo === 'ENTRADA' ? quantidade : -quantidade;
    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.medicamento.update({ where: { id }, data: { quantidadeAtual: { increment: delta } }, include: { fornecedor: true } });
      await tx.movimentacao.create({ data: { medicamentoId: id, medicamentoNome: medicamento.nome, tipo: tipo === 'ENTRADA' ? 'ENTRADA' : 'SAIDA', quantidade, responsavelId, responsavelNome, documentoReferencia: 'Movimentação de estoque' } });
      return atualizado;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.medicamento.delete({ where: { id } });
  }

  async getAlertasEstoque() {
    const medicamentos = await this.prisma.medicamento.findMany();
    
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
        validade: {
          lte: dataLimite,
          gt: new Date(),
        },
      },
      orderBy: { validade: 'asc' },
    });
  }

  async getResumo() {
    const medicamentos = await this.prisma.medicamento.findMany();
    
    const total = medicamentos.length;
    const valorTotal = medicamentos.reduce((sum, m) => sum + (m.quantidadeAtual * m.precoUnitario), 0);
    const unidadesTotal = medicamentos.reduce((sum, m) => sum + m.quantidadeAtual, 0);
    const criticos = medicamentos.filter(m => m.quantidadeAtual <= m.quantidadeMinima * 0.5).length;
    
    return { total, valorTotal, unidadesTotal, criticos };
  }
}
