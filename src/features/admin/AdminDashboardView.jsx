import React, { useState } from 'react';
import {
  ChefHat,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell.jsx';
import { AccountSecurityPanel } from '../../components/shared/AccountSecurityPanel.jsx';
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
    { id: 'security', label: 'Keamanan & Akun', icon: ShieldCheck },
  ];

  return (
    <DashboardShell
      roleLabel="POV Administrator"
      title={`Pusat Kendali ${config.brand?.name || 'Sajian Catering'}`}
      subtitle="Kelola omzet, margin HPP, verifikasi DP, katalog paket, dan pengaturan operasional perusahaan."
      navItems={TABS}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onBackToSite={onSwitchToShowcase}
    >
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-sm">
        {activeTab === 'overview' && <AdminOverviewTab />}
        {activeTab === 'orders' && <AdminOrdersTab />}
        {activeTab === 'catalog' && <AdminCatalogTab />}
        {activeTab === 'kitchen' && <KitchenDashboardView embedded />}
        {activeTab === 'settings' && <AdminSettingsTab />}
        {activeTab === 'security' && <AccountSecurityPanel />}
      </div>
    </DashboardShell>
  );
}
