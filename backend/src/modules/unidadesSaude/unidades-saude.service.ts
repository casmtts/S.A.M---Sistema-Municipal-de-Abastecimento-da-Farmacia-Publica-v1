import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@Injectable()
export class UnidadesSaudeService {
  [x: string]: any;
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    const unidade = await this.prisma.unidadeSaude.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new NotFoundException(`Unidade de saúde com ID ${id} não encontrada`);
    }

    return unidade;
  }

  async findByCodigo(codigo: string) {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.findUnique({
      where: { codigo },
    });
  }

  async findAtivas() {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findByTipo(tipo: string) {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.findMany({
      where: { 
        tipo: tipo as any,
        ativo: true 
      },
      orderBy: { nome: 'asc' },
    });
  }

  async create(createUnidadeDto: CreateUnidadeDto) {
    // Verificar se já existe unidade com o mesmo código
    const existingUnidade = await this.findByCodigo(createUnidadeDto.codigo);
    
    if (existingUnidade) {
      throw new ConflictException(
        `Já existe uma unidade de saúde com o código ${createUnidadeDto.codigo}`,
      );
    }

    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.create({
      data: {
        ...createUnidadeDto,
        ativo: createUnidadeDto.ativo ?? true,
      },
    });
  }

  async update(id: string, updateUnidadeDto: UpdateUnidadeDto) {
    await this.findOne(id);

    // Se estiver atualizando o código, verificar duplicidade
    if (updateUnidadeDto.codigo) {
      const existingUnidade = await this.findByCodigo(updateUnidadeDto.codigo);
      if (existingUnidade && existingUnidade.id !== id) {
        throw new ConflictException(
          `Já existe uma unidade de saúde com o código ${updateUnidadeDto.codigo}`,
        );
      }
    }

    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.update({
      where: { id },
      data: updateUnidadeDto,
    });
  }

  async toggleStatus(id: string, ativo: boolean) {
    await this.findOne(id);
    
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    return this.prisma.unidadeSaude.update({
      where: { id },
      data: { ativo },
    });
  }

  async remove(id: string) {
    const unidade = await this.findOne(id);
    if (!unidade.ativo) throw new ConflictException('A unidade já está inativada.');
    return this.prisma.unidadeSaude.update({ where: { id }, data: { ativo: false } });
  }

  async getResumo() {
    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    const total = await this.prisma.unidadeSaude.count();
    const ativas = await this.prisma.unidadeSaude.count({ where: { ativo: true } });
    const inativas = total - ativas;

    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    const porTipo = await this.prisma.unidadeSaude.groupBy({
      by: ['tipo'],
      _count: {
        id: true,
      },
      where: {
        ativo: true,
      },
    });

    // ✅ CORRETO: Usar UnidadeSaude (com U maiúsculo)
    const porCidade = await this.prisma.unidadeSaude.groupBy({
      by: ['cidade', 'uf'],
      _count: {
        id: true,
      },
      where: {
        ativo: true,
      },
      orderBy: {
        cidade: 'asc',
      },
    });

    return {
      total,
      ativas,
      inativas,
      porTipo: porTipo.map((item: any) => ({
        tipo: item.tipo,
        quantidade: item._count.id,
      })),
      porCidade: porCidade.map((item: any) => ({
        cidade: item.cidade || 'Não informada',
        uf: item.uf,
        quantidade: item._count.id,
      })),
    };
  }
}
