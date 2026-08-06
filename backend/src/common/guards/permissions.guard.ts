import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissoesService } from '../../modules/permissoes/permissoes.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly permissions: PermissoesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest();
    if (!request.user) throw new ForbiddenException('Usuário não autenticado');
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(request.user.role)) return true;
    const allowed = await Promise.all(required.map((permission) => this.permissions.hasPermission(request.user.id, permission)));
    if (!allowed.some(Boolean)) throw new ForbiddenException('Você não tem permissão para realizar esta ação.');
    return true;
  }
}
