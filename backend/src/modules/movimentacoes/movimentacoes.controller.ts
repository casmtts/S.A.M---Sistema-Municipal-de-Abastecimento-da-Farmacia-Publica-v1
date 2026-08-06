import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MovimentacoesService } from './movimentacoes.service';
import { CreateMovimentacaoDto } from './dto/create-movimentacoes.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('movimentacoes')
@UseGuards(RolesGuard)
@Permissions('estoque.visualizar')
export class MovimentacoesController {
  constructor(private readonly movimentacoesService: MovimentacoesService) {}

  // ========== ROTAS ESPECÍFICAS (PRIMEIRO) ==========

  @Get('entradas')
  getEntradas() {
    return this.movimentacoesService.getEntradas();
  }

  @Get('saidas')
  getSaidas() {
    return this.movimentacoesService.getSaidas();
  }

  @Get('dispensas')
  getDispensas() {
    return this.movimentacoesService.getDispensas();
  }

  @Get('resumo')
  getResumo() {
    return this.movimentacoesService.getResumo();
  }

  // ========== ROTAS COM PARÂMETROS ==========

  @Get('periodo')
  getByPeriodo(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    if (!inicio || !fim || Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime()) || dataFim < dataInicio || dataFim.getTime() - dataInicio.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('O intervalo informado é inválido.');
    }
    return this.movimentacoesService.getByPeriodo(dataInicio, dataFim);
  }

  @Get('medicamento/:id')
  getByMedicamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimentacoesService.getByMedicamento(id);
  }

  // ========== ROTAS SEM PARÂMETROS ==========

  @Get()
  findAll() {
    return this.movimentacoesService.findAll();
  }

  // ========== ROTAS COM PARÂMETRO ID ==========

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimentacoesService.findOne(id);
  }

  // ========== ROTAS POST E DELETE ==========

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('estoque.movimentar')
  create(@Body() createMovimentacaoDto: CreateMovimentacaoDto, @Request() req) {
    return this.movimentacoesService.create(
      createMovimentacaoDto,
      req.user.id,
      req.user.nome || req.user.email,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('estoque.excluir')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimentacoesService.remove(id);
  }
}
