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
import { ROLE_META, ROLE_SCOPES, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function DeveloperConsoleView({ onBackToSite }) {
  const {
    config,
    packages,
    stalls,
    orders,
    rolePins,
    apiUrl,
    backendStatus,
    themePresets,
    saveDeveloperConfig,
    updateBackendConnection,
    importDeveloperSnapshot,
    resetAllDemoData,
    triggerToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('theme');
  const [brand, setBrand] = useState({ ...config.brand });
  const [themeTokens, setThemeTokens] = useState({ ...config.themeTokens });
  const [featureFlags, setFeatureFlags] = useState({ ...config.featureFlags });
  const [pinInputs, setPinInputs] = useState({
    kitchen: rolePins.kitchen || '',
    admin: rolePins.admin || '',
    developer: rolePins.developer || '',
  });
  const [backendUrlInput, setBackendUrlInput] = useState(apiUrl || '');
  const [connMessage, setConnMessage] = useState('');
  const [connError, setConnError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const DEV_TABS = [
    { id: 'theme', label: 'Tema & Design Tokens', icon: Palette },
    { id: 'flags', label: 'Feature Flags & Brand', icon: Flag },
    { id: 'rbac', label: 'Role & PIN RBAC', icon: Shield },
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
      const cleanPins = {};
      for (const k of ['kitchen', 'admin', 'developer']) {
        if (pinInputs[k] && pinInputs[k].trim().length >= 4) {
          cleanPins[k] = pinInputs[k].trim();
        }
      }
      await saveDeveloperConfig({
        brand,
        themeTokens,
        featureFlags,
        newRolePins: cleanPins,
      });
    } finally {
      setSaving(false);
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
      <form onSubmit={handleSaveDevConfig} className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 space-y-6">
        {activeTab === 'theme' && (
          <div className="space-y-5">
            <h2 className="font-bold text-base text-zinc-900">Theme &amp; Design Token Customizer</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(themePresets).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    themeTokens.presetId === id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200'
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
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                  <input
                    type="color"
                    value={themeTokens[key] || '#064E3B'}
                    onChange={(e) => setThemeTokens((p) => ({ ...p, presetId: 'custom', [key]: e.target.value }))}
                    className="w-7 h-7 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-zinc-900 block">{label}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{themeTokens[key]}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Skala Radius Kartu</label>
                <select
                  value={themeTokens.radiusScale || 'rounded'}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, radiusScale: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-semibold"
                >
                  <option value="sharp">Sharp (0.5rem)</option>
                  <option value="rounded">Rounded (1rem)</option>
                  <option value="pill">Soft Pill (1.5rem)</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(themeTokens.reduceMotion)}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, reduceMotion: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-900"
                />
                <span className="font-semibold text-zinc-800">Reduced Motion (Minimal Animasi)</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-5">
            <h2 className="font-bold text-base text-zinc-900">Feature Flags &amp; Identitas White-Label</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Object.entries(flagLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs cursor-pointer"
                >
                  <span className="font-semibold text-zinc-800">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(featureFlags[key])}
                    onChange={(e) => setFeatureFlags((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-900"
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-100">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nama Brand</label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => setBrand((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Prefix Kode Order</label>
                <input
                  type="text"
                  value={brand.orderPrefix}
                  onChange={(e) => setBrand((p) => ({ ...p, orderPrefix: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={brand.tagline}
                  onChange={(e) => setBrand((p) => ({ ...p, tagline: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rbac' && (
          <div className="space-y-5">
            <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-zinc-500" />
              <span>Manajemen PIN &amp; Audit Scope RBAC</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'kitchen', label: 'PIN Admin Dapur' },
                { key: 'admin', label: 'PIN Administrator' },
                { key: 'developer', label: 'PIN Pengembang' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block font-semibold text-zinc-700 mb-1">{label}</label>
                  <input
                    type="text"
                    minLength={4}
                    value={pinInputs[key]}
                    onChange={(e) => setPinInputs((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2 text-xs">
              {Object.values(ROLES).map((roleId) => (
                <div key={roleId} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-zinc-900">
                    <span>{ROLE_META[roleId]?.label}</span>
                    <span className="text-[10px] font-mono bg-zinc-200 px-2 py-0.5 rounded">
                      {ROLE_SCOPES[roleId].length} scopes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-500">{ROLE_SCOPES[roleId].join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-zinc-900">Koneksi Backend API (Vercel / Render / Lokal)</h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
                Status: {backendStatus}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Isi URL backend API Anda (contoh: <code className="font-mono">https://sajian-api.vercel.app</code>) lalu klik tes koneksi.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={backendUrlInput}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="https://sajian-catering-api.vercel.app"
                className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleTestBackend}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-xs cursor-pointer"
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
            <h2 className="font-bold text-base text-zinc-900">Snapshot State &amp; Backup JSON</h2>
            <p className="text-xs text-zinc-500">
              Snapshot aktif: {packages.length} paket · {stalls.length} pondokan · {orders.length} pesanan.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Ekspor JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
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

        {(activeTab === 'theme' || activeTab === 'flags' || activeTab === 'rbac') && (
          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Pengembang'}</span>
            </button>
          </div>
        )}
      </form>
    </DashboardShell>
  );
}
