import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Flag,
  KeyRound,
  Palette,
  RotateCcw,
  Save,
  Server,
  Shield,
  Upload,
} from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell.jsx';
import { AccountSecurityPanel } from '../../components/shared/AccountSecurityPanel.jsx';
import { ROLE_META, ROLE_SCOPES, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function DeveloperConsoleView({ onBackToSite }) {
  const {
    config,
    packages,
    stalls,
    orders,
    staffAccountsList,
    apiUrl,
    backendStatus,
    themePresets,
    saveDeveloperConfig,
    developerResetStaffPassword,
    updateBackendConnection,
    importDeveloperSnapshot,
    resetAllDemoData,
    triggerToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('theme');
  const [brand, setBrand] = useState({ ...config.brand });
  const [themeTokens, setThemeTokens] = useState({ ...config.themeTokens });
  const [featureFlags, setFeatureFlags] = useState({ ...config.featureFlags });
  const [resetTargetRole, setResetTargetRole] = useState(ROLES.ADMIN);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState({ type: '', text: '' });
  const [resettingUser, setResettingUser] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(apiUrl || '');
  const [connMessage, setConnMessage] = useState('');
  const [connError, setConnError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const DEV_TABS = [
    { id: 'theme', label: 'Tema & Design Tokens', icon: Palette },
    { id: 'flags', label: 'Feature Flags & Brand', icon: Flag },
    { id: 'rbac', label: 'Akun, Keamanan & RBAC', icon: Shield },
    { id: 'backend', label: 'Koneksi Backend API', icon: Server },
    { id: 'data', label: 'Data & Backup JSON', icon: Database },
  ];

  const applyPreset = (presetId) => {
    const preset = themePresets[presetId];
    if (!preset) return;
    setThemeTokens((prev) => ({ ...prev, presetId, ...preset }));
  };

  const handleSaveDevConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDeveloperConfig({
        brand,
        themeTokens,
        featureFlags,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeveloperResetPassword = async (e) => {
    e.preventDefault();
    setResetFeedback({ type: '', text: '' });
    setResettingUser(true);
    try {
      await developerResetStaffPassword(resetTargetRole, resetNewPassword);
      setResetFeedback({
        type: 'ok',
        text: `Password untuk akun ${ROLE_META[resetTargetRole]?.label || resetTargetRole} berhasil direset.`,
      });
      setResetNewPassword('');
    } catch (err) {
      setResetFeedback({ type: 'err', text: err.message || 'Gagal mereset password akun.' });
    } finally {
      setResettingUser(false);
    }
  };

  const handleTestBackend = async () => {
    setConnError('');
    setConnMessage('');
    try {
      await updateBackendConnection(backendUrlInput);
      setConnMessage(
        backendUrlInput.trim()
          ? `Koneksi API berhasil: ${backendUrlInput.trim()}`
          : 'Beralih ke Mode Demo Lokal.'
      );
    } catch (err) {
      setConnError(err.message || 'Gagal menghubungi /api/health.');
    }
  };

  const handleExportJson = () => {
    const snapshot = { exportedAt: new Date().toISOString(), config, packages, stalls, orders };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sajian-catering-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Snapshot konfigurasi JSON berhasil diunduh.');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importDeveloperSnapshot(JSON.parse(text));
    } catch (err) {
      triggerToast(`Gagal impor JSON: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const flagLabels = {
    enableClientPortal: 'Portal Klien Self-Service',
    enableCatalogFilter: 'Filter & Pencarian Katalog',
    enableVideoPreview: 'Modal Detail Penyajian',
    enableTestimonials: 'Bagian Ulasan & Testimoni',
    enableFaqSection: 'Bagian FAQ & Syarat Ketentuan',
    enableWhatsAppCheckout: 'Checkout & Salin Pesan WhatsApp',
    enableDemoQuickSwitch: 'Demo Quick-Switch Bar di Header Publik',
  };

  return (
    <DashboardShell
      roleLabel="POV Pengembang"
      title="Pengaturan Sistem & Kustomisasi Pengembang"
      subtitle="Konfigurasi visual frontend, feature flags, PIN keamanan RBAC, dan koneksi API backend."
      navItems={DEV_TABS}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onBackToSite={onBackToSite}
    >
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 space-y-6 shadow-sm">
        {(activeTab === 'theme' || activeTab === 'flags') && (
          <form onSubmit={handleSaveDevConfig} className="space-y-6">
        {activeTab === 'theme' && (
          <div className="space-y-5">
            <h2 className="font-bold text-base text-stone-900">Theme &amp; Design Token Customizer</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(themePresets).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    themeTokens.presetId === id
                      ? 'bg-brand-dark text-amber-300 border-brand-dark'
                      : 'bg-[#FAF8F5] text-stone-700 border-stone-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'primary', label: 'Primary Color' },
                { key: 'primaryDark', label: 'Dark Accent' },
                { key: 'accent', label: 'Highlight Color' },
                { key: 'background', label: 'Page Canvas' },
                { key: 'surface', label: 'Card Surface' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-[#FAF8F5] cursor-pointer">
                  <input
                    type="color"
                    value={themeTokens[key] || '#064E3B'}
                    onChange={(e) => setThemeTokens((p) => ({ ...p, presetId: 'custom', [key]: e.target.value }))}
                    className="w-7 h-7 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-stone-900 block">{label}</span>
                    <span className="font-mono text-[10px] text-stone-500">{themeTokens[key]}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Skala Radius Kartu</label>
                <select
                  value={themeTokens.radiusScale || 'rounded'}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, radiusScale: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 font-semibold"
                >
                  <option value="sharp">Sharp (0.5rem)</option>
                  <option value="rounded">Rounded (1rem)</option>
                  <option value="pill">Soft Pill (1.5rem)</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-[#FAF8F5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(themeTokens.reduceMotion)}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, reduceMotion: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-900"
                />
                <span className="font-semibold text-stone-800">Reduced Motion (Minimal Animasi)</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-5">
            <h2 className="font-bold text-base text-stone-900">Feature Flags &amp; Identitas White-Label</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Object.entries(flagLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs cursor-pointer"
                >
                  <span className="font-semibold text-stone-800">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(featureFlags[key])}
                    onChange={(e) => setFeatureFlags((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-900"
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-stone-100">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Brand</label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => setBrand((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Prefix Kode Order</label>
                <input
                  type="text"
                  value={brand.orderPrefix}
                  onChange={(e) => setBrand((p) => ({ ...p, orderPrefix: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={brand.tagline}
                  onChange={(e) => setBrand((p) => ({ ...p, tagline: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-bold text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Pengembang'}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'rbac' && (
          <div className="space-y-8">
            <AccountSecurityPanel />

            <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Manajemen &amp; Reset Password Akun Internal</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Daftar seluruh akun staff beserta aksi reset password darurat oleh Pengembang.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {staffAccountsList.map((acc) => (
                  <div key={acc.role} className="rounded-xl bg-white border border-stone-200 p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-brand-dark">{ROLE_META[acc.role]?.shortLabel || acc.role}</span>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        @{acc.username}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-stone-600 truncate">{acc.email}</p>
                    <p className="text-[10px] text-stone-400">
                      {acc.lockedUntil && new Date(acc.lockedUntil).getTime() > Date.now()
                        ? 'Status: Terkunci sementara'
                        : 'Status: Aktif'}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleDeveloperResetPassword} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-stone-200 text-xs">
                <div className="sm:col-span-4">
                  <label htmlFor="dev-reset-role" className="block font-bold text-stone-700 mb-1">
                    Pilih Akun Target
                  </label>
                  <select
                    id="dev-reset-role"
                    value={resetTargetRole}
                    onChange={(e) => setResetTargetRole(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 font-semibold"
                  >
                    <option value={ROLES.ADMIN}>Administrator Bisnis (admin)</option>
                    <option value={ROLES.KITCHEN}>Admin Dapur (dapur)</option>
                    <option value={ROLES.DEVELOPER}>Pengembang Sistem (developer)</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <label htmlFor="dev-reset-pw" className="block font-bold text-stone-700 mb-1">
                    Password Baru (Min. 8 karakter, huruf besar/kecil &amp; angka)
                  </label>
                  <input
                    id="dev-reset-pw"
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Contoh: TimBaru#2027"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    disabled={resettingUser}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-dark hover:bg-brand-primary text-amber-300 font-extrabold text-xs cursor-pointer disabled:opacity-60"
                  >
                    {resettingUser ? 'Mereset...' : 'Reset Password'}
                  </button>
                </div>
              </form>

              {resetFeedback.text && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    resetFeedback.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {resetFeedback.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{resetFeedback.text}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <h3 className="font-extrabold text-sm text-brand-dark">Matriks Audit Scope RBAC</h3>
              {Object.values(ROLES).map((roleId) => (
                <div key={roleId} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span>{ROLE_META[roleId]?.label}</span>
                    <span className="text-[10px] font-mono bg-stone-200 px-2 py-0.5 rounded">
                      {ROLE_SCOPES[roleId].length} scopes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-stone-500">{ROLE_SCOPES[roleId].join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-stone-900">Koneksi Backend API (Vercel / Render / Lokal)</h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                Status: {backendStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Isi URL backend API Anda (contoh: <code className="font-mono">https://sajian-api.vercel.app</code>) lalu klik tes koneksi.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="https://sajian-catering-api.vercel.app"
                className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleTestBackend}
                className="px-4 py-2.5 rounded-xl bg-brand-dark text-amber-300 font-semibold text-xs cursor-pointer"
              >
                Tes &amp; Simpan Koneksi
              </button>
            </div>
            {connMessage && (
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {connMessage}
              </p>
            )}
            {connError && (
              <p className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {connError}
              </p>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <h2 className="font-bold text-base text-stone-900">Snapshot State &amp; Backup JSON</h2>
            <p className="text-xs text-stone-500">
              Snapshot aktif: {packages.length} paket · {stalls.length} pondokan · {orders.length} pesanan.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-[#FAF8F5] cursor-pointer"
              >
                <Download className="w-4 h-4" /> Ekspor JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-[#FAF8F5] cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Impor JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              <button
                type="button"
                onClick={resetAllDemoData}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Factory Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
