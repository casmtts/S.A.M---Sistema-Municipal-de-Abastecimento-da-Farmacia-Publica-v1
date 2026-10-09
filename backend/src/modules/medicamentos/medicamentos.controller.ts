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
  ParseIntPipe,
  BadRequestException,
  ParseUUIDPipe,
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
  getProximosVencer(@Param('dias', ParseIntPipe) dias: number) {
    if (dias < 1 || dias > 365) throw new BadRequestException('O período deve estar entre 1 e 365 dias.');
    return this.medicamentosService.getProximosVencer(dias);
  }

  @Get('resumo')
  getResumo() {
    return this.medicamentosService.getResumo();
  }

  @Patch(':id/reativar')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.editar')
  reativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicamentosService.reativar(id);
  }

  // ========== ROTAS SEM PARÂMETROS ==========
  
  @Get()
  findAll() {
    return this.medicamentosService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.criar')
  create(@Body() createMedicamentoDto: CreateMedicamentoDto, @Request() req: any) {
    return this.medicamentosService.create(createMedicamentoDto, req.user.id, req.user.nome || req.user.email);
  }

  // ========== ROTAS COM PARÂMETROS ==========
  
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicamentosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.editar')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMedicamentoDto: UpdateMedicamentoDto) {
    return this.medicamentosService.update(id, updateMedicamentoDto);
  }

  @Patch(':id/estoque')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO, UserRole.ATENDENTE)
  @Permissions('estoque.movimentar')
  updateEstoque(@Param('id', ParseUUIDPipe) id: string, @Body() updateEstoqueDto: UpdateEstoqueDto, @Request() req: any) {
    return this.medicamentosService.updateEstoque(
      id,
      updateEstoqueDto.quantidade,
      updateEstoqueDto.tipo,
      req.user.id,
      req.user.nome || req.user.email,
      updateEstoqueDto.documentoReferencia,
      updateEstoqueDto.observacao,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('estoque.excluir')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicamentosService.remove(id);
  }
}
