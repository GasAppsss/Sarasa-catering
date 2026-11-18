import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Footer } from './components/layout/Footer.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { TeamAuthModal } from './components/layout/TeamAuthModal.jsx';
import { OrderTrackerModal } from './components/shared/OrderTrackerModal.jsx';
import { ROLES, SCOPES } from './config/rbac.js';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { AdminDashboardView } from './features/admin/AdminDashboardView.jsx';
import { BookingCalculator } from './features/client/BookingCalculator.jsx';
import { CapacityCalendar } from './features/client/CapacityCalendar.jsx';
import { ClientPortalView } from './features/client/ClientPortalView.jsx';
import { CompanyInfoSection } from './features/client/CompanyInfoSection.jsx';
import { FaqAndTermsSection } from './features/client/FaqAndTermsSection.jsx';
import { HeroShowcase } from './features/client/HeroShowcase.jsx';
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

  const [trackerOpen, setTrackerOpen] = useState(false);
  const [portalOrder, setPortalOrder] = useState(null);
  const [authModalState, setAuthModalState] = useState({
    open: false,
    initialRole: ROLES.KITCHEN,
    showDev: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      setAuthModalState({ open: true, initialRole: ROLES.DEVELOPER, showDev: true });
    } else if (params.get('portal') === 'staff') {
      setAuthModalState({ open: true, initialRole: ROLES.KITCHEN, showDev: false });
    }

    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setAuthModalState({ open: true, initialRole: ROLES.DEVELOPER, showDev: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
      return <DeveloperConsoleView />;
    }
    if (activeView === 'admin' && hasScope(SCOPES.ADMIN_ANALYTICS_VIEW)) {
      return <AdminDashboardView onSwitchToShowcase={() => navigateView('showcase')} />;
    }
    if (activeView === 'kitchen' && hasScope(SCOPES.KITCHEN_SHEET_VIEW)) {
      return <KitchenDashboardView />;
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
      <main className="pb-12">
        <HeroShowcase
          activeIndex={showcaseIdx}
          onSelectIndex={handleSelectShowcaseIndex}
          onSelectPackageForBooking={handleSelectPackageForBooking}
          onOpenTracker={() => setTrackerOpen(true)}
          onOpenClientPortal={() => openPortalWithOrder(null)}
        />
        <CompanyInfoSection />
        <PackageCatalogSection onSelectPackageForBooking={handleSelectPackageForBooking} />
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
        <FaqAndTermsSection />
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg text-stone-800 font-sans selection:bg-amber-200 selection:text-emerald-950 flex flex-col justify-between">
      <div>
        <Navbar
          onOpenTeamAuth={() =>
            setAuthModalState({
              open: true,
              initialRole: activeRole === ROLES.DEVELOPER ? ROLES.DEVELOPER : ROLES.KITCHEN,
              showDev: activeRole === ROLES.DEVELOPER,
            })
          }
        />
        {renderMainView()}
      </div>

      <Footer
        onOpenTeamAuth={() =>
          setAuthModalState({ open: true, initialRole: ROLES.KITCHEN, showDev: false })
        }
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

      <OrderTrackerModal
        isOpen={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        onOpenClientPortal={openPortalWithOrder}
      />

      <TeamAuthModal
        isOpen={authModalState.open}
        onClose={() => setAuthModalState((p) => ({ ...p, open: false }))}
        initialRole={authModalState.initialRole}
        showDeveloperOption={authModalState.showDev}
      />
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
