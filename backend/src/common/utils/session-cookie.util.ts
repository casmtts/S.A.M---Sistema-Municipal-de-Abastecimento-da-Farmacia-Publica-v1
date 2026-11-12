import type { Response } from 'express';

export const SESSION_COOKIE = 'sam_session';

function seconds(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

/** Intervalo de rotação do token de sessão (padrão: 10 minutos). */
export function sessionRotateSeconds() {
  return seconds(process.env.SESSION_ROTATE_SECONDS, 600, 60, 3600);
}

/** Vida máxima de uma sessão desde o login, mesmo com rotações (padrão: 8 horas). */
export function sessionAbsoluteMaxSeconds() {
  return seconds(process.env.SESSION_ABSOLUTE_MAX_SECONDS, 8 * 3600, 900, 24 * 3600);
}

/** Validade de cada token individual; precisa ser maior que o intervalo de rotação. */
export function sessionTokenMaxAgeMs() {
  const configured = process.env.JWT_EXPIRES_IN || '15m';
  const match = /^(\d+)(s|m|h|d)$/.exec(configured);
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const ms = match ? Number(match[1]) * units[match[2]] : 15 * 60_000;
  const floor = (sessionRotateSeconds() + 300) * 1000; // sempre >= rotação + 5 min
  return Math.min(Math.max(ms, floor), 24 * 3_600_000);
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionTokenMaxAgeMs(),
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
}
