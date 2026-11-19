import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function DashboardShell({
  roleLabel,
  title,
  subtitle,
  navItems = [],
  activeTab,
  onSelectTab,
  headerActions,
  onBackToSite,
  children,
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="no-print w-full lg:w-64 shrink-0 lg:sticky lg:top-24 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="bg-brand-dark text-white p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 bg-amber-400 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              {roleLabel}
            </span>
            <p className="font-extrabold text-sm text-white mt-2 leading-snug">{title}</p>
          </div>

          <div className="p-3 space-y-3">
            <nav aria-label="Navigasi Dashboard" className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-dark text-amber-300 shadow-md scale-[1.01]'
                        : 'text-stone-600 hover:text-brand-dark hover:bg-amber-50/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-emerald-800'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {onBackToSite && (
              <div className="hidden lg:block pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onBackToSite}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-brand-dark hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kembali ke Showcase</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 w-full space-y-6">
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-stone-600 mt-0.5">{subtitle}</p>}
            </div>
            {headerActions && <div className="flex flex-wrap items-center gap-2">{headerActions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
