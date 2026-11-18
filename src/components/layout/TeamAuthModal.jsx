import React, { useEffect, useState } from 'react';
import { AlertCircle, ChefHat, Code2, KeyRound, LayoutDashboard, ShieldCheck, X } from 'lucide-react';
import { getRoleScopes, ROLE_META, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../ui/Modal.jsx';

const STAFF_ROLES = [
  { id: ROLES.KITCHEN, icon: ChefHat, defaultHint: 'Default demo: 1122' },
  { id: ROLES.ADMIN, icon: LayoutDashboard, defaultHint: 'Default demo: 2233' },
  { id: ROLES.DEVELOPER, icon: Code2, defaultHint: 'Hanya Pengembang (Default: 9900)' },
];

export function TeamAuthModal({ isOpen, onClose, initialRole = ROLES.KITCHEN, showDeveloperOption = false }) {
  const { authenticateRole, backendStatus } = useApp();
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setPin('');
      setError('');
    }
  }, [initialRole, isOpen]);

  const visibleRoles = showDeveloperOption
    ? STAFF_ROLES
    : STAFF_ROLES.filter((r) => r.id !== ROLES.DEVELOPER || initialRole === ROLES.DEVELOPER);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authenticateRole(selectedRole, pin);
      onClose();
    } catch (err) {
      setError(err.message || 'PIN tidak valid.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeMeta = ROLE_META[selectedRole];
  const scopes = getRoleScopes(selectedRole);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-brand-dark text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-accent text-brand-dark flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Portal Akses Tim &amp; Pengembang</h3>
              <p className="text-[11px] text-emerald-200">
                {backendStatus === 'connected'
                  ? 'Autentikasi terhubung ke server API (JWT + scrypt)'
                  : 'Mode Demo Lokal — pilih role dan masukkan PIN akses'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup modal autentikasi"
            onClick={onClose}
            className="text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {visibleRoles.map(({ id, icon: Icon }) => {
              const meta = ROLE_META[id];
              const active = selectedRole === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(id);
                    setError('');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-950 text-white border-amber-400 shadow-md'
                      : 'bg-[#FAF8F5] text-stone-800 border-stone-200 hover:border-emerald-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-amber-400' : 'text-emerald-800'}`} />
                  <p className="font-bold text-xs">{meta.shortLabel}</p>
                  <p className={`text-[10px] mt-0.5 ${active ? 'text-emerald-200' : 'text-stone-500'}`}>
                    {scopes && id === selectedRole ? `${scopes.length} scopes` : 'Pilih role'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xs text-emerald-950">{activeMeta?.label}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                {scopes.length} izin aktif
              </span>
            </div>
            <p className="text-xs text-stone-600">{activeMeta?.description}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {scopes.slice(0, 5).map((s) => (
                <span key={s} className="text-[10px] font-mono bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-600">
                  {s}
                </span>
              ))}
              {scopes.length > 5 && (
                <span className="text-[10px] text-stone-500 font-semibold">+{scopes.length - 5} lainnya</span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="team-pin-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Masukkan PIN Akses ({activeMeta?.shortLabel})
            </label>
            <input
              id="team-pin-input"
              type="password"
              inputMode="numeric"
              required
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={STAFF_ROLES.find((r) => r.id === selectedRole)?.defaultHint || 'Masukkan PIN'}
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            {!showDeveloperOption && selectedRole !== ROLES.DEVELOPER ? (
              <button
                type="button"
                onClick={() => setSelectedRole(ROLES.DEVELOPER)}
                className="text-[11px] font-semibold text-stone-400 hover:text-emerald-900 cursor-pointer"
              >
                Akses Pengembang →
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-amber-300 font-extrabold text-xs hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Memverifikasi...' : 'Masuk Dashboard'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
