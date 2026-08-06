import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
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
  async exportar(@Query() query: AuditoriaQueryDto, @Query('formato') formato: 'PDF' | 'CSV', @Res() res: Response) {
    const file = await this.service.exportar(query, formato === 'CSV' ? 'CSV' : 'PDF');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.buffer.length);
    res.send(file.buffer);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  listar(@Query() query: AuditoriaQueryDto) { return this.service.listar(query); }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('auditoria.visualizar')
  detalhar(@Param('id') id: string) { return this.service.detalhar(id); }
}
