export const STORAGE_KEYS = Object.freeze({
  CONFIG: 'sajian_v3_config',
  PACKAGES: 'sajian_v3_packages',
  STALLS: 'sajian_v3_stalls',
  ORDERS: 'sajian_v3_orders',
  PINS: 'sajian_v3_role_pins',
  AUDIT: 'sajian_v3_audit_logs',
  API_URL: 'sajian_v3_api_url',
  TOKEN: 'sajian_v3_auth_token',
  ROLE: 'sajian_v3_auth_role',
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
