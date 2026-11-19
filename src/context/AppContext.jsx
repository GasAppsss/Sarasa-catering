import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPasswordPolicyError,
  maskEmail,
  normalizeIdentifier,
  normalizeRecoveryKey,
} from '../../backend/src/shared/passwordPolicy.js';
import {
  buildDefaultAppConfig,
  DEFAULT_ROLE_PINS,
  DEFAULT_STAFF_ACCOUNTS,
  THEME_PRESETS,
} from '../config/defaults.js';
import { getRoleScopes, hasScope, ROLE_META, ROLES, SCOPES } from '../config/rbac.js';
import {
  buildInitialOrders,
  INITIAL_PACKAGES,
  INITIAL_STALLS,
} from '../data/seedData.js';
import { createApiClient, normalizeBaseUrl } from '../services/apiClient.js';
import { getDateOffset, hexToRgbTriplet, phonesMatch } from '../utils/format.js';
import { calculateOrderPricing, computeCalendarDates, computeKpiStats } from '../utils/pricing.js';
import {
  readStorageJson,
  readStorageText,
  STORAGE_KEYS,
  validateImportedSnapshot,
  writeStorageJson,
  writeStorageText,
} from '../utils/storage.js';

const AppContext = createContext(null);

function applyThemeToDocument(themeTokens) {
  if (typeof document === 'undefined' || !themeTokens) return;
  const root = document.documentElement;
  root.style.setProperty('--sc-primary', themeTokens.primary || '#064E3B');
  root.style.setProperty('--sc-primary-rgb', hexToRgbTriplet(themeTokens.primary || '#064E3B'));
  root.style.setProperty('--sc-primary-dark', themeTokens.primaryDark || '#043927');
  root.style.setProperty('--sc-primary-dark-rgb', hexToRgbTriplet(themeTokens.primaryDark || '#043927'));
  root.style.setProperty('--sc-accent', themeTokens.accent || '#F59E0B');
  root.style.setProperty('--sc-accent-rgb', hexToRgbTriplet(themeTokens.accent || '#F59E0B'));
  root.style.setProperty('--sc-bg', themeTokens.background || '#F5F3EE');
  root.style.setProperty('--sc-bg-rgb', hexToRgbTriplet(themeTokens.background || '#F5F3EE'));
  root.style.setProperty('--sc-surface', themeTokens.surface || '#FFFFFF');
  root.style.setProperty('--sc-surface-rgb', hexToRgbTriplet(themeTokens.surface || '#FFFFFF'));

  const radiusMap = { sharp: '0.5rem', rounded: '1.25rem', pill: '1.75rem' };
  root.style.setProperty('--sc-radius', radiusMap[themeTokens.radiusScale] || '1.25rem');
  root.setAttribute('data-reduce-motion', themeTokens.reduceMotion ? 'true' : 'false');
}

const LOCAL_MAX_LOGIN_ATTEMPTS = 5;
const LOCAL_LOCKOUT_MS = 2 * 60 * 1000;
const LOCAL_OTP_TTL_MS = 10 * 60 * 1000;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildInitialStaffAccounts() {
  const nowIso = new Date().toISOString();
  return Object.fromEntries(
    Object.entries(DEFAULT_STAFF_ACCOUNTS).map(([role, acc]) => [
      role,
      {
        ...acc,
        failedAttempts: 0,
        lockedUntil: null,
        resetChallenge: null,
        updatedAt: nowIso,
      },
    ])
  );
}

function hydrateStaffAccounts() {
  const base = buildInitialStaffAccounts();
  const saved = readStorageJson(STORAGE_KEYS.ACCOUNTS, null);
  if (!saved || typeof saved !== 'object') return base;
  const merged = {};
  for (const [role, defAcc] of Object.entries(base)) {
    const existing = saved[role];
    merged[role] = existing && typeof existing === 'object' ? { ...defAcc, ...existing, role } : defAcc;
  }
  return merged;
}

function generateLocalOtpCode() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateLocalRecoveryKey(role = 'admin') {
  const tagMap = { admin: 'ADM', developer: 'DEV', kitchen: 'KTC' };
  const tag = tagMap[role] || 'STF';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const chars = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]);
  return `SJC-${tag}-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`;
}

function toSafeAccountMeta(acc) {
  if (!acc) return null;
  return {
    role: acc.role,
    username: acc.username,
    email: acc.email,
    displayName: acc.displayName || ROLE_META[acc.role]?.label || acc.role,
    failedAttempts: Number(acc.failedAttempts || 0),
    lockedUntil: acc.lockedUntil || null,
    updatedAt: acc.updatedAt || null,
  };
}

function replaceLegacyBrandText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/SARASA CATERING/g, 'SAJIAN CATERING')
    .replace(/Sarasa Catering/gi, 'Sajian Catering')
    .replace(/\bSARASA\b/g, 'SAJIAN')
    .replace(/\bSarasa\b/gi, 'Sajian')
    .replace(/sarasacatering/gi, 'sajiancatering');
}

export function hydrateSanitizedConfig() {
  const defaults = buildDefaultAppConfig();
  const saved = readStorageJson(STORAGE_KEYS.CONFIG, null);
  if (!saved || typeof saved !== 'object') return defaults;

  const brand = {
    ...defaults.brand,
    ...(saved.brand || {}),
  };
  brand.name = replaceLegacyBrandText(brand.name);
  brand.shortName = replaceLegacyBrandText(brand.shortName);
  brand.subName = replaceLegacyBrandText(brand.subName);
  brand.tagline = replaceLegacyBrandText(brand.tagline);

  const business = {
    ...defaults.business,
    ...(saved.business || {}),
  };
  business.email = replaceLegacyBrandText(business.email);
  business.instagram = replaceLegacyBrandText(business.instagram);
  if (business.whatsappNumber === '6281234567890') {
    business.whatsappNumber = defaults.business.whatsappNumber;
    business.phoneDisplay = defaults.business.phoneDisplay;
  }
  if (business.bankAccountNumber === '521-089-4412') {
    business.bankName = defaults.business.bankName;
    business.bankAccountNumber = defaults.business.bankAccountNumber;
    business.bankAccountHolder = defaults.business.bankAccountHolder;
  }

  return {
    ...defaults,
    ...saved,
    brand,
    business,
  };
}

