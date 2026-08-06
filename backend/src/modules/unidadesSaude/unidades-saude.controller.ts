import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UnidadesSaudeService } from './unidades-saude.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('unidades-saude')
@UseGuards(RolesGuard)
@Permissions('unidades.visualizar')
export class UnidadesSaudeController {
  constructor(private readonly unidadesSaudeService: UnidadesSaudeService) {}

  // ========== ROTAS ESPECÍFICAS (PRIMEIRO) ==========

  @Get('ativas')
  findAtivas() {
    return this.unidadesSaudeService.findAtivas();
  }

  @Get('resumo')
  getResumo() {
    return this.unidadesSaudeService.getResumo();
  }

  // ========== ROTAS COM PARÂMETROS DE BUSCA ==========

  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string) {
    return this.unidadesSaudeService.findByTipo(tipo);
  }

  @Get('cidade/:cidade')
  findByCidade(@Param('cidade') cidade: string) {
    return this.unidadesSaudeService.findByCidade(cidade);
  }

  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.unidadesSaudeService.findByCodigo(codigo);
  }

  // ========== ROTAS SEM PARÂMETROS ==========

  @Get()
  findAll() {
    return this.unidadesSaudeService.findAll();
  }

  // ========== ROTAS COM PARÂMETRO ID ==========

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unidadesSaudeService.findOne(id);
  }

  // ========== ROTAS POST, PATCH, DELETE ==========

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions('unidades.criar')
  create(@Body() createUnidadeDto: CreateUnidadeDto) {
    return this.unidadesSaudeService.create(createUnidadeDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('unidades.editar')
  update(@Param('id') id: string, @Body() updateUnidadeDto: UpdateUnidadeDto) {
    return this.unidadesSaudeService.update(id, updateUnidadeDto);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  @Permissions('unidades.editar')
  toggleStatus(@Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.unidadesSaudeService.toggleStatus(id, ativo);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('unidades.excluir')
  remove(@Param('id') id: string) {
    return this.unidadesSaudeService.remove(id);
  }
}
