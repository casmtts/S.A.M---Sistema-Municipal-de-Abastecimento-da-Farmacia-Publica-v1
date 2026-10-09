import { IsOptional, IsString, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_ANALISE = 'EM_ANALISE',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export class UpdatePedidoDto {
  @IsOptional() @IsString() @MaxLength(1000) justificativa?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @IsOptional() @Type(() => Date) @IsDate() dataPrevistaEntrega?: Date;
}
