import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  senhaAtual: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  novaSenha: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  confirmarSenha: string;
}
