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
    seedDemoOrders: env.SEED_DEMO_ORDERS === 'true' || !isProd,
    port: Number(env.PORT) || 4000,
    dbDriver,
    sqlitePath: env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'sajian.db'),
    databaseUrl,
    jwtSecret,
    tokenTtlSeconds: Number(env.TOKEN_TTL_SECONDS) || 60 * 60 * 12,
    rememberTokenTtlSeconds: Number(env.REMEMBER_TOKEN_TTL_SECONDS) || 60 * 60 * 24 * 7,
    maxLoginAttempts: Number(env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutMinutes: Number(env.LOCKOUT_MINUTES) || 2,
    resetOtpTtlMinutes: Number(env.RESET_OTP_TTL_MINUTES) || 10,
    resendApiKey: env.RESEND_API_KEY?.trim() || '',
    mailFrom: env.MAIL_FROM?.trim() || '',
    corsOrigins,
  };
}
