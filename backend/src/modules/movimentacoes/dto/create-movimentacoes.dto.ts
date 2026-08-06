import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
  IsNotEmpty,
  Max,
  MaxLength,
} from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  DISPENSA = 'DISPENSA',
}

export class CreateMovimentacaoDto {
  @IsUUID()
  @IsNotEmpty()
  medicamentoId: string;

  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;

  @IsNumber()
  @Min(1)
  @Max(100000000)
  quantidade: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentoReferencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;

  @IsOptional()
  @IsUUID()
  unidadeOrigemId?: string;

  @IsOptional()
  @IsUUID()
  unidadeDestinoId?: string;
}
