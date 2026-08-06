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
import { cpfValido, normalizarCpf, normalizarTelefone, telefoneValido } from '../../common/utils/brasil.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Cadastro aguardando aprovação do administrador');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
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

  async register(registerDto: RegisterDto) {
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
    const { senha, ...result } = usuario;
    return {
      ...result,
      message: 'Cadastro recebido. Aguarde a aprovação do administrador.',
    };
  }
}
