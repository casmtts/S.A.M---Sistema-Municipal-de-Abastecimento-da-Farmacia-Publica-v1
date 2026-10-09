import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register-dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { cpfValido, normalizarCpf, normalizarTelefone, telefoneValido } from '../../common/utils/brasil.util';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { hashAuditIdentifier } from '../../common/utils/audit-identifier.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditoria: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    const { email, senha } = loginDto;
    const emailNormalizado = email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (!usuario) {
      await this.auditoria.registrar({ acao: 'LOGIN_FALHA', modulo: 'auth', descricao: 'Tentativa de login inválida', dadosDepois: { emailHash: this.hashIdentifier(emailNormalizado) }, ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId, sucesso: false });
      throw new UnauthorizedException('Não foi possível autenticar.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!usuario.ativo || !senhaValida) {
      await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'LOGIN_FALHA', modulo: 'auth', descricao: 'Credenciais inválidas ou acesso pendente', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId, sucesso: false });
      throw new UnauthorizedException('Não foi possível autenticar.');
    }


    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });
      await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'LOGIN_SUCESSO', modulo: 'auth', descricao: 'Login realizado com sucesso', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId }, tx);
    });

    return {
      access_token: this.jwtService.sign({ sub: usuario.id, email: usuario.email, role: usuario.role, tokenVersion: usuario.tokenVersion }),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        cargo: usuario.cargo,
      },
    };
  }

  async register(registerDto: RegisterDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    const cpf = normalizarCpf(registerDto.cpf);
    const email = registerDto.email.trim().toLowerCase();
    const telefone = normalizarTelefone(registerDto.telefone);
    if (!cpfValido(cpf)) throw new BadRequestException('CPF inválido');
    if (telefone && !telefoneValido(telefone)) throw new BadRequestException('Telefone inválido');

    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email ou CPF já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.senha, 12);

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: registerDto.nome,
          email,
          cpf,
          senha: hashedPassword,
          // Cadastros públicos nunca podem escolher um papel privilegiado.
          role: 'ATENDENTE',
          ativo: false,
          telefone,
          cargo: registerDto.cargo,
        },
      });
      // Retorna o usuário sem senha nem versão do token.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, tokenVersion, ...result } = usuario;
      await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'CADASTRO_SOLICITADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: usuario.id, descricao: 'Cadastro público enviado para aprovação', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId }, tx);
      return { ...result, message: 'Cadastro recebido. Aguarde a aprovação do administrador.' };
    });
  }

  async obterUsuario(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nome: true, email: true, cpf: true, role: true, ativo: true, telefone: true, cargo: true, unidadeId: true, ultimoAcesso: true, createdAt: true, updatedAt: true } });
    if (!usuario?.ativo) throw new UnauthorizedException('Não foi possível autenticar.');
    return usuario;
  }

  async atualizarPerfil(usuarioId: string, dto: UpdateProfileDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    const atual = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true, email: true, cpf: true, telefone: true, cargo: true, ativo: true },
    });
    if (!atual?.ativo) throw new UnauthorizedException('Não autorizado.');

    const data: Record<string, string | null> = {};
    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim();
      if (data.nome.length < 2) throw new BadRequestException('Informe um nome com pelo menos 2 caracteres.');
    }
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.cpf !== undefined) {
      data.cpf = normalizarCpf(dto.cpf);
      if (!cpfValido(data.cpf)) throw new BadRequestException('CPF inválido.');
    }
    if (dto.telefone !== undefined) {
      const telefone = normalizarTelefone(dto.telefone);
      if (telefone && !telefoneValido(telefone)) throw new BadRequestException('Telefone inválido.');
      data.telefone = telefone || null;
    }
    if (dto.cargo !== undefined) data.cargo = dto.cargo.trim() || null;
    if (!Object.keys(data).length) throw new BadRequestException('Informe ao menos um dado para atualizar.');

    const duplicate = await this.prisma.usuario.findFirst({
      where: { OR: [data.email ? { email: data.email } : undefined, data.cpf ? { cpf: data.cpf } : undefined].filter(Boolean), NOT: { id: usuarioId } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('E-mail ou CPF já está em uso por outra conta.');

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data,
        select: { id: true, nome: true, email: true, cpf: true, role: true, ativo: true, telefone: true, cargo: true, unidadeId: true, ultimoAcesso: true, updatedAt: true },
      });
      await this.auditoria.registrar({
        usuarioId,
        acao: 'PERFIL_ATUALIZADO',
        modulo: 'auth',
        recurso: 'Usuario',
        recursoId: usuarioId,
        descricao: 'Perfil institucional atualizado pelo próprio usuário.',
        dadosDepois: { camposAtualizados: Object.keys(data) },
        ip: contexto?.ip,
        userAgent: contexto?.userAgent,
        requestId: contexto?.requestId,
      }, tx);
      return usuario;
    });
  }

  async obterSessao(token?: string) {
    if (!token) return { usuario: null };

    let payload: { sub?: string; tokenVersion?: number };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      return { usuario: null };
    }
    if (!payload.sub) return { usuario: null };

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, role: true, cargo: true, ativo: true, tokenVersion: true },
    });
    if (!usuario?.ativo || usuario.tokenVersion !== (payload.tokenVersion ?? 0)) {
      return { usuario: null };
    }
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        cargo: usuario.cargo,
      },
    };
  }

  async logout(usuarioId: string, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: usuarioId }, data: { tokenVersion: { increment: 1 } } });
      await this.auditoria.registrar({ usuarioId, acao: 'LOGOUT', modulo: 'auth', descricao: 'Logout realizado e sessões invalidadas', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId }, tx);
    });
    return { message: 'Logout registrado.' };
  }

  async changePassword(usuarioId: string, dto: ChangePasswordDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    if (dto.novaSenha !== dto.confirmarSenha) {
      throw new BadRequestException('As senhas informadas não conferem.');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, role: true, senha: true, tokenVersion: true, ativo: true },
    });
    if (!usuario?.ativo) throw new UnauthorizedException('Não foi possível autenticar.');
    const senhaValida = await bcrypt.compare(dto.senhaAtual, usuario.senha);
    if (!senhaValida) throw new UnauthorizedException('Não foi possível autenticar.');

    const senha = await bcrypt.hash(dto.novaSenha, 12);
    const atualizado = await this.prisma.$transaction(async (tx) => {
      const result = await tx.usuario.update({
        where: { id: usuarioId },
        data: { senha, tokenVersion: { increment: 1 } },
        select: { id: true, email: true, role: true, tokenVersion: true },
      });
      await this.auditoria.registrar({
        usuarioId,
        acao: 'SENHA_ALTERADA',
        modulo: 'auth',
        descricao: 'Senha alterada e sessões anteriores revogadas',
        ip: contexto?.ip,
        userAgent: contexto?.userAgent,
        requestId: contexto?.requestId,
      }, tx);
      return result;
    });
    return {
      message: 'Senha alterada com sucesso. Faça login novamente nos demais dispositivos.',
      access_token: this.jwtService.sign({ sub: atualizado.id, email: atualizado.email, role: atualizado.role, tokenVersion: atualizado.tokenVersion }),
    };
  }

  private hashIdentifier(value: string) {
    return hashAuditIdentifier(value);
  }

  async revokeSessions(usuarioId: string, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: usuarioId }, data: { tokenVersion: { increment: 1 } } });
      await this.auditoria.registrar({
        usuarioId,
        acao: 'SESSOES_REVOGADAS',
        modulo: 'auth',
        descricao: 'Todas as sessões do usuário foram revogadas',
        ip: contexto?.ip,
        userAgent: contexto?.userAgent,
        requestId: contexto?.requestId,
      }, tx);
    });
    return { message: 'Sessões encerradas. Faça login novamente.' };
  }
}
