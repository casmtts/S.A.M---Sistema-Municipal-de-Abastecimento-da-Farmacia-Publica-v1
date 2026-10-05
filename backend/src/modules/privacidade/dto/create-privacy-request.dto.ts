import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export enum TipoSolicitacaoPrivacidadeDto { ACESSO = 'ACESSO', CORRECAO = 'CORRECAO', ELIMINACAO = 'ELIMINACAO' }
export class CreatePrivacyRequestDto {
  @IsEnum(TipoSolicitacaoPrivacidadeDto) tipo: TipoSolicitacaoPrivacidadeDto;
  @IsOptional() @IsString() @MaxLength(1000) descricao?: string;
}
