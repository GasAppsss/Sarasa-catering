import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
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
import { ROLE_META, ROLE_SCOPES, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function DeveloperConsoleView() {
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
          ? `Koneksi API berhasil diverifikasi: ${backendUrlInput.trim()}`
          : 'Berhasil beralih ke Mode Demo Lokal.'
      );
    } catch (err) {
      setConnError(err.message || 'Gagal menghubungi endpoint /api/health.');
    }
  };

  const handleExportJson = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      config,
      packages,
      stalls,
      orders,
    };
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-950 bg-amber-300 px-3 py-1 rounded-full">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer-Only Console • Scope Sistem Eksklusif</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-2">
            Pengaturan Sistem &amp; Kustomisasi Pengembang
          </h1>
          <p className="text-stone-600 text-sm mt-0.5">
            Atur Design Tokens CSS, Feature Flags, Role &amp; Scope RBAC, PIN keamanan, koneksi Backend API, dan ekspor/impor konfigurasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Impor JSON</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          <button
            type="button"
            onClick={resetAllDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Factory Reset</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-600" />
            <span>Koneksi Backend API (Vercel / Render / Lokal)</span>
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
            Status: {backendStatus}
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Masukkan URL deployment backend Anda (contoh: <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">https://sajian-api.vercel.app</code> atau <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">http://localhost:4000</code>). Kosongkan untuk memakai Mode Demo Lokal.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="url"
            value={backendUrlInput}
            onChange={(e) => setBackendUrlInput(e.target.value)}
            placeholder="https://sajian-catering-api.vercel.app"
            className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
          <button
            type="button"
            onClick={handleTestBackend}
            className="px-5 py-2.5 rounded-xl bg-brand-dark text-amber-300 font-extrabold text-xs cursor-pointer"
          >
            Tes &amp; Simpan Koneksi
          </button>
        </div>
        {connMessage && (
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {connMessage}
          </p>
        )}
        {connError && (
          <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {connError}
          </p>
        )}
      </div>

      <form onSubmit={handleSaveDevConfig} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Theme &amp; Design Token Customizer</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {Object.entries(themePresets).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    themeTokens.presetId === id
                      ? 'bg-brand-dark text-amber-300 border-amber-400'
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
                { key: 'primaryDark', label: 'Dark Header/Surface' },
                { key: 'accent', label: 'Accent / CTA Gold' },
                { key: 'background', label: 'Page Background' },
                { key: 'surface', label: 'Card Surface' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] cursor-pointer">
                  <input
                    type="color"
                    value={themeTokens[key] || '#064E3B'}
                    onChange={(e) =>
                      setThemeTokens((p) => ({ ...p, presetId: 'custom', [key]: e.target.value }))
                    }
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-stone-800 block">{label}</span>
                    <span className="font-mono text-[10px] text-stone-500">{themeTokens[key]}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="block font-bold text-stone-600 mb-1">Skala Radius Kartu</label>
                <select
                  value={themeTokens.radiusScale || 'rounded'}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, radiusScale: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 font-bold"
                >
                  <option value="sharp">Sharp (0.5rem)</option>
                  <option value="rounded">Rounded (1.25rem)</option>
                  <option value="pill">Soft Pill (1.75rem)</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-[#FAF8F5] cursor-pointer mt-4 sm:mt-0">
                <input
                  type="checkbox"
                  checked={Boolean(themeTokens.reduceMotion)}
                  onChange={(e) => setThemeTokens((p) => ({ ...p, reduceMotion: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-900"
                />
                <span className="font-bold text-stone-800">Matikan Animasi Berat (Reduced Motion)</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-600" />
              <span>Feature Flags &amp; White-Label Brand</span>
            </h2>

            <div className="space-y-2">
              {Object.entries(flagLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs cursor-pointer"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-stone-100">
              <div>
                <label className="block font-bold text-stone-600 mb-1">Nama Brand Utama</label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => setBrand((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 mb-1">Prefix Kode Order</label>
                <input
                  type="text"
                  value={brand.orderPrefix}
                  onChange={(e) => setBrand((p) => ({ ...p, orderPrefix: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 mb-1">Badge Header</label>
                <input
                  type="text"
                  value={brand.badgeText}
                  onChange={(e) => setBrand((p) => ({ ...p, badgeText: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Manajemen PIN Akses Role</span>
            </h2>
            <p className="text-xs text-stone-500">
              Minimal 4 karakter. Pada mode backend aktif, PIN di-hash dengan <code className="font-mono">scrypt</code> di server.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'kitchen', label: 'PIN Admin Dapur' },
                { key: 'admin', label: 'PIN Administrator' },
                { key: 'developer', label: 'PIN Pengembang' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block font-bold text-stone-600 mb-1">{label}</label>
                  <input
                    type="text"
                    minLength={4}
                    value={pinInputs[key]}
                    onChange={(e) => setPinInputs((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-3">
            <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Audit Matriks Role &amp; Scope RBAC</span>
            </h2>
            <div className="space-y-2 text-xs max-h-52 overflow-y-auto pr-1">
              {Object.values(ROLES).map((roleId) => (
                <div key={roleId} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-brand-dark">
                    <span>{ROLE_META[roleId]?.label}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {ROLE_SCOPES[roleId].length} scopes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-stone-500 leading-relaxed">
                    {ROLE_SCOPES[roleId].join(' • ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-brand-dark text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Database className="w-4 h-4 text-amber-400" />
            <span>
              Snapshot Saat Ini: {packages.length} paket • {stalls.length} pondokan • {orders.length} pesanan
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-extrabold text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Terapkan Pengaturan Pengembang'}</span>
          </button>
        </div>
      </form>
    </main>
  );
}
