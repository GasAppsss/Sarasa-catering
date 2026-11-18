import crypto from 'node:crypto';
import path from 'node:path';

/**
 * Load runtime configuration from environment variables with secure production guards.
 */
export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  let jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    if (isProd) {
      throw new Error('JWT_SECRET is required when NODE_ENV=production');
    }
    // Ephemeral secret for local development / test sessions only.
    jwtSecret = crypto.randomBytes(32).toString('hex');
  }

  const databaseUrl = env.DATABASE_URL?.trim() || '';
  const dbDriver = env.DB_DRIVER?.trim() || (databaseUrl ? 'postgres' : 'sqlite');

  const rawOrigins = env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:4173,https://gasappsss.github.io';
  const corsOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    nodeEnv,
    isProd,
    port: Number(env.PORT) || 4000,
    dbDriver,
    sqlitePath: env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'sajian.db'),
    databaseUrl,
    jwtSecret,
    tokenTtlSeconds: Number(env.TOKEN_TTL_SECONDS) || 60 * 60 * 12,
    corsOrigins,
  };
}
