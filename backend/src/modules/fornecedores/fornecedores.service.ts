import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';

@Injectable()
export class FornecedoresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Buscar todos os fornecedores
   */
  async findAll() {
    return this.prisma.fornecedor.findMany({
      include: {
        medicamentos: {
          select: {
            id: true,
            nome: true,
            quantidadeAtual: true,
            precoUnitario: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Buscar fornecedor por ID
   */
  async findOne(id: string) {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
      include: {
        medicamentos: {
          select: {
            id: true,
            nome: true,
            quantidadeAtual: true,
            precoUnitario: true,
            validade: true,
          },
        },
      },
    });

    if (!fornecedor) {
      throw new NotFoundException(`Fornecedor com ID ${id} não encontrado`);
    }

    return fornecedor;
  }

  /**
   * Buscar fornecedor por CNPJ
   */
  async findByCnpj(cnpj: string) {
    return this.prisma.fornecedor.findUnique({
      where: { cnpj },
    });
  }

  /**
   * Buscar fornecedores ativos
   */
  async findAtivos() {
    return this.prisma.fornecedor.findMany({
      where: { ativo: true },
      include: {
        medicamentos: {
          take: 5,
          select: { id: true, nome: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Criar novo fornecedor
   */
  async create(createFornecedorDto: CreateFornecedorDto) {
    // Verificar se já existe fornecedor com mesmo CNPJ
    const existingFornecedor = await this.findByCnpj(createFornecedorDto.cnpj);

    if (existingFornecedor) {
      throw new ConflictException(
        `Já existe um fornecedor com o CNPJ ${createFornecedorDto.cnpj}`,
      );
    }

    return this.prisma.fornecedor.create({
      data: {
        ...createFornecedorDto,
        ativo: createFornecedorDto.ativo ?? true,
      },
      include: {
        medicamentos: true,
      },
    });
  }

  /**
   * Atualizar fornecedor
   */
  async update(id: string, updateFornecedorDto: UpdateFornecedorDto) {
    await this.findOne(id);

    // Se estiver atualizando o CNPJ, verificar duplicidade
    if (updateFornecedorDto.cnpj) {
      const existingFornecedor = await this.findByCnpj(
        updateFornecedorDto.cnpj,
      );
      if (existingFornecedor && existingFornecedor.id !== id) {
        throw new ConflictException(
          `Já existe um fornecedor com o CNPJ ${updateFornecedorDto.cnpj}`,
        );
      }
    }

    return this.prisma.fornecedor.update({
      where: { id },
      data: updateFornecedorDto,
      include: {
        medicamentos: true,
      },
    });
  }

  /**
   * Ativar/Desativar fornecedor
   */
  async toggleStatus(id: string, ativo: boolean) {
    await this.findOne(id);

    return this.prisma.fornecedor.update({
      where: { id },
      data: { ativo },
    });
  }

  /**
   * Remover fornecedor
   */
  async remove(id: string) {
    const fornecedor = await this.findOne(id);
    if (!fornecedor.ativo) throw new ConflictException('O fornecedor já está inativado.');
    return this.prisma.fornecedor.update({ where: { id }, data: { ativo: false } });
  }

  /**
   * Resumo estatístico dos fornecedores
   */
  async getResumo() {
    const total = await this.prisma.fornecedor.count();
    const ativos = await this.prisma.fornecedor.count({
      where: { ativo: true },
    });
    const inativos = total - ativos;

    const fornecedoresComMedicamentos = await this.prisma.fornecedor.findMany({
      where: {
        medicamentos: {
          some: {},
        },
      },
      include: {
        _count: {
          select: { medicamentos: true },
        },
      },
    });

    const totalMedicamentos = fornecedoresComMedicamentos.reduce(
      (sum, f) => sum + f._count.medicamentos,
      0,
    );

    return {
      total,
      ativos,
      inativos,
      fornecedoresComProdutos: fornecedoresComMedicamentos.length,
      totalMedicamentosVinculados: totalMedicamentos,
    };
  }

  /**
   * Buscar medicamentos de um fornecedor específico
   */
  async getMedicamentosPorFornecedor(id: string) {
    await this.findOne(id);

    return this.prisma.medicamento.findMany({
      where: { fornecedorId: id },
      orderBy: { nome: 'asc' },
    });
  }
}
