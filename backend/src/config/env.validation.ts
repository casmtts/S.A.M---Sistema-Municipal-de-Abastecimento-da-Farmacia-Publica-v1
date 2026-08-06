export function validateEnv(config: Record<string, any>) {
  const databaseUrl = String(config.DATABASE_URL || '');
  const jwtSecret = String(config.JWT_SECRET || '');
  const corsOrigins = String(config.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!databaseUrl || jwtSecret.length < 32 || corsOrigins.length === 0) {
    throw new Error('DATABASE_URL, JWT_SECRET e CORS_ORIGINS são obrigatórios.');
  }
  if (config.NODE_ENV === 'production' && /change|troque|local|development/i.test(jwtSecret)) {
    throw new Error('JWT_SECRET de produção inválido.');
  }
  return {
    ...config,
    PORT: Number(config.PORT || 3001),
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || '15m',
    CORS_ORIGINS: corsOrigins,
  };
}
