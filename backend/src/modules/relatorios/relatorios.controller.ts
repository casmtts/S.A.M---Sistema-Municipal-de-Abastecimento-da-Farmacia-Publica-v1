import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { RelatorioOptionsDto } from './dto/relatorio-options.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('relatorios')
@UseGuards(RolesGuard)
@Permissions('relatorios.exportar')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Post('exportar')
  @Roles(UserRole.ADMIN, UserRole.GESTOR)
  async exportar(@Body() options: RelatorioOptionsDto, @Res() res: Response) {
    const { buffer, contentType, filename } = await this.relatoriosService.gerarRelatorio(options);
    
    // ✅ Configurar cabeçalhos corretamente
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(buffer);
  }
}
