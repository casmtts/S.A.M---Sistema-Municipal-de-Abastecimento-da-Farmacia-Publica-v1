import {
  IsString,
  IsNumber,
  IsInt,
  IsUUID,
  IsOptional,
  Min,
  IsDate,
  IsNotEmpty,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePedidoDto {
  @IsUUID()
  @IsNotEmpty()
  medicamentoId: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(100000000)
  quantidadeSolicitada: number;

  @Type(() => Date)
  @IsDate()
  dataPrevistaEntrega: Date;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justificativa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
