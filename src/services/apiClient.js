export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function normalizeBaseUrl(url = '') {
  return String(url).trim().replace(/\/+$/, '');
}

async function requestJson(baseUrl, path, { method = 'GET', token = '', body = undefined } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `HTTP ${response.status}`, response.status);
  }
  return data;
}

export function createApiClient(getBaseUrl, getToken) {
  const call = (path, opts = {}) => {
    const base = normalizeBaseUrl(getBaseUrl());
    if (!base) throw new ApiError('URL Backend belum dikonfigurasi.', 0);
    return requestJson(base, path, { ...opts, token: opts.token ?? getToken() });
  };

  return {
    checkHealth: (overrideUrl) =>
      requestJson(normalizeBaseUrl(overrideUrl ?? getBaseUrl()), '/api/health'),
    login: (payload) => call('/api/auth/login', { method: 'POST', body: payload, token: '' }),
    getMe: () => call('/api/auth/me'),
    getAuthAccounts: () => call('/api/auth/accounts'),
    requestPasswordReset: (payload) =>
      call('/api/auth/forgot-password', { method: 'POST', body: payload, token: '' }),
    verifyResetCode: (payload) =>
      call('/api/auth/verify-reset-code', { method: 'POST', body: payload, token: '' }),
    resetPassword: (payload) =>
      call('/api/auth/reset-password', { method: 'POST', body: payload, token: '' }),
    changePassword: (payload) => call('/api/auth/change-password', { method: 'POST', body: payload }),
    rotateRecoveryKey: (payload) =>
      call('/api/auth/recovery-key/rotate', { method: 'POST', body: payload }),
    developerResetPassword: (targetRole, newPassword) =>
      call(`/api/developer/accounts/${encodeURIComponent(targetRole)}/reset-password`, {
        method: 'POST',
        body: { newPassword },
      }),
    getBootstrap: () => call('/api/public/bootstrap', { token: '' }),
    likePackage: (pkgId) => call(`/api/packages/${encodeURIComponent(pkgId)}/like`, { method: 'POST', token: '' }),
    createOrder: (payload) => call('/api/orders', { method: 'POST', body: payload, token: '' }),
    trackOrder: (orderId, whatsapp) =>
      call(
        `/api/orders/track?orderId=${encodeURIComponent(orderId)}&whatsapp=${encodeURIComponent(whatsapp)}`,
        { token: '' }
      ),
    updateClientNote: (orderId, whatsapp, notes) =>
      call(`/api/orders/${encodeURIComponent(orderId)}/client-note`, {
        method: 'PATCH',
        body: { whatsapp, notes },
        token: '',
      }),
    getKitchenSheet: (date) =>
      call(`/api/kitchen/sheet${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    updateKitchenStage: (orderId, kitchenStage) =>
      call(`/api/kitchen/orders/${encodeURIComponent(orderId)}/stage`, {
        method: 'PATCH',
        body: { kitchenStage },
      }),
    getAdminDashboard: () => call('/api/admin/dashboard'),
    updateAdminOrder: (orderId, patch) =>
      call(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: patch }),
    createPackage: (pkg) => call('/api/admin/packages', { method: 'POST', body: pkg }),
    updatePackage: (id, pkg) =>
      call(`/api/admin/packages/${encodeURIComponent(id)}`, { method: 'PUT', body: pkg }),
    deletePackage: (id) =>
      call(`/api/admin/packages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    updateBusinessSettings: (payload) => call('/api/admin/settings', { method: 'PUT', body: payload }),
    getDeveloperState: () => call('/api/developer/state'),
    updateDeveloperConfig: (payload) => call('/api/developer/config', { method: 'PUT', body: payload }),
    resetBackendSystem: () => call('/api/developer/reset', { method: 'POST' }),
  };
}
