import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export enum StatusSolicitacaoPrivacidadeDto { EM_ANALISE = 'EM_ANALISE', CONCLUIDA = 'CONCLUIDA', RECUSADA = 'RECUSADA' }
export class ResolvePrivacyRequestDto {
  @IsEnum(StatusSolicitacaoPrivacidadeDto) status: StatusSolicitacaoPrivacidadeDto;
  @IsOptional() @IsString() @MaxLength(2000) resposta?: string;
}
