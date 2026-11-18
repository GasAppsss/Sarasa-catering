import React, { useState } from 'react';
import {
  ChefHat,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { KitchenDashboardView } from '../kitchen/KitchenDashboardView.jsx';
import { AdminCatalogTab } from './AdminCatalogTab.jsx';
import { AdminOrdersTab } from './AdminOrdersTab.jsx';
import { AdminOverviewTab } from './AdminOverviewTab.jsx';
import { AdminSettingsTab } from './AdminSettingsTab.jsx';

export function AdminDashboardView({ onSwitchToShowcase }) {
  const { config } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const TABS = [
    { id: 'overview', label: 'KPI & Analitik', icon: LayoutDashboard },
    { id: 'orders', label: 'Pesanan & Verifikasi DP', icon: FileText },
    { id: 'catalog', label: 'Katalog & Margin', icon: Package },
    { id: 'kitchen', label: 'Monitor Dapur', icon: ChefHat },
    { id: 'settings', label: 'Pengaturan Bisnis', icon: Settings },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
            POV Administrator • Kendali Bisnis Penuh
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-2">
            Pusat Kendali {config.brand?.name || 'Sajian Catering'}
          </h1>
          <p className="text-stone-600 text-sm mt-0.5">
            Kelola omzet, margin HPP, verifikasi DP, katalog paket, dan pengaturan operasional perusahaan.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToShowcase}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-emerald-700 text-stone-800 font-bold text-xs shadow-sm cursor-pointer"
        >
          <Store className="w-4 h-4 text-emerald-700" />
          <span>Lihat Showcase Publik</span>
        </button>
      </div>

      <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 shadow-sm overflow-hidden">
        <div className="no-print border-b border-stone-200 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'text-brand-dark bg-[#FAF8F5]'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && <AdminOverviewTab />}
          {activeTab === 'orders' && <AdminOrdersTab />}
          {activeTab === 'catalog' && <AdminCatalogTab />}
          {activeTab === 'kitchen' && <KitchenDashboardView />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </div>
      </div>
    </main>
  );
}
