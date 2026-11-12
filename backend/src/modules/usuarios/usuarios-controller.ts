import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsuariosService } from './usuarios-service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ToggleStatusDto } from '../../common/dto/toggle-status.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Permissions('usuarios.visualizar')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions('usuarios.criar')
  create(@Body() createUsuarioDto: CreateUsuarioDto, @Request() req: any) {
    return this.usuariosService.create(createUsuarioDto, req.user.id, req.requestId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('usuarios.editar')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req: any) {
    return this.usuariosService.update(id, updateUsuarioDto, req.user.id, req.requestId);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  @Permissions('usuarios.aprovar')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string, @Body() { ativo }: ToggleStatusDto, @Request() req: any) {
    return this.usuariosService.toggleStatus(id, ativo, req.user.id, req.requestId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('usuarios.excluir')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.usuariosService.remove(id, req.user.id, req.requestId);
  }
}
