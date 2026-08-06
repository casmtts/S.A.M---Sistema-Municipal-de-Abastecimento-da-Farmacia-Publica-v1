import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export enum TipoUnidade {
  UBS = 'UBS',
  UPA = 'UPA',
  HOSPITAL = 'HOSPITAL',
  CENTRO_ESPECIALIZADO = 'CENTRO_ESPECIALIZADO',
  FARMACIA = 'FARMACIA',
}

export class CreateUnidadeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  nome: string;

  @IsEnum(TipoUnidade)
  tipo: TipoUnidade;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  codigo: string;

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
  responsavel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  horarioFuncionamento?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
