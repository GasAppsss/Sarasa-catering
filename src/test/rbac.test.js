import { describe, expect, it } from 'vitest';
import { getRoleScopes, hasScope, ROLES, SCOPES } from '../config/rbac.js';

describe('RBAC Role & Scope Matrix', () => {
  it('restricts client from kitchen, admin, and developer operations', () => {
    expect(hasScope(ROLES.CLIENT, SCOPES.SHOWCASE_VIEW)).toBe(true);
    expect(hasScope(ROLES.CLIENT, SCOPES.CLIENT_PORTAL_VIEW)).toBe(true);
    expect(hasScope(ROLES.CLIENT, SCOPES.KITCHEN_SHEET_VIEW)).toBe(false);
    expect(hasScope(ROLES.CLIENT, SCOPES.ADMIN_ANALYTICS_VIEW)).toBe(false);
    expect(hasScope(ROLES.CLIENT, SCOPES.DEV_THEME_TOKENS_EDIT)).toBe(false);
  });

  it('allows kitchen operational sheet & stage updates without business/dev scopes', () => {
    expect(hasScope(ROLES.KITCHEN, SCOPES.KITCHEN_SHEET_VIEW)).toBe(true);
    expect(hasScope(ROLES.KITCHEN, SCOPES.KITCHEN_STAGE_UPDATE)).toBe(true);
    expect(hasScope(ROLES.KITCHEN, SCOPES.ADMIN_ANALYTICS_VIEW)).toBe(false);
    expect(hasScope(ROLES.KITCHEN, SCOPES.CATALOG_MANAGE)).toBe(false);
    expect(hasScope(ROLES.KITCHEN, SCOPES.BUSINESS_SETTINGS_EDIT)).toBe(false);
    expect(hasScope(ROLES.KITCHEN, SCOPES.DEV_FEATURE_FLAGS_EDIT)).toBe(false);
  });

  it('grants admin full business management while isolating developer-only scopes', () => {
    expect(hasScope(ROLES.ADMIN, SCOPES.ADMIN_ANALYTICS_VIEW)).toBe(true);
    expect(hasScope(ROLES.ADMIN, SCOPES.CATALOG_MANAGE)).toBe(true);
    expect(hasScope(ROLES.ADMIN, SCOPES.BUSINESS_SETTINGS_EDIT)).toBe(true);
    expect(hasScope(ROLES.ADMIN, SCOPES.DEV_THEME_TOKENS_EDIT)).toBe(false);
    expect(hasScope(ROLES.ADMIN, SCOPES.DEV_RBAC_PIN_EDIT)).toBe(false);
    expect(hasScope(ROLES.ADMIN, SCOPES.DEV_SYSTEM_JSON_IO)).toBe(false);
  });

  it('grants developer every scope across the platform', () => {
    const devScopes = getRoleScopes(ROLES.DEVELOPER);
    for (const scope of Object.values(SCOPES)) {
      expect(devScopes).toContain(scope);
      expect(hasScope(ROLES.DEVELOPER, scope)).toBe(true);
    }
  });
});
