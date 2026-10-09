import { IsNumber, IsInt, IsEnum, IsString, IsNotEmpty, MaxLength, IsOptional, Min, Max } from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class UpdateEstoqueDto {
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(100000000)
  quantidade: number;

  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentoReferencia: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}
