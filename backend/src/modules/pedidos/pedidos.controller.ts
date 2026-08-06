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
  ParseUUIDPipe,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('pedidos')
@UseGuards(RolesGuard)
@Permissions('pedidos.visualizar')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Get('pendentes')
  getPendentes() {
    return this.pedidosService.getPedidosPendentes();
  }

  @Get('atrasados')
  getAtrasados() {
    return this.pedidosService.getPedidosAtrasados();
  }

  @Get('resumo')
  getResumo() {
    return this.pedidosService.getResumo();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidosService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO, UserRole.GESTOR)
  @Permissions('pedidos.criar')
  create(@Body() createPedidoDto: CreatePedidoDto, @Request() req) {
    return this.pedidosService.create(createPedidoDto, req.user.id);
  }

  @Patch(':id/aprovar')
  @Roles(UserRole.ADMIN, UserRole.GESTOR)
  @Permissions('pedidos.aprovar')
  aprovar(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.pedidosService.aprovar(id, req.user.id);
  }

  @Patch(':id/entregar')
  @Roles(UserRole.ADMIN, UserRole.FARMACEUTICO)
  @Permissions('pedidos.entregar')
  registrarEntrega(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantidade') quantidade: number,
  ) {
    return this.pedidosService.registrarEntrega(id, quantidade);
  }

  @Patch(':id/cancelar')
  @Roles(UserRole.ADMIN, UserRole.GESTOR)
  @Permissions('pedidos.cancelar')
  cancelar(@Param('id', ParseUUIDPipe) id: string, @Body('motivo') motivo: string) {
    return this.pedidosService.cancelar(id, motivo);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('pedidos.editar')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('pedidos.excluir')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidosService.remove(id);
  }
}
