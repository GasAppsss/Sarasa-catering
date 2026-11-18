export const STORAGE_KEYS = Object.freeze({
  CONFIG: 'sajian_v2_config',
  PACKAGES: 'sajian_v2_packages',
  STALLS: 'sajian_v2_stalls',
  ORDERS: 'sajian_v2_orders',
  PINS: 'sajian_v2_role_pins',
  AUDIT: 'sajian_v2_audit_logs',
  API_URL: 'sajian_v2_api_url',
  TOKEN: 'sajian_v2_auth_token',
  ROLE: 'sajian_v2_auth_role',
});

export function readStorageJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/private-mode storage failures gracefully.
  }
}

export function readStorageText(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageText(key, value) {
  try {
    if (!value) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors gracefully.
  }
}

export function validateImportedSnapshot(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('File konfigurasi harus berupa objek JSON yang valid.');
  }
  if (payload.config && typeof payload.config !== 'object') {
    throw new Error('Bagian "config" tidak valid.');
  }
  if (payload.packages && !Array.isArray(payload.packages)) {
    throw new Error('Bagian "packages" harus berupa array.');
  }
  if (payload.orders && !Array.isArray(payload.orders)) {
    throw new Error('Bagian "orders" harus berupa array.');
  }
  return true;
}
