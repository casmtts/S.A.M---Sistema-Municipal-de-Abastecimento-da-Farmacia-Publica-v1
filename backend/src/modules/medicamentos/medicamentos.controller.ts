import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { UpdateEstoqueDto } from './dto/update-estoque.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('medicamentos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Permissions('estoque.visualizar')
export class MedicamentosController {
  constructor(private readonly medicamentosService: MedicamentosService) {}

  // ========== ROTAS ESPECÍFICAS (PRIMEIRO) ==========
  
  @Get('alertas')
  getAlertas() {
    return this.medicamentosService.getAlertasEstoque();
  }

  @Get('vencer/:dias')
  getProximosVencer(@Param('dias') dias: string) {
    return this.medicamentosService.getProximosVencer(parseInt(dias));
  }

  @Get('resumo')
  getResumo() {
    return this.medicamentosService.getResumo();
  }

  // ========== ROTAS SEM PARÂMETROS ==========
  
  @Get()
  findAll() {
    return this.medicamentosService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.criar')
  create(@Body() createMedicamentoDto: CreateMedicamentoDto) {
    return this.medicamentosService.create(createMedicamentoDto);
  }

  // ========== ROTAS COM PARÂMETROS ==========
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicamentosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.editar')
  update(@Param('id') id: string, @Body() updateMedicamentoDto: UpdateMedicamentoDto) {
    return this.medicamentosService.update(id, updateMedicamentoDto);
  }

  @Patch(':id/estoque')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO, UserRole.ATENDENTE)
  @Permissions('estoque.movimentar')
  updateEstoque(@Param('id') id: string, @Body() updateEstoqueDto: UpdateEstoqueDto, @Request() req: any) {
    return this.medicamentosService.updateEstoque(
      id,
      updateEstoqueDto.quantidade,
      updateEstoqueDto.tipo,
      req.user.id,
      req.user.nome || req.user.email,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('estoque.excluir')
  remove(@Param('id') id: string) {
    return this.medicamentosService.remove(id);
  }
}
