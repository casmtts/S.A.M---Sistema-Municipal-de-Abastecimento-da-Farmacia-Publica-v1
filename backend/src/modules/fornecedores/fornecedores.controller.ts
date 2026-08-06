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
import { FornecedoresService } from './fornecedores.service';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('fornecedores')
@UseGuards(RolesGuard)
@Permissions('fornecedores.visualizar')
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  /**
   * Listar todos os fornecedores
   */
  @Get()
  findAll() {
    return this.fornecedoresService.findAll();
  }

  /**
   * Listar fornecedores ativos
   */
  @Get('ativos')
  findAtivos() {
    return this.fornecedoresService.findAtivos();
  }

  /**
   * Resumo estatístico
   */
  @Get('resumo')
  getResumo() {
    return this.fornecedoresService.getResumo();
  }

  /**
   * Buscar fornecedor por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fornecedoresService.findOne(id);
  }

  /**
   * Buscar medicamentos de um fornecedor
   */
  @Get(':id/medicamentos')
  getMedicamentosPorFornecedor(@Param('id') id: string) {
    return this.fornecedoresService.getMedicamentosPorFornecedor(id);
  }

  /**
   * Criar novo fornecedor (apenas ADMIN)
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions('fornecedores.criar')
  create(@Body() createFornecedorDto: CreateFornecedorDto) {
    return this.fornecedoresService.create(createFornecedorDto);
  }

  /**
   * Atualizar fornecedor (apenas ADMIN)
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('fornecedores.editar')
  update(
    @Param('id') id: string,
    @Body() updateFornecedorDto: UpdateFornecedorDto,
  ) {
    return this.fornecedoresService.update(id, updateFornecedorDto);
  }

  /**
   * Ativar/Desativar fornecedor (apenas ADMIN)
   */
  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  @Permissions('fornecedores.editar')
  toggleStatus(@Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.fornecedoresService.toggleStatus(id, ativo);
  }

  /**
   * Remover fornecedor (apenas ADMIN)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('fornecedores.excluir')
  remove(@Param('id') id: string) {
    return this.fornecedoresService.remove(id);
  }
}
