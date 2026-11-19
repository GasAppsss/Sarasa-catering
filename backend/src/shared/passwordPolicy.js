/**
 * Shared password policy, strength evaluator, and identifier helpers
 * used consistently across Frontend (preview/local mode) and Backend API.
 */

export function normalizeIdentifier(value = '') {
  return String(value).trim().toLowerCase();
}

export function normalizeRecoveryKey(value = '') {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function maskEmail(email = '') {
  const clean = String(email).trim();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, Math.min(6, local.length - visible.length)))}@${domain}`;
}

export function evaluatePasswordStrength(password = '') {
  const pw = String(password || '');
  const rules = {
    minLength: pw.length >= 8,
    hasLower: /[a-z]/.test(pw),
    hasUpper: /[A-Z]/.test(pw),
    hasNumber: /\d/.test(pw),
    hasSymbol: /[^A-Za-z0-9]/.test(pw),
  };

  let score = 0;
  if (rules.minLength) score += 1;
  if (rules.hasLower && rules.hasUpper) score += 1;
  if (rules.hasNumber) score += 1;
  if (rules.hasSymbol || pw.length >= 12) score += 1;

  const valid = rules.minLength && rules.hasLower && rules.hasUpper && (rules.hasNumber || rules.hasSymbol);

  const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
  return {
    score,
    label: pw.length === 0 ? 'Belum diisi' : labels[score] || 'Lemah',
    rules,
    valid,
  };
}

export function getPasswordPolicyError(password = '') {
  const result = evaluatePasswordStrength(password);
  if (!result.rules.minLength) return 'Password minimal 8 karakter.';
  if (!result.rules.hasUpper || !result.rules.hasLower) {
    return 'Password wajib mengandung huruf besar dan huruf kecil.';
  }
  if (!result.rules.hasNumber && !result.rules.hasSymbol) {
    return 'Password wajib mengandung minimal 1 angka atau simbol.';
  }
  return '';
}
