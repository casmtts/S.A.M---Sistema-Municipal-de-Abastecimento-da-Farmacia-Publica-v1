import { Controller, Get, Param, Put, Body, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissoesService } from './permissoes.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';

@Controller('permissoes')
@UseGuards(RolesGuard)
export class PermissoesController {
  constructor(private readonly service: PermissoesService) {}

  @Get('catalogo')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('permissoes.visualizar')
  catalogo() { return this.service.catalogo(); }

  @Get('papeis')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('permissoes.visualizar')
  papeis() { return this.service.papeis(); }

  @Put('papeis/:role')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('permissoes.editar')
  atualizarPapel(@Param('role') role: UserRole, @Body() dto: UpdateRolePermissionsDto, @Request() req: any) { return this.service.atualizarPapel(role, dto, req.user.id, req.requestId); }

  @Get('usuarios/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('permissoes.visualizar')
  usuario(@Param('id') id: string) { return this.service.usuario(id); }

  @Put('usuarios/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('permissoes.editar')
  atualizarUsuario(@Param('id') id: string, @Body() dto: UpdateUserPermissionsDto, @Request() req: any) { return this.service.atualizarUsuario(id, dto, req.user.id, req.requestId); }

  @Get('minhas')
  minhas(@Request() req: any) { return this.service.minhas(req.user.id); }
}
