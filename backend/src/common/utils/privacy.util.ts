/**
 * Utilitários de minimização de dados (LGPD art. 6º, III) e de proteção de exportações.
 */

/** CPF mascarado: ***.456.789-** (mantém apenas os dígitos centrais). */
export function maskCpf(cpf?: string | null): string {
  if (!cpf) return '';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return '***';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** Telefone mascarado: mantém DDD e os 2 últimos dígitos. */
export function maskTelefone(tel?: string | null): string {
  if (!tel) return '';
  const d = tel.replace(/\D/g, '');
  if (d.length < 8) return '***';
  return `(${d.slice(0, 2)}) *****-**${d.slice(-2)}`;
}

/**
 * Neutraliza injeção de fórmulas (CSV/Excel injection, OWASP): textos iniciados por
 * = + - @ tab ou CR são prefixados com apóstrofo para serem tratados como texto.
 */
export function neutralizeFormula<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
