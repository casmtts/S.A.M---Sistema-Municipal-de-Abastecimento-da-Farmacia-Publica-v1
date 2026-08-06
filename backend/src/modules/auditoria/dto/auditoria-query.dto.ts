import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, IsUUID } from 'class-validator';

export enum AuditoriaStatus {
  SUCESSO = 'SUCESSO',
  FALHA = 'FALHA',
}

export enum AuditoriaFormato {
  PDF = 'PDF',
  CSV = 'CSV',
}

export class AuditoriaQueryDto {
  @IsOptional()
  @IsUUID()
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
  @IsString()
  @MaxLength(80)
  recurso?: string;

  @IsOptional()
  @IsEnum(AuditoriaStatus)
  status?: AuditoriaStatus;

  @IsOptional()
  @IsEnum(AuditoriaFormato)
  formato?: AuditoriaFormato;

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
