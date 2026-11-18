import React from 'react';
import {
  ChefHat,
  Code2,
  LayoutDashboard,
  LogOut,
  UserCheck,
  Utensils,
} from 'lucide-react';
import { ROLE_META, ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function Navbar({ onOpenTeamAuth }) {
  const {
    activeRole,
    activeView,
    navigateView,
    config,
    quickSwitchDemoRole,
    logoutToClient,
  } = useApp();

  const { brand, featureFlags } = config;
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
    <header className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateView('showcase')}
          className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0"
        >
          <span className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <Utensils className="w-4 h-4" />
          </span>
          <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-900">
            {brand?.shortName || 'SAJIAN'}{' '}
            <span className="font-medium text-zinc-500">{brand?.subName || 'CATERING'}</span>
          </span>
        </button>

        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollToSection('catalog-section')}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Menu &amp; Paket
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('booking-wizard-section')}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Pesan Acara
          </button>
          {featureFlags?.enableFaqSection !== false && (
            <button
              type="button"
              onClick={() => scrollToSection('info-faq-section')}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Tentang &amp; FAQ
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {featureFlags?.enableClientPortal !== false && (
            <button
              type="button"
              onClick={() => navigateView('client-portal')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'client-portal'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Klien</span>
            </button>
          )}

          {!isStaff ? (
            <button
              type="button"
              onClick={() => scrollToSection('booking-wizard-section')}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-dark text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Pesan Sekarang
            </button>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
              {activeRole === ROLES.KITCHEN && (
                <button
                  type="button"
                  onClick={() => navigateView('kitchen')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeView === 'kitchen' ? 'bg-brand-primary text-white' : 'bg-zinc-100 text-zinc-700'
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeView === 'admin' ? 'bg-brand-primary text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
              {activeRole === ROLES.DEVELOPER && (
                <button
                  type="button"
                  onClick={() => navigateView('developer')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeView === 'developer' ? 'bg-brand-primary text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Dev</span>
                </button>
              )}
              <button
                type="button"
                onClick={logoutToClient}
                aria-label="Keluar ke tampilan klien"
                title="Keluar ke tampilan klien"
                className="p-2 rounded-lg text-zinc-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showDemoSwitcher && (
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-1.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600">
            <span className="font-medium">
              Mode Demo Quick-Switch · Aktif:{' '}
              <strong className="text-zinc-900">{ROLE_META[activeRole]?.shortLabel}</strong>
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: ROLES.CLIENT, label: 'Klien' },
                { id: ROLES.KITCHEN, label: 'Dapur' },
                { id: ROLES.ADMIN, label: 'Admin' },
                { id: ROLES.DEVELOPER, label: 'Pengembang' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => quickSwitchDemoRole(id)}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeRole === id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={onOpenTeamAuth}
                className="px-2.5 py-0.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
