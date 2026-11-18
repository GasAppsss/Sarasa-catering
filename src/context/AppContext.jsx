import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildDefaultAppConfig,
  DEFAULT_ROLE_PINS,
  THEME_PRESETS,
} from '../config/defaults.js';
import { getRoleScopes, hasScope, ROLES, SCOPES } from '../config/rbac.js';
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

  const [config, setConfig] = useState(() => readStorageJson(STORAGE_KEYS.CONFIG, buildDefaultAppConfig()));
  const [packages, setPackages] = useState(() => readStorageJson(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES));
  const [stalls, setStalls] = useState(() => readStorageJson(STORAGE_KEYS.STALLS, INITIAL_STALLS));
  const [orders, setOrders] = useState(() => readStorageJson(STORAGE_KEYS.ORDERS, buildInitialOrders()));
  const [serverCalendarSlots, setServerCalendarSlots] = useState(null);
  const [rolePins, setRolePins] = useState(() => readStorageJson(STORAGE_KEYS.PINS, DEFAULT_ROLE_PINS));
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
        } else if (roleToLoad === ROLES.ADMIN) {
          const dash = await client.getAdminDashboard();
          if (dash.config) setConfig(dash.config);
          if (dash.packages) setPackages(dash.packages);
          if (dash.stalls) setStalls(dash.stalls);
          if (dash.orders) setOrders(dash.orders);
          if (dash.auditLogs) setAuditLogs(dash.auditLogs);
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

  const authenticateRole = useCallback(
    async (role, pin) => {
      if (role === ROLES.CLIENT) {
        setActiveRole(ROLES.CLIENT);
        setAuthToken('');
        setActiveView('showcase');
        return { ok: true };
      }

      if (apiUrl && backendStatus === 'connected') {
        const res = await api.login(role, pin);
        setAuthToken(res.token);
        setActiveRole(res.role);
        setActiveView(res.role === ROLES.KITCHEN ? 'kitchen' : res.role === ROLES.ADMIN ? 'admin' : 'developer');
        await refreshProtectedData(res.role, res.token);
        triggerToast(`Berhasil masuk sebagai ${role.toUpperCase()} (Terverifikasi Server).`);
        return { ok: true };
      }

      const expected = rolePins[role];
      if (!expected || String(pin).trim() !== String(expected)) {
        throw new Error('PIN akses tidak valid untuk role tersebut.');
      }
      setActiveRole(role);
      setActiveView(role === ROLES.KITCHEN ? 'kitchen' : role === ROLES.ADMIN ? 'admin' : 'developer');
      recordLocalAudit(role, 'AUTH_LOGIN', role, `Sesi lokal dibuka untuk role ${role}`);
      triggerToast(`Mode aktif: ${role.toUpperCase()}.`);
      return { ok: true };
    },
    [api, apiUrl, backendStatus, recordLocalAudit, refreshProtectedData, rolePins, triggerToast]
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
      }
      recordLocalAudit(activeRole, 'DEVELOPER_CONFIG_UPDATED', 'system', 'Pengembang mengubah tema/flags/PIN');
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
    setAuditLogs([]);
    triggerToast('Seluruh data & pengaturan dikembalikan ke standar pabrik.');
  }, [activeRole, api, apiUrl, authToken, backendStatus, refreshProtectedData, triggerToast]);

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
      auditLogs,
      likedIds,
      toastMessage,
      themePresets: THEME_PRESETS,
      hasScope: (scope) => hasScope(activeRole, scope),
      triggerToast,
      authenticateRole,
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
      activeRole,
      activeView,
      apiUrl,
      auditLogs,
      authenticateRole,
      backendStatus,
      calendarDates,
      config,
      createOrder,
      deletePackage,
      importDeveloperSnapshot,
      kpiStats,
      likedIds,
      logoutToClient,
      navigateView,
      orders,
      packages,
      quickSwitchDemoRole,
      resetAllDemoData,
      rolePins,
      saveBusinessSettings,
      saveDeveloperConfig,
      savePackage,
      stalls,
      toastMessage,
      toggleLikePackage,
      trackClientOrder,
      triggerToast,
      updateAdminOrder,
      updateBackendConnection,
      updateClientNote,
      updateKitchenStage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
