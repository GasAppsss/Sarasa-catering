import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Footer } from './components/layout/Footer.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { FloatingWhatsAppButton } from './components/shared/FloatingWhatsAppButton.jsx';
import { OrderTrackerModal } from './components/shared/OrderTrackerModal.jsx';
import { PackageDetailDrawer } from './components/shared/PackageDetailDrawer.jsx';
import { ROLES, SCOPES } from './config/rbac.js';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { AdminDashboardView } from './features/admin/AdminDashboardView.jsx';
import { StaffAuthPage } from './features/auth/StaffAuthPage.jsx';
import { BookingCalculator } from './features/client/BookingCalculator.jsx';
import { CapacityCalendar } from './features/client/CapacityCalendar.jsx';
import { ClientPortalView } from './features/client/ClientPortalView.jsx';
import { HeroShowcase } from './features/client/HeroShowcase.jsx';
import { InfoAndFaqSection } from './features/client/InfoAndFaqSection.jsx';
import { PackageCatalogSection } from './features/client/PackageCatalogSection.jsx';
import { DeveloperConsoleView } from './features/developer/DeveloperConsoleView.jsx';
import { KitchenDashboardView } from './features/kitchen/KitchenDashboardView.jsx';
import { getDateOffset } from './utils/format.js';

