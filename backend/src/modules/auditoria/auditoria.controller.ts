import { Controller, Get, Param, ParseUUIDPipe, Query, Res, Request, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';

@Controller('auditoria')
@UseGuards(RolesGuard)
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get('exportar')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.exportar')
  async exportar(@Query() query: AuditoriaQueryDto, @Query('formato') formato: 'PDF' | 'CSV', @Res() res: Response, @Request() req: any) {
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
    try {
      const file = await this.service.exportar(query, formato === 'CSV' ? 'CSV' : 'PDF');
      void this.service.registrar(auditEvent);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    } catch (error) {
      void this.service.registrar({ ...auditEvent, sucesso: false, erro: 'Falha na exportação' });
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  listar(@Query() query: AuditoriaQueryDto) { return this.service.listar(query); }

  @Get('opcoes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  opcoes() { return this.service.opcoes(); }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  detalhar(@Param('id', ParseUUIDPipe) id: string) { return this.service.detalhar(id); }
}
