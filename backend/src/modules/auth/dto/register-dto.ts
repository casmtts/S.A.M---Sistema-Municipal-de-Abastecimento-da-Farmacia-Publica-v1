import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(20)
  cpf: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  senha: string;

  @IsOptional()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @MaxLength(120)
  cargo?: string;
}
