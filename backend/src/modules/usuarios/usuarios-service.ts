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
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService, private auditoria: AuditoriaService) {}

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

  async create(createUsuarioDto: CreateUsuarioDto, atorId?: string, requestId?: string) {
    if (createUsuarioDto.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN só pode ser definido pelo bootstrap administrativo.');
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

    const usuario = await this.prisma.usuario.create({
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
    await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_CRIADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: usuario.id, descricao: 'Usuário criado pelo administrador', dadosDepois: usuario });
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto, atorId?: string, requestId?: string) {
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser editado.');
    if (updateUsuarioDto.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN só pode ser definido pelo bootstrap administrativo.');

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
      data.tokenVersion = { increment: 1 };
    }
    if (updateUsuarioDto.role && updateUsuarioDto.role !== currentUser.role) {
      data.tokenVersion = { increment: 1 };
    }

    const usuario = await this.prisma.usuario.update({
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
    await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_ATUALIZADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: 'Usuário atualizado pelo administrador', dadosAntes: currentUser, dadosDepois: usuario });
    return usuario;
  }

  async toggleStatus(id: string, ativo: boolean, atorId?: string, requestId?: string) {
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser desativado.');

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { ativo, tokenVersion: { increment: 1 } },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
      },
    });
    await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: ativo ? 'USUARIO_APROVADO' : 'USUARIO_DESATIVADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: ativo ? 'Cadastro de usuário aprovado' : 'Usuário desativado', dadosAntes: currentUser, dadosDepois: usuario });
    return usuario;
  }

  async remove(id: string, atorId?: string, requestId?: string) {
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser removido.');
    const usuario = await this.prisma.usuario.delete({ where: { id } });
    await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_REMOVIDO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: 'Usuário removido pelo administrador', dadosAntes: currentUser });
    return usuario;
  }
}
