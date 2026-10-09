import { createHmac, randomBytes } from 'crypto';

// Local development gets a process-scoped key instead of a predictable fallback.
// Production requires a persistent, separately managed AUDIT_IDENTIFIER_SECRET.
const processScopedDevelopmentKey = randomBytes(32);

export function hashAuditIdentifier(value: string): string {
  const configuredKey = process.env.AUDIT_IDENTIFIER_SECRET;
  if (process.env.NODE_ENV === 'production' && (!configuredKey || configuredKey.length < 32)) {
    throw new Error('AUDIT_IDENTIFIER_SECRET não está configurado corretamente.');
  }
  const key = configuredKey || processScopedDevelopmentKey;
  return createHmac('sha256', key).update(value).digest('hex');
}
