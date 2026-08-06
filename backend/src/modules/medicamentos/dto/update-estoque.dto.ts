import { IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class UpdateEstoqueDto {
  @IsNumber()
  @Min(1)
  @Max(100000000)
  quantidade: number;

  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;
}
