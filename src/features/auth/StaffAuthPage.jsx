import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { DEFAULT_STAFF_ACCOUNTS } from '../../config/defaults.js';
import { getRoleScopes, ROLE_META, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';
import { PasswordStrengthMeter } from '../../components/shared/PasswordStrengthMeter.jsx';

const IS_DEV_PREVIEW = Boolean(import.meta.env.BASE_URL?.includes('/preview'));

const PORTAL_ROLES = [
  {
    id: ROLES.ADMIN,
    label: 'Admin',
    fullTitle: 'Portal Administrator Bisnis',
    subtitle: 'Kelola omzet, margin HPP, verifikasi DP, katalog paket, dan pengaturan bisnis.',
    placeholderEmail: 'admin@sajiancatering.id',
    icon: LayoutDashboard,
    badge: 'Manajemen & Keuangan',
  },
  {
    id: ROLES.DEVELOPER,
    label: 'Developer',
    fullTitle: 'Konsol Pengembang Sistem',
    subtitle: 'Konfigurasi tema & design tokens, feature flags, koneksi API, RBAC, dan backup.',
    placeholderEmail: 'dev@sajiancatering.id',
    icon: Code2,
    badge: 'Sistem & Infrastruktur',
  },
  {
    id: ROLES.KITCHEN,
    label: 'Dapur',
    fullTitle: 'Kitchen Command Center',
    subtitle: 'Pantau jadwal produksi harian, rincian alergen, tahap masak, dan cetak tiket dapur.',
    placeholderEmail: 'dapur@sajiancatering.id',
    icon: ChefHat,
    badge: 'Operasional Produksi',
  },
];

function formatCountdown(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StaffAuthPage({ initialRole = ROLES.ADMIN, initialMode = 'login', onBackToSite }) {
  const {
    config,
    backendStatus,
    authenticateStaff,
    requestPasswordReset,
    verifyPasswordResetCode,
    completePasswordReset,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState(
    PORTAL_ROLES.some((r) => r.id === initialRole) ? initialRole : ROLES.ADMIN
  );
  const [mode, setMode] = useState(initialMode === 'forgot' ? 'forgot' : 'login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Forgot password state
  const [resetMethod, setResetMethod] = useState('otp'); // 'otp' | 'recovery_key'
  const [resetStep, setResetStep] = useState(1); // 1: identify, 2: verify OTP, 3: new password, 4: done
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMeta, setResetMeta] = useState(null); // { maskedEmail, role, previewCode, deliveryMode }
  const [otpRemainingSec, setOtpRemainingSec] = useState(0);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resetDoneInfo, setResetDoneInfo] = useState(null);

  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (PORTAL_ROLES.some((r) => r.id === initialRole)) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  useEffect(() => {
    if (otpRemainingSec <= 0) return undefined;
    const timer = setInterval(() => setOtpRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpRemainingSec]);

  useEffect(() => {
    if (resendCooldownSec <= 0) return undefined;
    const timer = setInterval(() => setResendCooldownSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldownSec]);

  const activePortal = PORTAL_ROLES.find((r) => r.id === selectedRole) || PORTAL_ROLES[0];
  const activeScopes = getRoleScopes(selectedRole);
  const showPreviewHelper = IS_DEV_PREVIEW;
  const brand = config?.brand || {};

  const openForgotPassword = () => {
    setMode('forgot');
    setResetMethod('otp');
    setResetStep(1);
    setResetIdentifier(identifier.trim());
    setOtpDigits(['', '', '', '', '', '']);
    setRecoveryKeyInput('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetMeta(null);
    setResetDoneInfo(null);
  };

  const backToLogin = (prefillEmail = '', prefillRole = null) => {
    setMode('login');
    if (prefillRole && PORTAL_ROLES.some((r) => r.id === prefillRole)) {
      setSelectedRole(prefillRole);
    }
    if (prefillEmail) setIdentifier(prefillEmail);
    setPassword('');
    setLoginError('');
    setResetError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      await authenticateStaff({
        identifier,
        password,
        role: selectedRole,
        rememberMe,
      });
    } catch (err) {
      setLoginError(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setResetError('');
    setResetSubmitting(true);
    try {
      const res = await requestPasswordReset({ identifier: resetIdentifier });
      setResetMeta(res);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpRemainingSec(res.expiresInSeconds || 600);
      setResendCooldownSec(30);
      setResetStep(2);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setResetError(err.message || 'Tidak dapat mengirim kode OTP.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleOtpDigitChange = (idx, rawValue) => {
    const clean = rawValue.replace(/\D/g, '');
    if (!clean) {
      setOtpDigits((prev) => prev.map((d, i) => (i === idx ? '' : d)));
      return;
    }
    if (clean.length > 1) {
      const sliced = clean.slice(0, 6).split('');
      setOtpDigits((prev) => prev.map((_, i) => sliced[i] || ''));
      const focusIdx = Math.min(5, sliced.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }
    setOtpDigits((prev) => prev.map((d, i) => (i === idx ? clean : d)));
    if (idx < 5) otpInputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const chars = pasted.split('');
    setOtpDigits([0, 1, 2, 3, 4, 5].map((i) => chars[i] || ''));
    otpInputRefs.current[Math.min(5, chars.length)]?.focus();
  };

  const handleVerifyOtpStep = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setResetError('Masukkan lengkap 6 digit kode OTP.');
      return;
    }
    setResetError('');
    setResetSubmitting(true);
    try {
      const res = await verifyPasswordResetCode({ identifier: resetIdentifier, code });
      setResetMeta((prev) => ({ ...prev, ...res }));
      setResetStep(3);
    } catch (err) {
      setResetError(err.message || 'Kode OTP tidak valid.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSubmitting(true);
    try {
      const payload =
        resetMethod === 'otp'
          ? {
              method: 'otp',
              identifier: resetIdentifier,
              code: otpDigits.join(''),
              newPassword,
              confirmPassword,
            }
          : {
              method: 'recovery_key',
              identifier: resetIdentifier,
              recoveryKey: recoveryKeyInput,
              newPassword,
              confirmPassword,
            };
      const res = await completePasswordReset(payload);
      setResetDoneInfo(res);
      setResetStep(4);
    } catch (err) {
      setResetError(err.message || 'Gagal menyimpan password baru.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleCopyPreviewOtp = async () => {
    if (!resetMeta?.previewCode) return;
    try {
      await navigator.clipboard.writeText(resetMeta.previewCode);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleAutofillPreviewOtp = () => {
    if (!resetMeta?.previewCode) return;
    const chars = String(resetMeta.previewCode).slice(0, 6).split('');
    setOtpDigits([0, 1, 2, 3, 4, 5].map((i) => chars[i] || ''));
    setResetError('');
  };

  const fillDemoAccount = (acc) => {
    setSelectedRole(acc.role);
    setIdentifier(acc.email);
    setPassword(acc.password);
    setLoginError('');
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#FAF8F5] grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT PANEL: Royal Emerald & Gold Brand & Security Showcase */}
      <aside className="lg:col-span-5 bg-brand-dark text-white relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl animate-float-slow pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(251,191,36,0.9) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-emerald-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Kembali ke Showcase</span>
            </button>
            {IS_DEV_PREVIEW && (
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-emerald-950 font-extrabold">
                Dev Preview
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center text-emerald-950 shadow-lg shadow-amber-500/20 animate-glow shrink-0">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  {brand.shortName || 'SAJIAN'}
                </span>
                <span className="text-amber-400 font-light tracking-widest text-sm">
                  {brand.subName || 'CATERING'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">Portal Autentikasi Internal &amp; Sistem</p>
            </div>
          </div>

          <div className="hidden lg:block space-y-5 pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {activePortal.badge}
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                {activePortal.fullTitle}
              </h1>
              <p className="text-sm text-emerald-100/85 leading-relaxed">{activePortal.subtitle}</p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300">Perlindungan Akses Berlapis</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700/70">
                  {activeScopes.length} RBAC Scopes
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-emerald-100/90">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Enkripsi kredensial salted scrypt &amp; sesi token JWT berbatas waktu.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Proteksi anti brute-force dengan penguncian sementara otomatis setelah 5x salah.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Pemulihan 2-jalur: Kode OTP Email 6-Digit &amp; Master Recovery Key darurat.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden lg:flex items-center justify-between pt-6 border-t border-white/10 text-[11px] text-emerald-200/80">
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {backendStatus === 'connected'
              ? 'Terhubung ke Server API (JWT + Scrypt)'
              : 'Mode Preview Lokal — Siap Uji Coba Penuh'}
          </span>
          <span className="font-mono text-emerald-300/70">RBAC v2</span>
        </div>
      </aside>

      {/* RIGHT PANEL: Ultra-Clean Auth Form Surface */}
      <main className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 min-w-0">
        <div className="w-full max-w-[480px] bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-emerald-950/5 p-6 sm:p-8 space-y-6 animate-menu-drop">
          {mode === 'login' ? (
            <>
              <div className="space-y-1.5">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
                  Masuk Portal Internal
                </p>
                <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                  Login {ROLE_META[selectedRole]?.label}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Pilih peran Anda lalu masukkan email atau username beserta password.
                </p>
              </div>

              {/* Role Segmented Switcher */}
              <div
                role="tablist"
                aria-label="Pilih Role Portal"
                className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#FAF8F5] border border-stone-200"
              >
                {PORTAL_ROLES.map(({ id, label, icon: Icon }) => {
                  const isActive = selectedRole === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setSelectedRole(id);
                        setLoginError('');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-dark text-amber-300 shadow-md'
                          : 'text-stone-600 hover:text-brand-dark hover:bg-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-emerald-800'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="auth-identifier"
                    className="block text-xs font-bold text-stone-700 mb-1.5"
                  >
                    Email atau Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={activePortal.placeholderEmail}
                      className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password" className="block text-xs font-bold text-stone-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs font-bold text-emerald-800 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-11 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition-shadow"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-2 text-xs text-stone-600 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-900 cursor-pointer"
                    />
                    <span>Ingat sesi saya (7 hari)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-stone-400">
                    {activeScopes.length} izin aktif
                  </span>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm shadow-lg shadow-emerald-950/15 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{loginSubmitting ? 'Memverifikasi Kredensial...' : `Masuk Dashboard ${activePortal.label}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Collapsible Preview Account Guide (only in local-demo / dev preview) */}
              {showPreviewHelper && (
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    aria-expanded={showDemoGuide}
                    onClick={() => setShowDemoGuide((v) => !v)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Panduan Akun Preview (Uji Coba)</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-500 transition-transform ${showDemoGuide ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDemoGuide && (
                    <div className="mt-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 p-3.5 space-y-2.5 text-xs">
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Klik <strong>Isi Form</strong> untuk mencoba login cepat pada mode Preview. Password dapat
                        diubah melalui menu <em>Lupa Password</em> atau <em>Keamanan &amp; Akun</em>.
                      </p>
                      <div className="space-y-2">
                        {[DEFAULT_STAFF_ACCOUNTS.admin, DEFAULT_STAFF_ACCOUNTS.developer, DEFAULT_STAFF_ACCOUNTS.kitchen].map(
                          (acc) => (
                            <div
                              key={acc.role}
                              className="rounded-xl bg-white border border-stone-200 p-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <p className="font-extrabold text-brand-dark text-[11px]">
                                  {ROLE_META[acc.role]?.shortLabel} · <span className="font-mono text-stone-600">{acc.email}</span>
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono truncate">
                                  Pass: <strong className="text-stone-800">{acc.password}</strong> · Key:{' '}
                                  <strong className="text-emerald-800">{acc.recoveryKey}</strong>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => fillDemoAccount(acc)}
                                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-bold text-[10px] cursor-pointer"
                              >
                                Isi Form
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ==================== FORGOT PASSWORD FLOW ==================== */
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600">
                    Pemulihan Akses Akun
                  </p>
                  <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">Lupa Password</h2>
                  <p className="text-xs text-stone-500">
                    Atur ulang password akun Admin, Developer, atau Dapur dengan aman.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => backToLogin()}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:text-brand-dark hover:bg-stone-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>

              {/* Method Switcher (visible before done) */}
              {resetStep < 4 && (
                <div
                  role="tablist"
                  aria-label="Metode Pemulihan Password"
                  className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#FAF8F5] border border-stone-200"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resetMethod === 'otp'}
                    onClick={() => {
                      setResetMethod('otp');
                      setResetStep(1);
                      setResetError('');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      resetMethod === 'otp'
                        ? 'bg-brand-dark text-amber-300 shadow-sm'
                        : 'text-stone-600 hover:text-brand-dark'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Email OTP</span>
                    <span className="hidden sm:inline">Email OTP 6-Digit</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resetMethod === 'recovery_key'}
                    onClick={() => {
                      setResetMethod('recovery_key');
                      setResetStep(1);
                      setResetError('');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      resetMethod === 'recovery_key'
                        ? 'bg-brand-dark text-amber-300 shadow-sm'
                        : 'text-stone-600 hover:text-brand-dark'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">Recovery Key</span>
                    <span className="hidden sm:inline">Master Recovery Key</span>
                  </button>
                </div>
              )}

              {/* OTP 3-Step Visual Stepper */}
              {resetMethod === 'otp' && resetStep < 4 && (
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  {[
                    { num: 1, label: 'Identifikasi', shortLabel: 'Akun' },
                    { num: 2, label: 'Kode OTP', shortLabel: 'OTP' },
                    { num: 3, label: 'Sandi Baru', shortLabel: 'Sandi' },
                  ].map((s) => {
                    const done = resetStep > s.num;
                    const active = resetStep === s.num;
                    return (
                      <div
                        key={s.num}
                        className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border font-bold ${
                          done
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : active
                              ? 'bg-amber-50 border-amber-300 text-brand-dark'
                              : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] shrink-0 ${
                            done
                              ? 'bg-emerald-600 text-white'
                              : active
                                ? 'bg-brand-dark text-amber-300'
                                : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {done ? <Check className="w-2.5 h-2.5" /> : s.num}
                        </span>
                        <span className="sm:hidden whitespace-nowrap">{s.shortLabel}</span>
                        <span className="hidden sm:inline whitespace-nowrap">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* METHOD 1: EMAIL OTP FLOW */}
              {resetMethod === 'otp' && resetStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label htmlFor="reset-otp-identifier" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Email atau Username Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reset-otp-identifier"
                        type="text"
                        required
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="admin@sajiancatering.id atau dev@sajiancatering.id"
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      Kode OTP 6-digit sekali pakai (berlaku 10 menit) akan dibuat untuk memverifikasi identitas Anda.
                    </p>
                  </div>

                  {resetError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>{resetSubmitting ? 'Membuat Kode OTP...' : 'Kirim Kode OTP 6-Digit'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {resetMethod === 'otp' && resetStep === 2 && (
                <form onSubmit={handleVerifyOtpStep} className="space-y-4">
                  <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-3.5 text-xs space-y-1">
                    <p className="font-bold text-brand-dark">Masukkan Kode Verifikasi 6-Digit</p>
                    <p className="text-stone-600">
                      Dikirim ke <strong className="font-mono text-stone-800">{resetMeta?.maskedEmail || resetIdentifier}</strong> ·
                      Berlaku <strong className="font-mono text-amber-700">{formatCountdown(otpRemainingSec)}</strong>
                    </p>
                  </div>

                  {/* Preview Simulated Email Inbox (only shown when previewCode is available) */}
                  {resetMeta?.previewCode && (
                    <div className="rounded-2xl bg-emerald-950 text-white p-4 border border-amber-400/40 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                          <Inbox className="w-3.5 h-3.5" />
                          Simulasi Kotak Masuk Email (Mode Preview)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          data-testid="preview-otp-code"
                          className="font-mono text-xl font-extrabold tracking-[0.35em] text-amber-300"
                        >
                          {resetMeta.previewCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCopyPreviewOtp}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white cursor-pointer"
                          >
                            {copiedOtp ? <Check className="w-3 h-3 text-amber-300" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedOtp ? 'Disalin' : 'Salin'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAutofillPreviewOtp}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 text-[11px] font-extrabold cursor-pointer"
                          >
                            Isi Otomatis
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6-Digit OTP Input Boxes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Kode OTP (6 Digit)</label>
                    <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          aria-label={`Digit OTP ${idx + 1}`}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-full h-12 rounded-xl border border-stone-300 bg-white text-center font-mono text-lg font-extrabold text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800"
                        />
                      ))}
                    </div>
                  </div>

                  {resetError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="font-bold text-stone-500 hover:text-brand-dark cursor-pointer"
                    >
                      Ganti email
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldownSec > 0 || resetSubmitting}
                      onClick={() => handleRequestOtp()}
                      className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-amber-600 disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>
                        {resendCooldownSec > 0 ? `Kirim ulang (${resendCooldownSec}d)` : 'Kirim ulang kode'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={resetSubmitting || otpDigits.join('').length < 6}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>{resetSubmitting ? 'Memverifikasi OTP...' : 'Verifikasi Kode OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {resetMethod === 'otp' && resetStep === 3 && (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      OTP terverifikasi untuk <strong>{resetMeta?.maskedEmail || resetIdentifier}</strong>. Buat
                      password baru Anda.
                    </span>
                  </div>

                  <div>
                    <label htmlFor="reset-new-pw" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reset-new-pw"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Buat password baru yang kuat"
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      />
                      <button
                        type="button"
                        aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={newPassword} />
                  </div>

                  <div>
                    <label htmlFor="reset-confirm-pw" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      id="reset-confirm-pw"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  {resetError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {resetSubmitting ? 'Menyimpan Password...' : 'Simpan Password Baru'}
                  </button>
                </form>
              )}

              {/* METHOD 2: MASTER RECOVERY KEY FLOW */}
              {resetMethod === 'recovery_key' && resetStep < 4 && (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-3.5 text-xs text-stone-600 leading-relaxed">
                    Gunakan <strong className="text-brand-dark">Master Recovery Key</strong> darurat (contoh:{' '}
                    <code className="font-mono text-emerald-900">SJC-ADM-XXXX-XXXX</code>) untuk memulihkan akun Admin
                    atau Developer tanpa bergantung pada layanan email.
                  </div>

                  <div>
                    <label htmlFor="rk-identifier" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Email atau Username Akun
                    </label>
                    <input
                      id="rk-identifier"
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="dev@sajiancatering.id atau admin@sajiancatering.id"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="rk-secret" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Master Recovery Key
                    </label>
                    <input
                      id="rk-secret"
                      type="text"
                      required
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                      placeholder="SJC-DEV-XXXX-XXXX"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="rk-new-pw" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        id="rk-new-pw"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter (huruf besar, kecil & angka)"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      />
                      <button
                        type="button"
                        aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={newPassword} />
                  </div>

                  <div>
                    <label htmlFor="rk-confirm-pw" className="block text-xs font-bold text-stone-700 mb-1.5">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      id="rk-confirm-pw"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  {resetError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {resetSubmitting ? 'Memverifikasi Recovery Key...' : 'Reset Password dengan Recovery Key'}
                  </button>
                </form>
              )}

              {/* STEP 4: RESET SUCCESS */}
              {resetStep === 4 && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/20 animate-glow">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-extrabold text-brand-dark">Password Berhasil Direset!</h3>
                    <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                      Kredensial untuk akun{' '}
                      <strong className="text-brand-dark">
                        {ROLE_META[resetDoneInfo?.role]?.label || resetDoneInfo?.email || resetIdentifier}
                      </strong>{' '}
                      telah diperbarui dan status lockout telah dibersihkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => backToLogin(resetDoneInfo?.email || resetIdentifier, resetDoneInfo?.role)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-primary hover:bg-brand-dark text-amber-300 font-extrabold text-sm shadow-lg cursor-pointer"
                  >
                    <span>Masuk dengan Password Baru</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-[11px] text-stone-500 text-center">
          &copy; {new Date().getFullYear()} {brand.name || 'Sajian Catering'} · Akses Khusus Internal
        </p>
      </main>
    </div>
  );
}
