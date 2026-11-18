/**
 * Authoritative Role-Based Access Control (RBAC) definitions and scope helpers.
 */
export const ROLES = Object.freeze({
  CLIENT: 'client',
  KITCHEN: 'kitchen',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
});

export const SCOPES = Object.freeze({
  SHOWCASE_VIEW: 'showcase:view',
  ORDER_CREATE: 'order:create',
  CLIENT_PORTAL_VIEW: 'client_portal:view',
  INVOICE_PRINT_OWN: 'invoice:print_own',
  KITCHEN_SHEET_VIEW: 'kitchen_sheet:view',
  KITCHEN_STAGE_UPDATE: 'kitchen_stage:update',
  KITCHEN_TICKET_PRINT: 'kitchen_ticket:print',
  ADMIN_ANALYTICS_VIEW: 'admin_analytics:view',
  ORDER_MANAGE_ALL: 'order:manage_all',
  CATALOG_MANAGE: 'catalog:manage',
  BUSINESS_SETTINGS_EDIT: 'business_settings:edit',
  DEV_THEME_TOKENS_EDIT: 'dev_theme_tokens:edit',
  DEV_FEATURE_FLAGS_EDIT: 'dev_feature_flags:edit',
  DEV_RBAC_PIN_EDIT: 'dev_rbac_pin:edit',
  DEV_SYSTEM_JSON_IO: 'dev_system_json:io',
});

export const ROLE_META = Object.freeze({
  [ROLES.CLIENT]: {
    id: ROLES.CLIENT,
    label: 'Klien / Pemesan',
    shortLabel: 'Klien',
    description: 'Menjelajahi katalog, menghitung estimasi biaya, membuat pesanan, dan memantau progres acara pribadi.',
  },
  [ROLES.KITCHEN]: {
    id: ROLES.KITCHEN,
    label: 'Admin Dapur & Produksi',
    shortLabel: 'Dapur',
    description: 'Mengakses Kitchen Sheet, rincian alergen, update tahap masak/QC, dan cetak tiket produksi tanpa melihat margin HPP.',
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    label: 'Administrator Bisnis',
    shortLabel: 'Admin',
    description: 'Mengelola omzet & margin KPI, pesanan, verifikasi DP, katalog menu, serta pengaturan operasional bisnis.',
  },
  [ROLES.DEVELOPER]: {
    id: ROLES.DEVELOPER,
    label: 'Pengembang Sistem',
    shortLabel: 'Developer',
    description: 'Akses penuh seluruh modul termasuk pengaturan tema, design tokens, feature flags, PIN keamanan, dan backup JSON.',
  },
});

const CLIENT_SCOPES = [
  SCOPES.SHOWCASE_VIEW,
  SCOPES.ORDER_CREATE,
  SCOPES.CLIENT_PORTAL_VIEW,
  SCOPES.INVOICE_PRINT_OWN,
];

const KITCHEN_SCOPES = [
  SCOPES.SHOWCASE_VIEW,
  SCOPES.KITCHEN_SHEET_VIEW,
  SCOPES.KITCHEN_STAGE_UPDATE,
  SCOPES.KITCHEN_TICKET_PRINT,
];

const ADMIN_SCOPES = [
  ...CLIENT_SCOPES,
  SCOPES.KITCHEN_SHEET_VIEW,
  SCOPES.ADMIN_ANALYTICS_VIEW,
  SCOPES.ORDER_MANAGE_ALL,
  SCOPES.CATALOG_MANAGE,
  SCOPES.BUSINESS_SETTINGS_EDIT,
];

const DEVELOPER_SCOPES = Object.values(SCOPES);

export const ROLE_SCOPES = Object.freeze({
  [ROLES.CLIENT]: Object.freeze(CLIENT_SCOPES),
  [ROLES.KITCHEN]: Object.freeze(KITCHEN_SCOPES),
  [ROLES.ADMIN]: Object.freeze(ADMIN_SCOPES),
  [ROLES.DEVELOPER]: Object.freeze(DEVELOPER_SCOPES),
});

export function getRoleScopes(role) {
  return ROLE_SCOPES[role] || [];
}

export function hasScope(role, requiredScope) {
  if (!requiredScope) return true;
  return getRoleScopes(role).includes(requiredScope);
}

export function isStaffRole(role) {
  return role === ROLES.KITCHEN || role === ROLES.ADMIN || role === ROLES.DEVELOPER;
}
