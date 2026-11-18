import React from 'react';
import { ArrowLeft } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="no-print w-full lg:w-60 shrink-0 lg:sticky lg:top-24 bg-white rounded-2xl border border-zinc-200 p-3 space-y-4">
          <div className="px-2.5 pt-1 pb-2 border-b border-zinc-100">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-emerald-50 px-2 py-0.5 rounded-md">
              {roleLabel}
            </span>
            <p className="font-bold text-sm text-zinc-900 mt-1.5">{title}</p>
          </div>

          <nav aria-label="Navigasi Dashboard" className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {onBackToSite && (
            <div className="hidden lg:block pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onBackToSite}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Situs Publik</span>
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 w-full space-y-6">
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
            {headerActions && <div className="flex flex-wrap items-center gap-2">{headerActions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
