import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePrivacyRequestDto } from './dto/create-privacy-request.dto';
import { ResolvePrivacyRequestDto } from './dto/resolve-privacy-request.dto';
import { PrivacidadeService } from './privacidade.service';

@Controller('privacidade')
@UseGuards(RolesGuard)
export class PrivacidadeController {
  constructor(private readonly service: PrivacidadeService) {}

  @Get('minhas')
  minhas(@Request() req: any) { return this.service.minhasSolicitacoes(req.user.id); }

  @Post('solicitacoes')
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  solicitar(@Body() dto: CreatePrivacyRequestDto, @Request() req: any) { return this.service.solicitar(req.user.id, dto, req.requestId); }

  @Get('dados')
  exportarMeusDados(@Request() req: any) { return this.service.exportarDados(req.user.id); }

  @Get('solicitacoes/todas')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('privacidade.visualizar')
  listar() { return this.service.listar(); }

  @Patch('solicitacoes/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('privacidade.atender')
  atender(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolvePrivacyRequestDto, @Request() req: any) { return this.service.atender(id, dto, req.user.id, req.requestId); }

  @Post('usuarios/:id/pseudonimizar')
  @Roles(UserRole.SUPER_ADMIN)
  pseudonimizar(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) { return this.service.pseudonimizar(id, req.user.id, req.requestId); }
}
