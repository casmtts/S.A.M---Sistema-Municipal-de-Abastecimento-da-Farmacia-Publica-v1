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
import { cpfValido, normalizarCpf, normalizarTelefone, telefoneValido } from '../../common/utils/brasil.util';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditoria: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    const { email, senha } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      await this.auditoria.registrar({ acao: 'LOGIN_FALHA', modulo: 'auth', descricao: 'Tentativa de login inválida', dadosDepois: { email }, ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId, sucesso: false });
      throw new UnauthorizedException('Não foi possível autenticar.');
    }

    if (!usuario.ativo) {
      await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'LOGIN_FALHA', modulo: 'auth', descricao: 'Tentativa de login de cadastro pendente', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId, sucesso: false });
      throw new UnauthorizedException('Não foi possível autenticar.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'LOGIN_FALHA', modulo: 'auth', descricao: 'Tentativa de login com senha inválida', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId, sucesso: false });
      throw new UnauthorizedException('Não foi possível autenticar.');
    }

    await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'LOGIN_SUCESSO', modulo: 'auth', descricao: 'Login realizado com sucesso', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId });

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      tokenVersion: usuario.tokenVersion,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }

  async register(registerDto: RegisterDto, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    const cpf = normalizarCpf(registerDto.cpf);
    const telefone = normalizarTelefone(registerDto.telefone);
    if (!cpfValido(cpf)) throw new BadRequestException('CPF inválido');
    if (telefone && !telefoneValido(telefone)) throw new BadRequestException('Telefone inválido');

    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email ou CPF já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: registerDto.nome,
        email: registerDto.email,
        cpf,
        senha: hashedPassword,
        // Cadastros públicos nunca podem escolher um papel privilegiado.
        // O administrador geral aprova o acesso e ajusta a função depois.
        role: 'ATENDENTE',
        ativo: false,
        telefone,
        cargo: registerDto.cargo,
      },
    });

    // Retorna o usuário sem a senha
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, tokenVersion, ...result } = usuario;
    await this.auditoria.registrar({ usuarioId: usuario.id, acao: 'CADASTRO_SOLICITADO', modulo: 'usuarios', recurso: 'Usuario', recursoId: usuario.id, descricao: 'Cadastro público enviado para aprovação', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId });
    return {
      ...result,
      message: 'Cadastro recebido. Aguarde a aprovação do administrador.',
    };
  }

  async logout(usuarioId: string, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    await this.auditoria.registrar({ usuarioId, acao: 'LOGOUT', modulo: 'auth', descricao: 'Logout realizado', ip: contexto?.ip, userAgent: contexto?.userAgent, requestId: contexto?.requestId });
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

    const senha = await bcrypt.hash(dto.novaSenha, 10);
    const atualizado = await this.prisma.usuario.update({
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
    });
    return {
      message: 'Senha alterada com sucesso. Faça login novamente nos demais dispositivos.',
      access_token: this.jwtService.sign({
        sub: atualizado.id,
        email: atualizado.email,
        role: atualizado.role,
        tokenVersion: atualizado.tokenVersion,
      }),
    };
  }

  async revokeSessions(usuarioId: string, contexto?: { ip?: string; userAgent?: string; requestId?: string }) {
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { tokenVersion: { increment: 1 } } });
    await this.auditoria.registrar({
      usuarioId,
      acao: 'SESSOES_REVOGADAS',
      modulo: 'auth',
      descricao: 'Todas as sessões do usuário foram revogadas',
      ip: contexto?.ip,
      userAgent: contexto?.userAgent,
      requestId: contexto?.requestId,
    });
    return { message: 'Sessões encerradas. Faça login novamente.' };
  }
}
