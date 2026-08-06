import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUsuarioDto {
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
  @MinLength(6)
  @MaxLength(128)
  senha: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @MaxLength(120)
  cargo?: string;

  @IsOptional()
  @IsUUID()
  unidadeId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
