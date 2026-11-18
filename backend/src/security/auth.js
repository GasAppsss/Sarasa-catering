import crypto from 'node:crypto';
import { hasScope } from '../shared/rbac.js';

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Hash a PIN or password using salted scrypt.
 */
export function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verify a PIN against a stored salt:hash string in constant time.
 */
export function verifyPin(pin, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const actualBuf = crypto.scryptSync(String(pin), salt, 32);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Sign a compact HS256 JWT without third-party dependency quirks.
 */
export function signToken(payload, secret, ttlSeconds = 43200) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }));
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

/**
 * Verify HS256 JWT signature and expiration.
 */
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== 'number' || parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAuthMiddleware(jwtSecret) {
  function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const claims = verifyToken(token, jwtSecret);
    if (!claims) {
      return res.status(401).json({ error: 'Autentikasi diperlukan atau sesi telah berakhir.' });
    }
    req.user = claims;
    return next();
  }

  function requireScope(scope) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Autentikasi diperlukan.' });
      }
      if (!hasScope(req.user.role, scope)) {
        return res.status(403).json({
          error: `Akses ditolak. Role "${req.user.role}" tidak memiliki scope "${scope}".`,
        });
      }
      return next();
    };
  }

  return { requireAuth, requireScope };
}
