import React, { useState } from 'react';
import {
  ChefHat,
  Code2,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Utensils,
  X,
} from 'lucide-react';
import { ROLE_META, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

const IS_DEV_PREVIEW = Boolean(import.meta.env.BASE_URL?.includes('/preview'));

export function Navbar({ onOpenTeamAuth }) {
  const {
    activeRole,
    activeView,
    navigateView,
    config,
    orders,
    quickSwitchDemoRole,
    logoutToClient,
  } = useApp();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { brand, business, featureFlags } = config;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Selesai').length;
  const isStaff = activeRole !== ROLES.CLIENT;
  const showDemoSwitcher = Boolean(featureFlags?.enableDemoQuickSwitch) || activeRole === ROLES.DEVELOPER;
  const showPortal = featureFlags?.enableClientPortal !== false;

  const scrollToSection = (sectionId) => {
    setMobileOpen(false);
    if (activeView !== 'showcase') {
      navigateView('showcase');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const goTo = (view) => {
    setMobileOpen(false);
    navigateView(view);
  };

  const sectionLinks = [
    { id: 'hero-showcase-section', label: 'Showcase' },
    { id: 'catalog-section', label: 'Katalog Menu' },
    { id: 'booking-calculator-section', label: 'Kalkulator' },
    ...(featureFlags?.enableFaqSection !== false ? [{ id: 'info-faq-section', label: 'Profil & FAQ' }] : []),
  ];

  const staffLinks = [
    activeRole === ROLES.KITCHEN && { view: 'kitchen', label: 'Dapur', icon: ChefHat },
    (activeRole === ROLES.ADMIN || activeRole === ROLES.DEVELOPER) && {
      view: 'admin',
      label: 'Admin',
      icon: LayoutDashboard,
      count: activeOrdersCount,
    },
    activeRole === ROLES.DEVELOPER && { view: 'developer', label: 'Dev Config', icon: Code2 },
  ].filter(Boolean);

  const portalButtonClass = (compact) =>
    `inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
      compact ? 'w-9 h-9' : 'px-3.5 h-9'
    } ${
      activeView === 'client-portal'
        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 shadow-sm'
        : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-amber-400/40'
    }`;

  return (
    <header className="no-print sticky top-0 z-40 shadow-lg border-b border-emerald-800/80 backdrop-blur-md bg-brand-dark/95 text-white">
      {business?.announcementBanner && activeView === 'showcase' && !bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-emerald-950 text-[11px] sm:text-xs font-extrabold py-1.5 pl-4 pr-10 flex items-center justify-center gap-2 relative">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{business.announcementBanner}</span>
          <button
            type="button"
            aria-label="Sembunyikan pengumuman"
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="sc-container h-16 flex items-center justify-between gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => goTo('showcase')}
          className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center text-emerald-950 shadow-md shadow-amber-500/20 animate-glow shrink-0 group-hover:scale-105 transition-transform">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-lg leading-none tracking-tight text-white">
                {brand?.shortName || 'SAJIAN'}
              </span>
              <span className="text-amber-400 font-light leading-none tracking-wider sm:tracking-widest text-xs sm:text-sm">
                {brand?.subName || 'CATERING'}
              </span>
              {IS_DEV_PREVIEW && (
                <span className="shrink-0 whitespace-nowrap text-[9px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-extrabold">
                  <span className="sm:hidden">Dev</span>
                  <span className="hidden sm:inline">Dev Preview</span>
                </span>
              )}
            </div>
            {brand?.tagline && (
              <p className="hidden xl:block mt-1 text-[11px] leading-none text-emerald-300/85 truncate max-w-[340px]">
                {brand.tagline}
              </p>
            )}
          </div>
        </button>

        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1">
          {sectionLinks.map((link) => {
            const isActive = link.id === 'hero-showcase-section' && activeView === 'showcase';
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className={`px-3 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive ? 'bg-white/15 text-amber-300 font-bold' : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isStaff && (
            <div className="hidden md:flex items-center gap-1.5 pr-2 mr-1 border-r border-white/20">
              {staffLinks.map(({ view, label, icon: Icon, count }) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => goTo(view)}
                  className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold cursor-pointer ${
                    activeView === view ? 'bg-amber-400 text-emerald-950' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {typeof count === 'number' && (
                    <span className="px-1.5 rounded-full bg-emerald-950 text-amber-300 text-[10px] tabular-nums">{count}</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={logoutToClient}
                title="Keluar ke Mode Klien"
                aria-label="Keluar ke Mode Klien"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {showPortal && (
            <button type="button" onClick={() => goTo('client-portal')} className={portalButtonClass(false)}>
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal Klien</span>
              <span className="sm:hidden">Portal</span>
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-dark animate-menu-drop">
          <div className="sc-container py-3 grid gap-1">
            {sectionLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-50 hover:bg-white/10 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
            {isStaff ? (
              <div className="mt-2 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                {staffLinks.map(({ view, label, icon: Icon }) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => goTo(view)}
                    className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                      activeView === view ? 'bg-amber-400 text-emerald-950' : 'bg-white/10 text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logoutToClient();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="mt-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenTeamAuth?.(ROLES.ADMIN);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 text-xs font-bold cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Login Admin &amp; Tim</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDemoSwitcher && (
        <div className="bg-black/30 border-t border-white/10 py-1.5">
          <div className="sc-container flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Demo Quick-Switch POV (Aktif: {ROLE_META[activeRole]?.shortLabel}):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: ROLES.CLIENT, label: 'Klien', icon: Store },
                { id: ROLES.KITCHEN, label: 'Admin Dapur', icon: ChefHat },
                { id: ROLES.ADMIN, label: 'Administrator', icon: LayoutDashboard },
                { id: ROLES.DEVELOPER, label: 'Pengembang', icon: Code2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => quickSwitchDemoRole(id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    activeRole === id ? 'bg-amber-400 text-emerald-950' : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => onOpenTeamAuth?.(ROLES.ADMIN)}
                className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-amber-200 font-semibold cursor-pointer"
              >
                Halaman Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
