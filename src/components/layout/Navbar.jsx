import React from 'react';
import {
  ChefHat,
  Code2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  UserCheck,
  Utensils,
} from 'lucide-react';
import { ROLES, ROLE_META } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function Navbar({ onOpenTeamAuth }) {
  const {
    activeRole,
    activeView,
    navigateView,
    config,
    orders,
    backendStatus,
    quickSwitchDemoRole,
    logoutToClient,
  } = useApp();

  const { brand, business, featureFlags } = config;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Selesai').length;
  const isStaff = activeRole !== ROLES.CLIENT;
  const showDemoSwitcher = Boolean(featureFlags?.enableDemoQuickSwitch) || activeRole === ROLES.DEVELOPER;

  const scrollToSection = (sectionId) => {
    if (activeView !== 'showcase') {
      navigateView('showcase');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="no-print sticky top-0 z-40 shadow-lg border-b border-white/10 backdrop-blur-md bg-brand-dark/95 text-white">
      {business?.announcementBanner && activeView === 'showcase' && (
        <div className="bg-brand-accent text-brand-dark text-[11px] sm:text-xs font-bold py-1.5 px-4 text-center">
          {business.announcementBanner}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <button
            type="button"
            onClick={() => navigateView('showcase')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 shadow-md group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  {brand?.shortName || 'SAJIAN'}
                </span>
                <span className="text-amber-300 font-light tracking-widest text-sm">
                  {brand?.subName || 'CATERING'}
                </span>
                {brand?.badgeText && (
                  <span className="hidden lg:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-amber-200 font-semibold border border-amber-300/30">
                    {brand.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/85 line-clamp-1">{brand?.tagline}</p>
            </div>
          </button>

          <span
            title={backendStatus === 'connected' ? 'Terhubung ke API Backend' : 'Mode Demo Lokal'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              backendStatus === 'connected'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                : 'bg-white/10 border-white/20 text-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {backendStatus === 'connected' ? 'API Live' : 'Demo Lokal'}
          </span>
        </div>

        <nav aria-label="Navigasi Utama" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => scrollToSection('hero-showcase-section')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'showcase' ? 'bg-white/15 text-white' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            Showcase
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('catalog-section')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Katalog Menu
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('booking-calculator-section')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Kalkulator
          </button>
          {featureFlags?.enableFaqSection !== false && (
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              FAQ &amp; S&amp;K
            </button>
          )}
          {featureFlags?.enableClientPortal !== false && (
            <button
              type="button"
              onClick={() => navigateView('client-portal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'client-portal'
                  ? 'bg-brand-accent text-brand-dark shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/30'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Klien</span>
            </button>
          )}

          {isStaff && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
              {activeRole === ROLES.KITCHEN && (
                <button
                  type="button"
                  onClick={() => navigateView('kitchen')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    activeView === 'kitchen' ? 'bg-amber-400 text-emerald-950' : 'bg-white/15 text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Dapur</span>
                </button>
              )}
              {(activeRole === ROLES.ADMIN || activeRole === ROLES.DEVELOPER) && (
                <button
                  type="button"
                  onClick={() => navigateView('admin')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    activeView === 'admin' ? 'bg-amber-400 text-emerald-950' : 'bg-white/15 text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-amber-300 text-[10px]">
                    {activeOrdersCount}
                  </span>
                </button>
              )}
              {activeRole === ROLES.DEVELOPER && (
                <button
                  type="button"
                  onClick={() => navigateView('developer')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    activeView === 'developer' ? 'bg-amber-400 text-emerald-950' : 'bg-white/15 text-amber-300'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Dev Config</span>
                </button>
              )}
              <button
                type="button"
                onClick={logoutToClient}
                title="Keluar ke Mode Klien"
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </nav>
      </div>

      {showDemoSwitcher && (
        <div className="bg-black/30 border-t border-white/10 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
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
                    activeRole === id
                      ? 'bg-amber-400 text-emerald-950'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={onOpenTeamAuth}
                className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-amber-200 font-semibold cursor-pointer"
              >
                Login PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
