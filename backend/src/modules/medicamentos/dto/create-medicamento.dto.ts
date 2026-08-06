import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
  IsNotEmpty,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  principioAtivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  concentracao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  formaFarmaceutica?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lote?: string;

  @Type(() => Date)
  @IsDate()
  validade: Date;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  quantidadeAtual: number;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  quantidadeMinima: number;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  quantidadeMaxima: number;

  @IsNumber()
  @Min(0)
  @Max(1000000000)
  precoUnitario: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  fornecedorId?: string;
}
