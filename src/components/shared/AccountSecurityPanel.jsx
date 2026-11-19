import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ROLE_META } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';
import { PasswordStrengthMeter } from './PasswordStrengthMeter.jsx';

export function AccountSecurityPanel() {
  const { activeRole, activeAccount, backendStatus, changeOwnPassword, rotateAccountRecoveryKey } = useApp();
  const roleMeta = ROLE_META[activeRole];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [rotatePassword, setRotatePassword] = useState('');
  const [rotateLoading, setRotateLoading] = useState(false);
  const [rotateError, setRotateError] = useState('');
  const [revealedKey, setRevealedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword, confirmPassword });
      setPwSuccess('Password akun Anda telah diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Gagal memperbarui password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleRotateRecoveryKey = async (e) => {
    e.preventDefault();
    setRotateError('');
    setRotateLoading(true);
    try {
      const res = await rotateAccountRecoveryKey({ currentPassword: rotatePassword });
      setRevealedKey(res.recoveryKey || '');
      setRotatePassword('');
    } catch (err) {
      setRotateError(err.message || 'Gagal membuat ulang Master Recovery Key.');
    } finally {
      setRotateLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Fallback ignored in restricted browsers
    }
  };

  const handleDownloadKey = () => {
    if (!revealedKey) return;
    const content = [
      'SAJIAN CATERING — MASTER RECOVERY KEY DARURAT',
      '=============================================',
      `Role     : ${roleMeta?.label || activeRole}`,
      `Username : ${activeAccount?.username || activeRole}`,
      `Email    : ${activeAccount?.email || '-'}`,
      `Key      : ${revealedKey}`,
      `Dibuat   : ${new Date().toLocaleString('id-ID')}`,
      '',
      'Simpan berkas ini di tempat aman (password manager / brankas offline).',
      'Key ini digunakan apabila Anda lupa password dan tidak dapat mengakses email OTP.',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sajian-recovery-key-${activeRole}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-brand-dark text-white p-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              {roleMeta?.label || activeRole}
            </span>
            <h2 className="text-lg font-extrabold text-white">Keamanan Akun &amp; Pemulihan Akses</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <strong className="font-mono">{activeAccount?.username || activeRole}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeAccount?.email || '-'}</span>
              </span>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-amber-200">
              <Lock className="w-3 h-3 text-amber-400" />
              {backendStatus === 'connected' ? 'Scrypt + JWT Server' : 'Mode Preview Lokal'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form
          onSubmit={handleChangePassword}
          className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-brand-dark">Ubah Password Akun</h3>
              <p className="text-[11px] text-stone-500">Perbarui password login secara berkala untuk menjaga keamanan.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="sec-current-pw" className="block font-bold text-stone-700 mb-1">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  id="sec-current-pw"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <button
                  type="button"
                  aria-label={showCurrent ? 'Sembunyikan password saat ini' : 'Lihat password saat ini'}
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="sec-new-pw" className="block font-bold text-stone-700 mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  id="sec-new-pw"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter (huruf besar, kecil & angka)"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <button
                  type="button"
                  aria-label={showNew ? 'Sembunyikan password baru' : 'Lihat password baru'}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <label htmlFor="sec-confirm-pw" className="block font-bold text-stone-700 mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                id="sec-confirm-pw"
                type={showNew ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          {pwError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {pwLoading ? 'Menyimpan Password...' : 'Simpan Password Baru'}
          </button>
        </form>

        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-brand-dark">Master Recovery Key Darurat</h3>
              <p className="text-[11px] text-stone-500">
                Gunakan key ini pada menu Lupa Password apabila email OTP tidak dapat diakses.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-stone-200 p-3.5 text-xs text-stone-600 space-y-1.5">
            <p className="font-bold text-stone-800">Status Recovery Key:</p>
            <p className="leading-relaxed">
              Tersimpan aman dalam bentuk terenkripsi. Demi keamanan, key lama tidak ditampilkan kembali — buat key baru
              kapan saja jika Anda perlu mencatat salinan baru.
            </p>
          </div>

          {revealedKey && (
            <div className="rounded-xl bg-emerald-950 text-white p-4 space-y-3 border border-amber-400/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Recovery Key Baru (Tampil 1 Kali)
                </span>
              </div>
              <p className="font-mono text-base sm:text-lg font-extrabold tracking-widest text-amber-300 break-all">
                {revealedKey}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Tersalin!' : 'Salin Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-xs font-extrabold text-emerald-950 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .TXT</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleRotateRecoveryKey} className="space-y-3 text-xs pt-1">
            <div>
              <label htmlFor="sec-rotate-pw" className="block font-bold text-stone-700 mb-1">
                Konfirmasi Password Saat Ini untuk Rotasi Key
              </label>
              <input
                id="sec-rotate-pw"
                type="password"
                required
                value={rotatePassword}
                onChange={(e) => setRotatePassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {rotateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{rotateError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={rotateLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-900/20 bg-white hover:bg-emerald-50 text-brand-dark font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotateLoading ? 'animate-spin' : ''}`} />
              <span>{rotateLoading ? 'Membuat Key Baru...' : 'Buat Ulang Master Recovery Key'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
