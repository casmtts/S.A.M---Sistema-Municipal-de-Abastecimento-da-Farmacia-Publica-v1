/**
 * Política de retenção de referência (docs/lgpd/04-politica-de-retencao.md).
 * Os prazos finais devem ser validados pela procuradoria e pela tabela de temporalidade
 * do município (Lei 8.159/1991). Valores em dias.
 */
export const RETENTION_POLICY = {
  /** Registros de acesso (data/hora, IP com hash, usuário). Referência: Marco Civil art. 15 (6 meses). */
  accessLogsDays: 180,
  /** Trilha de auditoria de movimentações: acompanha a guarda do documento (Portaria 344/98, art. 64: 2 anos). */
  auditTrailDays: 730,
  /** Registro de incidentes de segurança: Res. CD/ANPD 15/2024, art. 10 (5 anos). */
  incidentRecordsDays: 1825,
  /** SLA de resposta a titulares: LGPD art. 19, II (15 dias). */
  dataSubjectResponseDays: 15,
} as const;

export function prazoRespostaTitular(criadaEm: Date): Date {
  return new Date(criadaEm.getTime() + RETENTION_POLICY.dataSubjectResponseDays * 86_400_000);
}