export function AppProvider({ children }) {
  const defaultApiUrl = normalizeBaseUrl(
    readStorageText(STORAGE_KEYS.API_URL, import.meta.env.VITE_API_URL || '')
  );

  const [apiUrl, setApiUrlState] = useState(defaultApiUrl);
  const [backendStatus, setBackendStatus] = useState(defaultApiUrl ? 'connecting' : 'local-demo');
  const [authToken, setAuthToken] = useState(() => readStorageText(STORAGE_KEYS.TOKEN, ''));
  const [activeRole, setActiveRole] = useState(() => {
    const saved = readStorageText(STORAGE_KEYS.ROLE, ROLES.CLIENT);
    return Object.values(ROLES).includes(saved) ? saved : ROLES.CLIENT;
  });
  const [activeView, setActiveView] = useState(() => {
    const savedRole = readStorageText(STORAGE_KEYS.ROLE, ROLES.CLIENT);
    if (savedRole === ROLES.KITCHEN) return 'kitchen';
    if (savedRole === ROLES.ADMIN) return 'admin';
    if (savedRole === ROLES.DEVELOPER) return 'developer';
    return 'showcase';
  });

  const [config, setConfig] = useState(() => hydrateSanitizedConfig());
  const [packages, setPackages] = useState(() => readStorageJson(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES));
  const [stalls, setStalls] = useState(() => readStorageJson(STORAGE_KEYS.STALLS, INITIAL_STALLS));
  const [orders, setOrders] = useState(() => readStorageJson(STORAGE_KEYS.ORDERS, buildInitialOrders()));
  const [serverCalendarSlots, setServerCalendarSlots] = useState(null);
  const [rolePins, setRolePins] = useState(() => readStorageJson(STORAGE_KEYS.PINS, DEFAULT_ROLE_PINS));
  const [staffAccounts, setStaffAccounts] = useState(() => hydrateStaffAccounts());
  const [serverStaffAccounts, setServerStaffAccounts] = useState(null);
  const [auditLogs, setAuditLogs] = useState(() => readStorageJson(STORAGE_KEYS.AUDIT, []));
  const [likedIds, setLikedIds] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const api = useMemo(
    () => createApiClient(() => apiUrl, () => authToken),
    [apiUrl, authToken]
  );

  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const recordLocalAudit = useCallback((actorRole, action, targetId, summary) => {
    setAuditLogs((prev) => [
      { id: Date.now(), actorRole, action, targetId, summary, createdAt: new Date().toISOString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  useEffect(() => {
    applyThemeToDocument(config?.themeTokens);
    writeStorageJson(STORAGE_KEYS.CONFIG, config);
  }, [config]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.PACKAGES, packages);
  }, [packages]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.STALLS, stalls);
  }, [stalls]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.PINS, rolePins);
  }, [rolePins]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.ACCOUNTS, staffAccounts);
  }, [staffAccounts]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.AUDIT, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    writeStorageText(STORAGE_KEYS.ROLE, activeRole);
  }, [activeRole]);

  useEffect(() => {
    writeStorageText(STORAGE_KEYS.TOKEN, authToken);
  }, [authToken]);

  const syncPublicBootstrap = useCallback(async () => {
    if (!apiUrl) {
      setBackendStatus('local-demo');
      setServerCalendarSlots(null);
      return;
    }
    try {
      const data = await api.getBootstrap();
      if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
      if (Array.isArray(data.packages)) setPackages(data.packages);
      if (Array.isArray(data.stalls)) setStalls(data.stalls);
      if (Array.isArray(data.calendarSlots)) setServerCalendarSlots(data.calendarSlots);
      setBackendStatus('connected');
    } catch {
      setBackendStatus('offline-fallback');
    }
  }, [api, apiUrl]);

  useEffect(() => {
    syncPublicBootstrap();
  }, [syncPublicBootstrap]);

  const refreshProtectedData = useCallback(
    async (roleToLoad = activeRole, tokenOverride = authToken) => {
      if (!apiUrl || backendStatus === 'local-demo' || !tokenOverride) return;
      try {
        const client = createApiClient(() => apiUrl, () => tokenOverride);
        if (roleToLoad === ROLES.DEVELOPER) {
          const state = await client.getDeveloperState();
          if (state.config) setConfig(state.config);
          if (state.packages) setPackages(state.packages);
          if (state.stalls) setStalls(state.stalls);
          if (state.orders) setOrders(state.orders);
          if (state.auditLogs) setAuditLogs(state.auditLogs);
          if (Array.isArray(state.staffAccounts)) setServerStaffAccounts(state.staffAccounts);
        } else if (roleToLoad === ROLES.ADMIN) {
          const dash = await client.getAdminDashboard();
          if (dash.config) setConfig(dash.config);
          if (dash.packages) setPackages(dash.packages);
          if (dash.stalls) setStalls(dash.stalls);
          if (dash.orders) setOrders(dash.orders);
          if (dash.auditLogs) setAuditLogs(dash.auditLogs);
          const acct = await client.getAuthAccounts().catch(() => null);
          if (acct?.accounts) setServerStaffAccounts(acct.accounts);
        } else if (roleToLoad === ROLES.KITCHEN) {
          const res = await client.getKitchenSheet();
          if (res.sheet?.ordersOnDate) {
            setOrders((prev) => {
              const incomingIds = new Set(res.sheet.ordersOnDate.map((o) => o.id));
              const kept = prev.filter((o) => !incomingIds.has(o.id));
              return [...res.sheet.ordersOnDate, ...kept];
            });
          }
        }
      } catch {
        // Keep cached UI state if network momentarily fails.
      }
    },
    [activeRole, apiUrl, authToken, backendStatus]
  );

  const navigateView = useCallback(
    (targetView) => {
      if (targetView === 'kitchen' && !hasScope(activeRole, SCOPES.KITCHEN_SHEET_VIEW)) {
        triggerToast('Akses ditolak: login sebagai Admin Dapur terlebih dahulu.');
        return false;
      }
      if (targetView === 'admin' && !hasScope(activeRole, SCOPES.ADMIN_ANALYTICS_VIEW)) {
        triggerToast('Akses ditolak: login sebagai Administrator terlebih dahulu.');
        return false;
      }
      if (targetView === 'developer' && !hasScope(activeRole, SCOPES.DEV_THEME_TOKENS_EDIT)) {
        triggerToast('Akses ditolak: khusus role Pengembang.');
        return false;
      }
      setActiveView(targetView);
      return true;
    },
    [activeRole, triggerToast]
  );

  const findLocalAccountByIdentifier = useCallback(
    (identifier) => {
      const key = normalizeIdentifier(identifier);
      if (!key) return null;
      return (
        Object.values(staffAccounts).find(
          (acc) => normalizeIdentifier(acc.email) === key || normalizeIdentifier(acc.username) === key
        ) || null
      );
    },
    [staffAccounts]
  );

  const authenticateStaff = useCallback(
    async ({ identifier, password, role: requestedRole, rememberMe = false }) => {
      const cleanId = String(identifier || '').trim();
      const cleanPw = String(password || '');
      if (!cleanId || !cleanPw) {
        throw new Error('Email/username dan password wajib diisi.');
      }

      if (apiUrl && backendStatus === 'connected') {
        const res = await api.login({
          identifier: cleanId,
          password: cleanPw,
          role: requestedRole,
          rememberMe,
        });
        setAuthToken(res.token);
        setActiveRole(res.role);
        setActiveView(res.role === ROLES.KITCHEN ? 'kitchen' : res.role === ROLES.ADMIN ? 'admin' : 'developer');
        await refreshProtectedData(res.role, res.token);
        triggerToast(`Selamat datang, ${res.account?.displayName || ROLE_META[res.role]?.label || res.role}.`);
        return { ok: true, role: res.role, account: res.account };
      }

      const acc = findLocalAccountByIdentifier(cleanId);
      if (!acc) {
        throw new Error('Email/username atau password tidak valid.');
      }
      if (requestedRole && acc.role !== requestedRole) {
        throw new Error(
          `Akun ini terdaftar sebagai ${ROLE_META[acc.role]?.shortLabel || acc.role}, bukan ${ROLE_META[requestedRole]?.shortLabel || requestedRole}. Pilih tab role yang sesuai.`
        );
      }
      if (acc.lockedUntil) {
        const lockEnds = new Date(acc.lockedUntil).getTime();
        if (lockEnds > Date.now()) {
          const sec = Math.ceil((lockEnds - Date.now()) / 1000);
          throw new Error(
            `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${sec} detik atau gunakan Lupa Password.`
          );
        }
      }

      const expectedPw = acc.password || rolePins[acc.role];
      if (cleanPw !== String(expectedPw)) {
        const nextAttempts = Number(acc.failedAttempts || 0) + 1;
        const lockedUntil =
          nextAttempts >= LOCAL_MAX_LOGIN_ATTEMPTS
            ? new Date(Date.now() + LOCAL_LOCKOUT_MS).toISOString()
            : null;
        setStaffAccounts((prev) => ({
          ...prev,
          [acc.role]: {
            ...prev[acc.role],
            failedAttempts: nextAttempts,
            lockedUntil,
          },
        }));
        const remaining = Math.max(0, LOCAL_MAX_LOGIN_ATTEMPTS - nextAttempts);
        if (lockedUntil) {
          throw new Error(
            `Terlalu banyak percobaan gagal (${LOCAL_MAX_LOGIN_ATTEMPTS}x). Akun dikunci sementara selama 2 menit.`
          );
        }
        throw new Error(`Password tidak valid. Sisa ${remaining} percobaan sebelum akun dikunci sementara.`);
      }

      setStaffAccounts((prev) => ({
        ...prev,
        [acc.role]: { ...prev[acc.role], failedAttempts: 0, lockedUntil: null },
      }));
      setActiveRole(acc.role);
      setActiveView(acc.role === ROLES.KITCHEN ? 'kitchen' : acc.role === ROLES.ADMIN ? 'admin' : 'developer');
      recordLocalAudit(acc.role, 'AUTH_LOGIN', acc.username, `Login berhasil sebagai ${acc.displayName}`);
      triggerToast(`Selamat datang, ${acc.displayName}.`);
      return { ok: true, role: acc.role, account: toSafeAccountMeta(acc) };
    },
    [
      api,
      apiUrl,
      backendStatus,
      findLocalAccountByIdentifier,
      recordLocalAudit,
      refreshProtectedData,
      rolePins,
      triggerToast,
    ]
  );

  const authenticateRole = useCallback(
    async (role, pin) => {
      if (role === ROLES.CLIENT) {
        setActiveRole(ROLES.CLIENT);
        setAuthToken('');
        setActiveView('showcase');
        return { ok: true };
      }
      const target = staffAccounts[role];
      return authenticateStaff({
        identifier: target?.email || role,
        password: pin,
        role,
      });
    },
    [authenticateStaff, staffAccounts]
  );

  const requestPasswordReset = useCallback(
    async ({ identifier, role: requestedRole }) => {
      const cleanId = String(identifier || '').trim();
      if (!cleanId) throw new Error('Masukkan email atau username akun Anda.');

      if (apiUrl && backendStatus === 'connected') {
        return api.requestPasswordReset({ identifier: cleanId, role: requestedRole });
      }

      const acc = findLocalAccountByIdentifier(cleanId);
      if (!acc || (requestedRole && acc.role !== requestedRole)) {
        throw new Error('Akun dengan email atau username tersebut tidak ditemukan.');
      }

      const otpCode = generateLocalOtpCode();
      const expiresAt = new Date(Date.now() + LOCAL_OTP_TTL_MS).toISOString();
      setStaffAccounts((prev) => ({
        ...prev,
        [acc.role]: {
          ...prev[acc.role],
          resetChallenge: { code: otpCode, expiresAt, attempts: 0 },
        },
      }));
      recordLocalAudit(acc.role, 'AUTH_RESET_REQUESTED', acc.username, 'Kode OTP lupa password dibuat (Mode Preview)');
      return {
        ok: true,
        message: `Kode OTP 6-digit telah dibuat untuk ${maskEmail(acc.email)}.`,
        maskedEmail: maskEmail(acc.email),
        role: acc.role,
        expiresAt,
        expiresInSeconds: Math.floor(LOCAL_OTP_TTL_MS / 1000),
        deliveryMode: 'preview-local',
        previewCode: otpCode,
      };
    },
    [api, apiUrl, backendStatus, findLocalAccountByIdentifier, recordLocalAudit]
  );

  const verifyPasswordResetCode = useCallback(
    async ({ identifier, code }) => {
      const cleanCode = String(code || '').trim();
      if (!/^\d{6}$/.test(cleanCode)) {
        throw new Error('Kode OTP harus terdiri dari 6 digit angka.');
      }
      if (apiUrl && backendStatus === 'connected') {
        return api.verifyResetCode({ identifier, code: cleanCode });
      }

      const acc = findLocalAccountByIdentifier(identifier);
      const challenge = acc?.resetChallenge;
      if (!acc || !challenge) {
        throw new Error('Permintaan reset tidak ditemukan atau sudah kedaluwarsa.');
      }
      if (new Date(challenge.expiresAt).getTime() < Date.now()) {
        setStaffAccounts((prev) => ({
          ...prev,
          [acc.role]: { ...prev[acc.role], resetChallenge: null },
        }));
        throw new Error('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
      }
      if (Number(challenge.attempts || 0) >= 5) {
        setStaffAccounts((prev) => ({
          ...prev,
          [acc.role]: { ...prev[acc.role], resetChallenge: null },
        }));
        throw new Error('Terlalu banyak percobaan OTP salah. Silakan minta kode baru.');
      }
      if (challenge.code !== cleanCode) {
        const nextAttempts = Number(challenge.attempts || 0) + 1;
        setStaffAccounts((prev) => ({
          ...prev,
          [acc.role]: {
            ...prev[acc.role],
            resetChallenge: { ...challenge, attempts: nextAttempts },
          },
        }));
        const left = Math.max(0, 5 - nextAttempts);
        throw new Error(
          left > 0 ? `Kode OTP tidak sesuai. Sisa ${left} percobaan.` : 'Batas percobaan OTP habis. Minta kode baru.'
        );
      }

      return { ok: true, role: acc.role, maskedEmail: maskEmail(acc.email) };
    },
    [api, apiUrl, backendStatus, findLocalAccountByIdentifier]
  );

  const completePasswordReset = useCallback(
    async ({ method, identifier, code, recoveryKey, newPassword, confirmPassword }) => {
      const policyErr = getPasswordPolicyError(newPassword);
      if (policyErr) throw new Error(policyErr);
      if (newPassword !== confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok.');
      }

      if (apiUrl && backendStatus === 'connected') {
        const res = await api.resetPassword({
          method,
          identifier,
          code,
          recoveryKey,
          newPassword,
          confirmPassword,
        });
        triggerToast('Password berhasil direset. Silakan masuk dengan password baru.');
        return res;
      }

      const acc = findLocalAccountByIdentifier(identifier);
      if (!acc) {
        throw new Error('Akun dengan email atau username tersebut tidak ditemukan.');
      }

      if (method === 'otp') {
        const challenge = acc.resetChallenge;
        if (!challenge) {
          throw new Error('Kode OTP belum diminta atau sudah kedaluwarsa.');
        }
        if (new Date(challenge.expiresAt).getTime() < Date.now()) {
          throw new Error('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
        }
        if (challenge.code !== String(code || '').trim()) {
          throw new Error('Kode OTP tidak valid.');
        }
      } else {
        if (normalizeRecoveryKey(recoveryKey) !== normalizeRecoveryKey(acc.recoveryKey)) {
          throw new Error('Master Recovery Key tidak cocok dengan akun tersebut.');
        }
      }

      const nowIso = new Date().toISOString();
      setStaffAccounts((prev) => ({
        ...prev,
        [acc.role]: {
          ...prev[acc.role],
          password: newPassword,
          failedAttempts: 0,
          lockedUntil: null,
          resetChallenge: null,
          updatedAt: nowIso,
        },
      }));
      setRolePins((prev) => ({ ...prev, [acc.role]: newPassword }));
      recordLocalAudit(
        acc.role,
        'AUTH_PASSWORD_RESET',
        acc.username,
        `Password akun ${acc.role} direset via ${method === 'otp' ? 'Email OTP' : 'Master Recovery Key'}`
      );
      triggerToast('Password baru berhasil disimpan! Silakan login kembali.');
      return {
        ok: true,
        role: acc.role,
        email: acc.email,
        message: 'Password baru berhasil disimpan.',
      };
    },
    [api, apiUrl, backendStatus, findLocalAccountByIdentifier, recordLocalAudit, triggerToast]
  );

  const changeOwnPassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) => {
      const policyErr = getPasswordPolicyError(newPassword);
      if (policyErr) throw new Error(policyErr);
      if (newPassword !== confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok.');
      }
      if (currentPassword === newPassword) {
        throw new Error('Password baru harus berbeda dari password saat ini.');
      }

      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.changePassword({ currentPassword, newPassword, confirmPassword });
        triggerToast('Password akun Anda berhasil diperbarui di server.');
        return res;
      }

      const acc = staffAccounts[activeRole];
      if (!acc || String(currentPassword) !== String(acc.password)) {
        throw new Error('Password saat ini tidak sesuai.');
      }
      const nowIso = new Date().toISOString();
      setStaffAccounts((prev) => ({
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          password: newPassword,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: nowIso,
        },
      }));
      setRolePins((prev) => ({ ...prev, [activeRole]: newPassword }));
      recordLocalAudit(activeRole, 'AUTH_PASSWORD_CHANGED', acc.username, 'Memperbarui password akun secara mandiri');
      triggerToast('Password akun Anda berhasil diperbarui.');
      return { ok: true };
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, staffAccounts, triggerToast]
  );

  const rotateAccountRecoveryKey = useCallback(
    async ({ currentPassword, targetRole }) => {
      const roleToRotate = targetRole || activeRole;
      if (roleToRotate !== activeRole && activeRole !== ROLES.DEVELOPER) {
        throw new Error('Hanya Pengembang yang dapat merotasi Recovery Key akun lain.');
      }

      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.rotateRecoveryKey({ currentPassword, targetRole: roleToRotate });
        triggerToast(`Master Recovery Key untuk ${ROLE_META[roleToRotate]?.shortLabel} berhasil diperbarui.`);
        return res;
      }

      const actor = staffAccounts[activeRole];
      if (!actor || String(currentPassword) !== String(actor.password)) {
        throw new Error('Verifikasi password Anda gagal.');
      }

      const newRecoveryKey = generateLocalRecoveryKey(roleToRotate);
      const nowIso = new Date().toISOString();
      setStaffAccounts((prev) => ({
        ...prev,
        [roleToRotate]: {
          ...prev[roleToRotate],
          recoveryKey: newRecoveryKey,
          updatedAt: nowIso,
        },
      }));
      recordLocalAudit(
        activeRole,
        'AUTH_RECOVERY_KEY_ROTATED',
        roleToRotate,
        `Master Recovery Key untuk ${roleToRotate} diperbarui`
      );
      triggerToast(`Master Recovery Key baru untuk ${ROLE_META[roleToRotate]?.shortLabel} berhasil dibuat.`);
      return { ok: true, role: roleToRotate, recoveryKey: newRecoveryKey };
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, staffAccounts, triggerToast]
  );

  const developerResetStaffPassword = useCallback(
    async (targetRole, newPassword) => {
      if (!hasScope(activeRole, SCOPES.DEV_RBAC_PIN_EDIT)) {
        throw new Error('Hanya Pengembang yang diizinkan mereset password tim.');
      }
      const policyErr = getPasswordPolicyError(newPassword);
      if (policyErr) throw new Error(policyErr);

      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.developerResetPassword(targetRole, newPassword);
        await refreshProtectedData(activeRole, authToken);
        triggerToast(`Password ${ROLE_META[targetRole]?.label || targetRole} berhasil direset.`);
        return res;
      }

      const nowIso = new Date().toISOString();
      setStaffAccounts((prev) => ({
        ...prev,
        [targetRole]: {
          ...prev[targetRole],
          password: newPassword,
          failedAttempts: 0,
          lockedUntil: null,
          resetChallenge: null,
          updatedAt: nowIso,
        },
      }));
      setRolePins((prev) => ({ ...prev, [targetRole]: newPassword }));
      recordLocalAudit(activeRole, 'DEV_RESET_STAFF_PASSWORD', targetRole, `Pengembang mereset password akun ${targetRole}`);
      triggerToast(`Password ${ROLE_META[targetRole]?.label || targetRole} berhasil direset.`);
      return { ok: true };
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, refreshProtectedData, triggerToast]
  );

  const quickSwitchDemoRole = useCallback(
    (targetRole) => {
      if (!config?.featureFlags?.enableDemoQuickSwitch && !hasScope(activeRole, SCOPES.DEV_THEME_TOKENS_EDIT)) {
        return;
      }
      setActiveRole(targetRole);
      if (targetRole === ROLES.CLIENT) setActiveView('showcase');
      else if (targetRole === ROLES.KITCHEN) setActiveView('kitchen');
      else if (targetRole === ROLES.ADMIN) setActiveView('admin');
      else if (targetRole === ROLES.DEVELOPER) setActiveView('developer');
      triggerToast(`Demo Switch ke POV ${targetRole.toUpperCase()}.`);
    },
    [activeRole, config?.featureFlags?.enableDemoQuickSwitch, triggerToast]
  );

  const logoutToClient = useCallback(() => {
    setActiveRole(ROLES.CLIENT);
    setAuthToken('');
    setActiveView('showcase');
    triggerToast('Kembali ke tampilan publik Klien.');
  }, [triggerToast]);

  const toggleLikePackage = useCallback(
    async (pkgId) => {
      const already = Boolean(likedIds[pkgId]);
      setLikedIds((prev) => ({ ...prev, [pkgId]: !already }));
      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkgId ? { ...p, likes: already ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1 } : p
        )
      );
      if (apiUrl && backendStatus === 'connected' && !already) {
        try {
          await api.likePackage(pkgId);
        } catch {
          // Keep optimistic UI state on network drop.
        }
      }
    },
    [api, apiUrl, backendStatus, likedIds]
  );

  const createOrder = useCallback(
    async (formInput) => {
      if (apiUrl && backendStatus === 'connected') {
        const res = await api.createOrder(formInput);
        setOrders((prev) => [res.order, ...prev]);
        await syncPublicBootstrap();
        triggerToast(`Pesanan ${res.order.id} tersimpan ke server Sajian Catering!`);
        return res.order;
      }

      const pkg = packages.find((p) => p.id === formInput.packageId);
      if (!pkg) throw new Error('Paket catering tidak ditemukan.');
      const selectedMap = {};
      for (const s of formInput.stalls || []) {
        selectedMap[s.id] = { selected: true, pax: s.pax };
      }
      const pricing = calculateOrderPricing({
        pkg,
        pax: formInput.pax,
        stallsList: stalls,
        selectedStalls: selectedMap,
        dpPercent: config.business?.dpPercent || 50,
      });
      const prefix = config.brand?.orderPrefix || 'SJC';
      const nextNum = String(orders.length + 1).padStart(3, '0');
      const newOrder = {
        id: `${prefix}-${new Date().getFullYear()}-${nextNum}`,
        customerName: formInput.customerName.trim(),
        whatsapp: formInput.whatsapp.trim(),
        eventDate: formInput.eventDate,
        eventTime: formInput.eventTime,
        address: formInput.address.trim(),
        notes: formInput.notes?.trim() || 'Tidak ada catatan tambahan.',
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        packageHpp: pkg.hpp || 0,
        pax: Number(formInput.pax),
        stalls: pricing.stallDetails.map(({ id, name, price, hpp, pax }) => ({ id, name, price, hpp, pax })),
        totalAmount: pricing.grandTotal,
        dpAmount: pricing.dpAmount,
        dpVerified: false,
        status: 'Menunggu DP',
        kitchenStage: 'Persiapan Bahan',
        createdAt: getDateOffset(0),
      };
      setOrders((prev) => [newOrder, ...prev]);
      recordLocalAudit(ROLES.CLIENT, 'ORDER_CREATED', newOrder.id, `Order baru ${newOrder.id} (${newOrder.pax} pax)`);
      triggerToast(`Pesanan ${newOrder.id} berhasil masuk ke jadwal dapur!`);
      return newOrder;
    },
    [api, apiUrl, backendStatus, config.brand?.orderPrefix, config.business?.dpPercent, orders.length, packages, recordLocalAudit, stalls, syncPublicBootstrap, triggerToast]
  );

  const trackClientOrder = useCallback(
    async (orderId, whatsapp) => {
      if (apiUrl && backendStatus === 'connected') {
        const res = await api.trackOrder(orderId, whatsapp);
        return res.order;
      }
      const idUpper = String(orderId || '').trim().toUpperCase();
      const found = orders.find(
        (o) => o.id.toUpperCase() === idUpper && phonesMatch(o.whatsapp, whatsapp)
      );
      if (!found) {
        throw new Error('Kode pesanan atau nomor WhatsApp tidak cocok.');
      }
      return found;
    },
    [api, apiUrl, backendStatus, orders]
  );

  const updateClientNote = useCallback(
    async (orderId, whatsapp, notes) => {
      if (apiUrl && backendStatus === 'connected') {
        const res = await api.updateClientNote(orderId, whatsapp, notes);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
        triggerToast('Catatan khusus berhasil dikirim ke tim dapur.');
        return res.order;
      }
      let updated = null;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId && phonesMatch(o.whatsapp, whatsapp)) {
            updated = { ...o, notes };
            return updated;
          }
          return o;
        })
      );
      if (!updated) throw new Error('Verifikasi WhatsApp gagal.');
      recordLocalAudit(ROLES.CLIENT, 'CLIENT_NOTE_UPDATED', orderId, `Klien memperbarui catatan ${orderId}`);
      triggerToast('Catatan acara berhasil diperbarui.');
      return updated;
    },
    [api, apiUrl, backendStatus, recordLocalAudit, triggerToast]
  );

  const updateKitchenStage = useCallback(
    async (orderId, kitchenStage) => {
      if (!hasScope(activeRole, SCOPES.KITCHEN_STAGE_UPDATE)) {
        throw new Error('Role aktif tidak diizinkan mengubah tahap dapur.');
      }
      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.updateKitchenStage(orderId, kitchenStage);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.order } : o)));
        triggerToast(`Tahap produksi ${orderId} -> "${kitchenStage}"`);
        return;
      }
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const nextStatus =
            kitchenStage === 'Siap Kirim' && o.status === 'Diproses Dapur'
              ? 'Dikirim'
              : kitchenStage === 'Sedang Dimasak' && o.status === 'DP Lunas'
                ? 'Diproses Dapur'
                : o.status;
          return { ...o, kitchenStage, status: nextStatus };
        })
      );
      recordLocalAudit(activeRole, 'KITCHEN_STAGE_UPDATED', orderId, `Dapur: ${orderId} -> ${kitchenStage}`);
      triggerToast(`Tahap produksi ${orderId} -> "${kitchenStage}"`);
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, triggerToast]
  );

  const updateAdminOrder = useCallback(
    async (orderId, patch) => {
      if (!hasScope(activeRole, SCOPES.ORDER_MANAGE_ALL)) {
        throw new Error('Role aktif tidak memiliki izin mengelola pesanan.');
      }
      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.updateAdminOrder(orderId, patch);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
        triggerToast(`Pesanan ${orderId} diperbarui.`);
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
      recordLocalAudit(activeRole, 'ORDER_UPDATED', orderId, `Admin mengubah status/data ${orderId}`);
      triggerToast(`Pesanan ${orderId} berhasil diperbarui.`);
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, triggerToast]
  );

  const savePackage = useCallback(
    async (pkgInput) => {
      if (!hasScope(activeRole, SCOPES.CATALOG_MANAGE)) {
        throw new Error('Role aktif tidak diizinkan mengelola katalog.');
      }
      const isEdit = Boolean(pkgInput.id && packages.some((p) => p.id === pkgInput.id));
      const pkg = {
        ...pkgInput,
        id: pkgInput.id || `pkg-${Date.now()}`,
        likes: pkgInput.likes ?? 0,
        isActive: pkgInput.isActive !== false,
      };
      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = isEdit ? await api.updatePackage(pkg.id, pkg) : await api.createPackage(pkg);
        setPackages((prev) =>
          isEdit ? prev.map((p) => (p.id === res.package.id ? res.package : p)) : [...prev, res.package]
        );
        triggerToast(`Paket "${res.package.name}" disimpan ke server.`);
        return res.package;
      }
      setPackages((prev) => (isEdit ? prev.map((p) => (p.id === pkg.id ? pkg : p)) : [...prev, pkg]));
      recordLocalAudit(activeRole, 'PACKAGE_SAVED', pkg.id, `Paket "${pkg.name}" disimpan`);
      triggerToast(`Paket "${pkg.name}" berhasil disimpan ke katalog!`);
      return pkg;
    },
    [activeRole, api, apiUrl, authToken, backendStatus, packages, recordLocalAudit, triggerToast]
  );

  const deletePackage = useCallback(
    async (pkgId) => {
      if (!hasScope(activeRole, SCOPES.CATALOG_MANAGE)) {
        throw new Error('Role aktif tidak diizinkan menghapus paket.');
      }
      if (apiUrl && backendStatus === 'connected' && authToken) {
        await api.deletePackage(pkgId);
      }
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
      recordLocalAudit(activeRole, 'PACKAGE_DELETED', pkgId, `Paket ${pkgId} dihapus`);
      triggerToast('Paket berhasil dihapus dari katalog.');
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, triggerToast]
  );

  const saveBusinessSettings = useCallback(
    async (payload) => {
      if (!hasScope(activeRole, SCOPES.BUSINESS_SETTINGS_EDIT)) {
        throw new Error('Role aktif tidak diizinkan mengubah pengaturan bisnis.');
      }
      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.updateBusinessSettings(payload);
        setConfig(res.config);
        await syncPublicBootstrap();
        triggerToast('Pengaturan bisnis berhasil disimpan ke server.');
        return;
      }
      setConfig((prev) => ({
        ...prev,
        business: payload.business ?? prev.business,
        faq: payload.faq ?? prev.faq,
        terms: payload.terms ?? prev.terms,
        companyProfile: payload.companyProfile ?? prev.companyProfile,
      }));
      recordLocalAudit(activeRole, 'BUSINESS_SETTINGS_UPDATED', 'business', 'Pengaturan bisnis diperbarui');
      triggerToast('Pengaturan bisnis Sajian Catering berhasil disimpan.');
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, syncPublicBootstrap, triggerToast]
  );

  const saveDeveloperConfig = useCallback(
    async ({ brand, themeTokens, featureFlags, newRolePins }) => {
      if (!hasScope(activeRole, SCOPES.DEV_THEME_TOKENS_EDIT)) {
        throw new Error('Hanya role Pengembang yang dapat mengubah konfigurasi sistem.');
      }
      if (apiUrl && backendStatus === 'connected' && authToken) {
        const res = await api.updateDeveloperConfig({
          brand,
          themeTokens,
          featureFlags,
          rolePins: newRolePins,
        });
        setConfig(res.config);
      } else {
        setConfig((prev) => ({
          ...prev,
          brand: brand ?? prev.brand,
          themeTokens: themeTokens ?? prev.themeTokens,
          featureFlags: featureFlags ?? prev.featureFlags,
        }));
      }
      if (newRolePins) {
        setRolePins((prev) => ({ ...prev, ...newRolePins }));
        setStaffAccounts((prev) => {
          const next = { ...prev };
          const nowIso = new Date().toISOString();
          for (const [rKey, nextPw] of Object.entries(newRolePins)) {
            if (nextPw && next[rKey]) {
              next[rKey] = {
                ...next[rKey],
                password: nextPw,
                failedAttempts: 0,
                lockedUntil: null,
                updatedAt: nowIso,
              };
            }
          }
          return next;
        });
      }
      recordLocalAudit(activeRole, 'DEVELOPER_CONFIG_UPDATED', 'system', 'Pengembang mengubah konfigurasi sistem');
      triggerToast('Pengaturan Pengembang berhasil diterapkan.');
    },
    [activeRole, api, apiUrl, authToken, backendStatus, recordLocalAudit, triggerToast]
  );

  const updateBackendConnection = useCallback(
    async (nextUrl) => {
      if (!hasScope(activeRole, SCOPES.DEV_SYSTEM_JSON_IO)) {
        throw new Error('Hanya Pengembang yang dapat mengubah koneksi backend.');
      }
      const clean = normalizeBaseUrl(nextUrl);
      if (clean) {
        await api.checkHealth(clean);
      }
      writeStorageText(STORAGE_KEYS.API_URL, clean);
      setApiUrlState(clean);
      setAuthToken('');
      if (!clean) {
        setBackendStatus('local-demo');
        setServerCalendarSlots(null);
        triggerToast('Beralih ke Mode Demo Lokal (tanpa server eksternal).');
      } else {
        setBackendStatus('connected');
        triggerToast(`Terhubung ke Backend API: ${clean}`);
      }
    },
    [activeRole, api, triggerToast]
  );

  const importDeveloperSnapshot = useCallback(
    (jsonPayload) => {
      if (!hasScope(activeRole, SCOPES.DEV_SYSTEM_JSON_IO)) {
        throw new Error('Akses ditolak.');
      }
      validateImportedSnapshot(jsonPayload);
      if (jsonPayload.config) setConfig((prev) => ({ ...prev, ...jsonPayload.config }));
      if (jsonPayload.packages) setPackages(jsonPayload.packages);
      if (jsonPayload.stalls) setStalls(jsonPayload.stalls);
      if (jsonPayload.orders) setOrders(jsonPayload.orders);
      recordLocalAudit(activeRole, 'SYSTEM_JSON_IMPORT', 'system', 'Snapshot JSON berhasil diimpor');
      triggerToast('Konfigurasi & data JSON berhasil diimpor.');
    },
    [activeRole, recordLocalAudit, triggerToast]
  );

  const resetAllDemoData = useCallback(async () => {
    if (!hasScope(activeRole, SCOPES.DEV_SYSTEM_JSON_IO) && !hasScope(activeRole, SCOPES.BUSINESS_SETTINGS_EDIT)) {
      throw new Error('Akses ditolak.');
    }
    if (apiUrl && backendStatus === 'connected' && authToken && hasScope(activeRole, SCOPES.DEV_SYSTEM_JSON_IO)) {
      await api.resetBackendSystem();
      await refreshProtectedData(activeRole, authToken);
    }
    setConfig(buildDefaultAppConfig());
    setPackages(INITIAL_PACKAGES);
    setStalls(INITIAL_STALLS);
    setOrders(buildInitialOrders());
    setRolePins(DEFAULT_ROLE_PINS);
    setStaffAccounts(buildInitialStaffAccounts());
    setServerStaffAccounts(null);
    setAuditLogs([]);
    triggerToast('Seluruh data & pengaturan dikembalikan ke standar pabrik.');
  }, [activeRole, api, apiUrl, authToken, backendStatus, refreshProtectedData, triggerToast]);

  const staffAccountsList = useMemo(() => {
    if (Array.isArray(serverStaffAccounts) && serverStaffAccounts.length > 0) {
      return serverStaffAccounts;
    }
    return Object.values(staffAccounts).map(toSafeAccountMeta);
  }, [serverStaffAccounts, staffAccounts]);

  const activeAccount = useMemo(
    () => staffAccountsList.find((a) => a.role === activeRole) || null,
    [activeRole, staffAccountsList]
  );

  const calendarDates = useMemo(
    () =>
      computeCalendarDates({
        orders,
        calendarSlots: serverCalendarSlots,
        business: config.business,
        days: 14,
      }),
    [config.business, orders, serverCalendarSlots]
  );

  const kpiStats = useMemo(() => computeKpiStats(orders), [orders]);

  const value = useMemo(
    () => ({
      apiUrl,
      backendStatus,
      activeRole,
      activeAccount,
      activeScopes: getRoleScopes(activeRole),
      activeView,
      navigateView,
      config,
      packages,
      stalls,
      orders,
      calendarDates,
      kpiStats,
      rolePins,
      staffAccountsList,
      auditLogs,
      likedIds,
      toastMessage,
      themePresets: THEME_PRESETS,
      hasScope: (scope) => hasScope(activeRole, scope),
      triggerToast,
      authenticateRole,
      authenticateStaff,
      requestPasswordReset,
      verifyPasswordResetCode,
      completePasswordReset,
      changeOwnPassword,
      rotateAccountRecoveryKey,
      developerResetStaffPassword,
      quickSwitchDemoRole,
      logoutToClient,
      toggleLikePackage,
      createOrder,
      trackClientOrder,
      updateClientNote,
      updateKitchenStage,
      updateAdminOrder,
      savePackage,
      deletePackage,
      saveBusinessSettings,
      saveDeveloperConfig,
      updateBackendConnection,
      importDeveloperSnapshot,
      resetAllDemoData,
    }),
    [
      activeAccount,
      activeRole,
      activeView,
      apiUrl,
      auditLogs,
      authenticateRole,
      authenticateStaff,
      backendStatus,
      calendarDates,
      changeOwnPassword,
      completePasswordReset,
      config,
      createOrder,
      deletePackage,
      developerResetStaffPassword,
      importDeveloperSnapshot,
      kpiStats,
      likedIds,
      logoutToClient,
      navigateView,
      orders,
      packages,
      quickSwitchDemoRole,
      requestPasswordReset,
      resetAllDemoData,
      rolePins,
      rotateAccountRecoveryKey,
      saveBusinessSettings,
      saveDeveloperConfig,
      savePackage,
      staffAccountsList,
      stalls,
      toastMessage,
      toggleLikePackage,
      trackClientOrder,
      triggerToast,
      updateAdminOrder,
      updateBackendConnection,
      updateClientNote,
      updateKitchenStage,
      verifyPasswordResetCode,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
