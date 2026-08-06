import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
  IsNotEmpty,
  Max,
} from 'class-validator';

export class CreateFornecedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  razaoSocial?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(18)
  cnpj: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  inscricaoEstadual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contato?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(3650)
  prazoEntrega?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  condicoesPagamento?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