function AppShell() {
  const {
    activeRole,
    activeView,
    navigateView,
    hasScope,
    packages,
    calendarDates,
    toastMessage,
  } = useApp();

  const activePackages = packages.filter((p) => p.isActive !== false);
  const firstAvailableDate =
    calendarDates.find((d) => d.status !== 'Penuh')?.dateStr || getDateOffset(3);

  const [showcaseIdx, setShowcaseIdx] = useState(0);
  const [selectedPkgId, setSelectedPkgId] = useState(activePackages[0]?.id || 'pkg-1');
  const [pax, setPax] = useState(activePackages[0]?.minOrder || 50);
  const [eventDate, setEventDate] = useState(firstAvailableDate);
  const [formError, setFormError] = useState('');

  const [drawerPkg, setDrawerPkg] = useState(null);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [portalOrder, setPortalOrder] = useState(null);
  const [authPortalPreset, setAuthPortalPreset] = useState({
    initialRole: ROLES.ADMIN,
    initialMode: 'login',
  });

  const openStaffAuthPage = (initialRole = ROLES.ADMIN, initialMode = 'login') => {
    setAuthPortalPreset({ initialRole, initialMode });
    navigateView('staff-login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get('login');
    if (params.get('dev') === '1' || loginParam === 'developer') {
      setAuthPortalPreset({ initialRole: ROLES.DEVELOPER, initialMode: 'login' });
      navigateView('staff-login');
    } else if (loginParam === 'forgot') {
      setAuthPortalPreset({ initialRole: ROLES.ADMIN, initialMode: 'forgot' });
      navigateView('staff-login');
    } else if (loginParam === 'admin') {
      setAuthPortalPreset({ initialRole: ROLES.ADMIN, initialMode: 'login' });
      navigateView('staff-login');
    } else if (params.get('portal') === 'staff' || loginParam === 'kitchen') {
      setAuthPortalPreset({ initialRole: ROLES.KITCHEN, initialMode: 'login' });
      navigateView('staff-login');
    }

    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setAuthPortalPreset({ initialRole: ROLES.DEVELOPER, initialMode: 'login' });
        navigateView('staff-login');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigateView]);

  const handleSelectShowcaseIndex = (newIdx) => {
    const total = activePackages.length || 1;
    const normalized = ((newIdx % total) + total) % total;
    setShowcaseIdx(normalized);
    const target = activePackages[normalized];
    if (target) {
      setSelectedPkgId(target.id);
      setPax((prev) => (prev < target.minOrder ? target.minOrder : prev));
    }
  };

  const handleSelectPackageForBooking = (pkg) => {
    if (pkg) {
      const idx = activePackages.findIndex((p) => p.id === pkg.id);
      if (idx !== -1) setShowcaseIdx(idx);
      setSelectedPkgId(pkg.id);
      setPax((prev) => (prev < (pkg.minOrder || 25) ? pkg.minOrder || 25 : prev));
    }
    navigateView('showcase');
    setTimeout(() => {
      document.getElementById('booking-calculator-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const openPortalWithOrder = (order) => {
    if (order) setPortalOrder(order);
    navigateView('client-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderMainView = () => {
    if (activeView === 'developer' && hasScope(SCOPES.DEV_THEME_TOKENS_EDIT)) {
      return <DeveloperConsoleView onBackToSite={() => navigateView('showcase')} />;
    }
    if (activeView === 'admin' && hasScope(SCOPES.ADMIN_ANALYTICS_VIEW)) {
      return <AdminDashboardView onSwitchToShowcase={() => navigateView('showcase')} />;
    }
    if (activeView === 'kitchen' && hasScope(SCOPES.KITCHEN_SHEET_VIEW)) {
      return <KitchenDashboardView onBackToSite={() => navigateView('showcase')} />;
    }
    if (activeView === 'client-portal') {
      return (
        <ClientPortalView
          preloadedOrder={portalOrder}
          onBackToShowcase={() => navigateView('showcase')}
          onReorderPackage={handleSelectPackageForBooking}
        />
      );
    }

    return (
      <main className="pb-16 min-w-0 w-full">
        <HeroShowcase
          activeIndex={showcaseIdx}
          onSelectIndex={handleSelectShowcaseIndex}
          onSelectPackageForBooking={handleSelectPackageForBooking}
          onOpenTracker={() => setTrackerOpen(true)}
          onOpenClientPortal={() => openPortalWithOrder(null)}
        />
        <PackageCatalogSection
          onSelectPackageForBooking={handleSelectPackageForBooking}
          onOpenDetailDrawer={(pkg) => setDrawerPkg(pkg)}
        />
        <CapacityCalendar
          selectedDate={eventDate}
          onSelectDate={setEventDate}
          onErrorMessage={setFormError}
        />
        <BookingCalculator
          selectedPkgId={selectedPkgId}
          onChangePkgId={setSelectedPkgId}
          pax={pax}
          onChangePax={setPax}
          eventDate={eventDate}
          onChangeEventDate={setEventDate}
          formError={formError}
          onChangeFormError={setFormError}
          onOrderCreated={(ord) => setPortalOrder(ord)}
          onOpenClientPortal={openPortalWithOrder}
        />
        <InfoAndFaqSection />
      </main>
    );
  };

  if (activeView === 'staff-login') {
    return (
      <div className="min-h-screen overflow-x-clip bg-[#FAF8F5] text-stone-800 font-sans selection:bg-amber-200 selection:text-emerald-950">
        <StaffAuthPage
          initialRole={authPortalPreset.initialRole}
          initialMode={authPortalPreset.initialMode}
          onBackToSite={() => navigateView('showcase')}
        />
        {toastMessage && (
          <div
            role="status"
            className="no-print fixed bottom-6 right-6 z-50 max-w-sm bg-brand-dark text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-amber-400/60 flex items-center gap-3 animate-slide-in-right"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-bg text-stone-800 font-sans selection:bg-amber-200 selection:text-emerald-950 flex flex-col justify-between">
      <div className="min-w-0 w-full">
        <Navbar
          onOpenTeamAuth={(role = activeRole === ROLES.DEVELOPER ? ROLES.DEVELOPER : ROLES.ADMIN) =>
            openStaffAuthPage(role, 'login')
          }
        />
        {renderMainView()}
      </div>

      <Footer
        onOpenTeamAuth={(role = ROLES.ADMIN) => openStaffAuthPage(role, 'login')}
      />

      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-6 right-6 z-50 max-w-sm bg-brand-dark text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-amber-400/60 flex items-center gap-3 animate-slide-in-right"
        >
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      <PackageDetailDrawer
        pkg={drawerPkg}
        onClose={() => setDrawerPkg(null)}
        onSelectPackage={handleSelectPackageForBooking}
      />

      <OrderTrackerModal
        isOpen={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        onOpenClientPortal={openPortalWithOrder}
      />

      {(activeView === 'showcase' || activeView === 'client-portal') && <FloatingWhatsAppButton />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
