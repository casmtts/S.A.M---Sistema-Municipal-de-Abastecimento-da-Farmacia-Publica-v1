import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AuditoriaQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  usuarioId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  acao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  modulo?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Matches(/^\d{1,4}$/)
  page?: string;

  @IsOptional()
  @Matches(/^\d{1,4}$/)
  limit?: string;
}
