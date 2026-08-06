import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATALOG } from './permissoes.catalogo';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class PermissoesService implements OnModuleInit {
  private readonly logger = new Logger(PermissoesService.name);

  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  async onModuleInit() {
    await Promise.all(PERMISSION_CATALOG.map((permission) => this.prisma.permissao.upsert({
      where: { chave: permission.chave },
      update: { modulo: permission.modulo, acao: permission.acao, nome: permission.nome, ativo: true },
      create: permission,
    })));

    for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permission of PERMISSION_CATALOG) {
        await this.prisma.permissaoPapel.upsert({
          where: { permissaoId_role: { permissaoId: (await this.prisma.permissao.findUniqueOrThrow({ where: { chave: permission.chave } })).id, role: role as UserRole } },
          update: {},
          create: {
            permissaoId: (await this.prisma.permissao.findUniqueOrThrow({ where: { chave: permission.chave } })).id,
            role: role as UserRole,
            permitido: keys.includes(permission.chave),
          },
        });
      }
    }

    const existingSuperAdmin = await this.prisma.usuario.findFirst({ where: { role: UserRole.SUPER_ADMIN }, select: { id: true } });
    const firstAdmin = existingSuperAdmin ? null : await this.prisma.usuario.findFirst({ where: { role: UserRole.ADMIN }, orderBy: { createdAt: 'asc' } });
    if (firstAdmin) {
      await this.prisma.usuario.update({ where: { id: firstAdmin.id }, data: { role: UserRole.SUPER_ADMIN } });
      this.logger.log(`Primeiro administrador promovido para SUPER_ADMIN: ${firstAdmin.id}`);
    }
  }

  async hasPermission(usuarioId: string, chave: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { role: true, ativo: true } });
    if (!usuario?.ativo) return false;
    if (usuario.role === UserRole.ADMIN || usuario.role === UserRole.SUPER_ADMIN) return true;

    const permission = await this.prisma.permissao.findUnique({ where: { chave } });
    if (!permission) return false;
    const override = await this.prisma.permissaoUsuario.findUnique({ where: { usuarioId_permissaoId: { usuarioId, permissaoId: permission.id } } });
    if (override) return override.permitido;
    const rolePermission = await this.prisma.permissaoPapel.findUnique({ where: { permissaoId_role: { permissaoId: permission.id, role: usuario.role } } });
    return rolePermission?.permitido ?? false;
  }

  async catalogo() { return PERMISSION_CATALOG; }

  async papeis() {
    const permissions = await this.prisma.permissao.findMany({ orderBy: [{ modulo: 'asc' }, { acao: 'asc' }] });
    const roleValues = Object.values(UserRole);
    return Promise.all(roleValues.map(async (role) => ({
      role,
      permissoes: await Promise.all(permissions.map(async (permission) => {
        const value = await this.prisma.permissaoPapel.findUnique({ where: { permissaoId_role: { permissaoId: permission.id, role } } });
        return { chave: permission.chave, modulo: permission.modulo, acao: permission.acao, nome: permission.nome, permitido: value?.permitido ?? false };
      })),
    })));
  }

  async atualizarPapel(role: UserRole, dto: UpdateRolePermissionsDto, atorId?: string) {
    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) throw new BadRequestException('As permissões administrativas são fixas.');
    await this.atualizarValores(dto.permissoes, { role });
    await this.auditoria.registrar({ usuarioId: atorId, acao: 'PERMISSOES_PAPEL_ATUALIZADAS', modulo: 'permissoes', recurso: 'Papel', recursoId: role, descricao: `Permissões do papel ${role} atualizadas`, dadosDepois: dto.permissoes });
    return this.papeis();
  }

  async usuario(usuarioId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nome: true, email: true, role: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const role = (await this.papeis()).find((value) => value.role === user.role);
    const overrides = await this.prisma.permissaoUsuario.findMany({ where: { usuarioId }, include: { permissao: true } });
    return { usuario: user, permissoes: role?.permissoes || [], excecoes: overrides.map(({ permissao, permitido }) => ({ chave: permissao.chave, permitido })) };
  }

  async atualizarUsuario(usuarioId: string, dto: UpdateUserPermissionsDto, atorId?: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { role: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.role === UserRole.SUPER_ADMIN) throw new ForbiddenException('O SUPER_ADMIN não pode ter permissões alteradas.');
    await this.prisma.$transaction(async (tx) => {
      const existentes = await tx.permissaoUsuario.findMany({ where: { usuarioId }, include: { permissao: { select: { chave: true } } } });
      const informadas = new Set(dto.permissoes.map(({ chave }) => chave));
      for (const excecao of existentes) {
        if (!informadas.has(excecao.permissao.chave)) {
          await tx.permissaoUsuario.delete({ where: { usuarioId_permissaoId: { usuarioId, permissaoId: excecao.permissaoId } } });
        }
      }
      for (const value of dto.permissoes) {
        const permission = await tx.permissao.findUnique({ where: { chave: value.chave } });
        if (!permission) throw new BadRequestException(`Permissão inválida: ${value.chave}`);
        await tx.permissaoUsuario.upsert({
          where: { usuarioId_permissaoId: { usuarioId, permissaoId: permission.id } },
          update: { permitido: value.permitido },
          create: { usuarioId, permissaoId: permission.id, permitido: value.permitido },
        });
      }
    });
    await this.auditoria.registrar({ usuarioId: atorId, acao: 'PERMISSOES_USUARIO_ATUALIZADAS', modulo: 'permissoes', recurso: 'Usuario', recursoId: usuarioId, descricao: 'Exceções de permissões atualizadas', dadosDepois: dto.permissoes });
    return this.usuario(usuarioId);
  }

  async minhas(usuarioId: string) {
    const permissions = await this.prisma.permissao.findMany({ where: { ativo: true }, select: { chave: true } });
    const result = await Promise.all(permissions.map(async ({ chave }) => ({ chave, permitido: await this.hasPermission(usuarioId, chave) })));
    return result.filter(({ permitido }) => permitido).map(({ chave }) => chave);
  }

  private async atualizarValores(values: { chave: string; permitido: boolean }[], where: { role: UserRole }) {
    for (const value of values) {
      const permission = await this.prisma.permissao.findUnique({ where: { chave: value.chave } });
      if (!permission) throw new BadRequestException(`Permissão inválida: ${value.chave}`);
      await this.prisma.permissaoPapel.upsert({
        where: { permissaoId_role: { permissaoId: permission.id, role: where.role } },
        update: { permitido: value.permitido },
        create: { permissaoId: permission.id, role: where.role, permitido: value.permitido },
      });
    }
  }
}
