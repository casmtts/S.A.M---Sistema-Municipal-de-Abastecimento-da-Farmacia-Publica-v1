import { PartialType } from '@nestjs/mapped-types';
import { CreatePedidoDto } from './create-pedido.dto';
import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_ANALISE = 'EM_ANALISE',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  quantidadeEntregue?: number;
}
