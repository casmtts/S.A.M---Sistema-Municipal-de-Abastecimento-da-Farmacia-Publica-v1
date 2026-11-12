import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(72)
  senhaAtual: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  novaSenha: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  confirmarSenha: string;
}
