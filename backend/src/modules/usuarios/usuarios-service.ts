import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { cpfValido, normalizarCpf, normalizarTelefone, telefoneValido } from '../../common/utils/brasil.util';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        role: true,
        ativo: true,
        telefone: true,
        cargo: true,
        unidadeId: true,
        ultimoAcesso: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        role: true,
        ativo: true,
        telefone: true,
        cargo: true,
        unidadeId: true,
        ultimoAcesso: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return usuario;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const cpf = normalizarCpf(createUsuarioDto.cpf);
    const telefone = normalizarTelefone(createUsuarioDto.telefone);
    if (!cpfValido(cpf)) throw new BadRequestException('CPF inválido');
    if (telefone && !telefoneValido(telefone)) throw new BadRequestException('Telefone inválido');

    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: createUsuarioDto.email }, { cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email ou CPF já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);

    return this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        cpf,
        telefone,
        senha: hashedPassword,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        role: true,
        ativo: true,
        telefone: true,
        cargo: true,
        unidadeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    await this.findOne(id);

    const data: any = { ...updateUsuarioDto };
    if (updateUsuarioDto.cpf !== undefined) {
      data.cpf = normalizarCpf(updateUsuarioDto.cpf);
      if (!cpfValido(data.cpf)) throw new BadRequestException('CPF inválido');
    }
    if (updateUsuarioDto.telefone !== undefined) {
      data.telefone = normalizarTelefone(updateUsuarioDto.telefone);
      if (data.telefone && !telefoneValido(data.telefone)) throw new BadRequestException('Telefone inválido');
    }
    if (updateUsuarioDto.senha) {
      data.senha = await bcrypt.hash(updateUsuarioDto.senha, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        role: true,
        ativo: true,
        telefone: true,
        cargo: true,
        unidadeId: true,
        updatedAt: true,
      },
    });
  }

  async toggleStatus(id: string, ativo: boolean) {
    await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: { ativo },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.usuario.delete({ where: { id } });
  }
}
