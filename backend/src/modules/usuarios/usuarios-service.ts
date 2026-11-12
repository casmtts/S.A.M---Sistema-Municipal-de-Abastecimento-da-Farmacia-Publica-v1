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
        OR: [{ email: createUsuarioDto.email.trim().toLowerCase() }, { cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email ou CPF já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 12);

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          ...createUsuarioDto,
          email: createUsuarioDto.email.trim().toLowerCase(),
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
      await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_CRIADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: usuario.id, descricao: 'Usuário criado pelo administrador', dadosDepois: usuario }, tx);
      return usuario;
    });
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto, atorId?: string, requestId?: string) {
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser editado.');
    if (updateUsuarioDto.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN só pode ser definido pelo bootstrap administrativo.');

    const data: any = { ...updateUsuarioDto };
    if (updateUsuarioDto.email !== undefined) data.email = updateUsuarioDto.email.trim().toLowerCase();
    if (updateUsuarioDto.cpf !== undefined) {
      data.cpf = normalizarCpf(updateUsuarioDto.cpf);
      if (!cpfValido(data.cpf)) throw new BadRequestException('CPF inválido');
    }
    if (updateUsuarioDto.telefone !== undefined) {
      data.telefone = normalizarTelefone(updateUsuarioDto.telefone);
      if (data.telefone && !telefoneValido(data.telefone)) throw new BadRequestException('Telefone inválido');
    }
    if (updateUsuarioDto.role && updateUsuarioDto.role !== currentUser.role) {
      data.tokenVersion = { increment: 1 };
    }

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
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
      await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_ATUALIZADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: 'Usuário atualizado pelo administrador', dadosAntes: currentUser, dadosDepois: usuario }, tx);
      return usuario;
    });
  }

  async toggleStatus(id: string, ativo: boolean, atorId?: string, requestId?: string) {
    if (atorId && atorId === id && !ativo) throw new BadRequestException('Você não pode desativar a própria conta.');
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser desativado.');

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: { ativo, tokenVersion: { increment: 1 } },
        select: { id: true, nome: true, email: true, ativo: true },
      });
      await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: ativo ? 'USUARIO_APROVADO' : 'USUARIO_DESATIVADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: ativo ? 'Cadastro de usuário aprovado' : 'Usuário desativado', dadosAntes: currentUser, dadosDepois: usuario }, tx);
      return usuario;
    });
  }

  async remove(id: string, atorId?: string, requestId?: string) {
    if (atorId && atorId === id) throw new BadRequestException('Você não pode remover a própria conta.');
    const currentUser = await this.findOne(id);
    if (currentUser.role === 'SUPER_ADMIN') throw new BadRequestException('O SUPER_ADMIN não pode ser removido.');
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({ where: { id }, data: { ativo: false, tokenVersion: { increment: 1 } }, select: { id: true, nome: true, email: true, role: true, ativo: true, updatedAt: true } });
      await this.auditoria.registrar({ usuarioId: atorId, requestId, acao: 'USUARIO_DESATIVADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: id, descricao: 'Acesso encerrado pelo administrador; histórico preservado', dadosAntes: { ativo: currentUser.ativo }, dadosDepois: { ativo: usuario.ativo } }, tx);
      return usuario;
    });
  }
}
