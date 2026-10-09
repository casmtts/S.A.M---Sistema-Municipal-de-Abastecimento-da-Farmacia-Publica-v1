import { Controller, Get, Param, ParseUUIDPipe, Query, Res, Request, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaFormato, AuditoriaQueryDto } from './dto/auditoria-query.dto';

@Controller('auditoria')
@UseGuards(RolesGuard)
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get('exportar')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.exportar')
  async exportar(@Query() query: AuditoriaQueryDto, @Query('formato') formato: AuditoriaFormato, @Res() res: Response, @Request() req: any) {
    const auditEvent = {
      usuarioId: req.user?.id,
      acao: 'AUDITORIA_EXPORTADA',
      modulo: 'auditoria',
      recurso: 'LogAuditoria',
      descricao: `Histórico de auditoria exportado em ${formato === 'CSV' ? 'CSV' : 'PDF'}`,
      dadosDepois: { formato: formato === 'CSV' ? 'CSV' : 'PDF', filtros: query },
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
    };
    let file: Awaited<ReturnType<AuditoriaService['exportar']>>;
    try {
      file = await this.service.exportar(query, formato === AuditoriaFormato.CSV ? 'CSV' : 'PDF');
    } catch (error) {
      await this.service.registrar({ ...auditEvent, sucesso: false, erro: 'Falha na exportação' });
      throw error;
    }
    await this.service.registrar(auditEvent);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.buffer.length);
    res.send(file.buffer);
  }

  @Get('integridade')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  async verificarIntegridade(@Request() req: any) {
    const resultado = await this.service.verificarIntegridade();
    await this.service.registrar({ usuarioId: req.user?.id, requestId: req.requestId, acao: 'AUDITORIA_INTEGRIDADE_VERIFICADA', modulo: 'auditoria', recurso: 'LogAuditoria', descricao: 'Integridade da trilha de auditoria verificada', ip: req.ip, userAgent: req.get('user-agent') });
    return resultado;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  async listar(@Query() query: AuditoriaQueryDto, @Request() req: any) {
    const resultado = await this.service.listar(query);
    await this.service.registrar({ usuarioId: req.user?.id, requestId: req.requestId, acao: 'AUDITORIA_CONSULTADA', modulo: 'auditoria', recurso: 'LogAuditoria', descricao: 'Histórico de auditoria consultado', ip: req.ip, userAgent: req.get('user-agent') });
    return resultado;
  }

  @Get('opcoes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  async opcoes(@Request() req: any) {
    const resultado = await this.service.opcoes();
    await this.service.registrar({ usuarioId: req.user?.id, requestId: req.requestId, acao: 'AUDITORIA_FILTROS_CONSULTADOS', modulo: 'auditoria', recurso: 'LogAuditoria', descricao: 'Filtros do histórico de auditoria consultados', ip: req.ip, userAgent: req.get('user-agent') });
    return resultado;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  async detalhar(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const resultado = await this.service.detalhar(id);
    await this.service.registrar({ usuarioId: req.user?.id, requestId: req.requestId, acao: 'AUDITORIA_REGISTRO_CONSULTADO', modulo: 'auditoria', recurso: 'LogAuditoria', recursoId: id, descricao: 'Registro de auditoria consultado', ip: req.ip, userAgent: req.get('user-agent') });
    return resultado;
  }
}
