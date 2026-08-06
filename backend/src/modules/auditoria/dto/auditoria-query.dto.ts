import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AuditoriaQueryDto {
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  acao?: string;

  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;
}
