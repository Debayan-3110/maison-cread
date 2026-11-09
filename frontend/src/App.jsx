import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FreshHarvestSection from './components/FreshHarvestSection';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import AuthModal from './components/AuthModal';
import SecuritySettingsModal from './components/SecuritySettingsModal';
import DevMailboxModal from './components/DevMailboxModal';
import SellerStudioModal from './components/SellerStudioModal';
import NeonServiceHub from './components/NeonServiceHub';
import Toast from './components/Toast';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import CookieConsentBanner from './components/CookieConsentBanner';
import LegalSuite from './pages/LegalSuite';
import AdminConsole from './pages/admin/AdminConsole';
import NotFoundPage from './pages/NotFoundPage';
import AuthCallback from './pages/AuthCallback';
import ShipmentTrackingPortal from './pages/ShipmentTrackingPortal';
import DonationPortal from './pages/DonationPortal';
import DonationPopupModal from './components/DonationPopupModal';
import AgeGateModal from './components/AgeGateModal';

function AppContent() {
  const { isNeonHubOpen, setIsNeonHubOpen, isLegalOpen, closeLegalPolicy, currentLegalPolicy } = useShop();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname.toLowerCase());

  // Listen to browser navigation / history events
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };

    window.addEventListener('popstate', handleLocationChange);

    // Sovereign Admin Hotkey (Ctrl+Shift+A / Cmd+Shift+A) for authorized personnel
    const handleAdminKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        const target = window.location.pathname.startsWith('/console') || window.location.pathname.startsWith('/admin') ? '/' : '/console';
        window.history.pushState({}, '', target);
        setCurrentPath(target);
      }
    };

    window.addEventListener('keydown', handleAdminKey);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('keydown', handleAdminKey);
    };
  }, []);

  // Determine Routing Destination
  const isDedicatedAdminHost =
    window.location.hostname.toLowerCase().startsWith('admin.') ||
    window.location.hostname.toLowerCase().startsWith('console.') ||
    currentPath.startsWith('/console') ||
    currentPath.startsWith('/admin');

  const isKnownPublicPath =
    currentPath === '/' ||
    currentPath === '' ||
    currentPath.startsWith('/track') ||
    currentPath.startsWith('/tracking') ||
    currentPath.startsWith('/shipment') ||
    currentPath.startsWith('/donate') ||
    currentPath.startsWith('/donations') ||
    currentPath.startsWith('/auth/callback') ||
    currentPath.startsWith('/legal') ||
    currentPath.startsWith('/privacy') ||
    currentPath.startsWith('/terms') ||
    currentPath.startsWith('/cookies') ||
    currentPath.startsWith('/returns');

  // =========================================================================
  // 1. ISOLATED ADMINISTRATIVE / ANALYTICS CONSOLE (DEDICATED SECURE AIRGAP)
  // =========================================================================
  if (isDedicatedAdminHost) {
    return <AdminConsole />;
  }

  // =========================================================================
  // 1B. NEON AUTH OAUTH BACKLINK CALLBACK INTERSTITIAL
  // =========================================================================
  if (currentPath.startsWith('/auth/callback')) {
    return <AuthCallback />;
  }

  // =========================================================================
  // 1C. SHIPMENT TRACKING WEBSITE & NEON LOGISTICS PORTAL
  // =========================================================================
  if (currentPath.startsWith('/track') || currentPath.startsWith('/tracking') || currentPath.startsWith('/shipment')) {
    return <ShipmentTrackingPortal />;
  }

  // =========================================================================
  // 1D. DEDICATED DONATION WEBSITE & PHILANTHROPIC SANCTUARY
  // =========================================================================
  if (currentPath.startsWith('/donate') || currentPath.startsWith('/donations')) {
    return <DonationPortal />;
  }

  // =========================================================================
  // 2. CUSTOM 404 PAGE NOT FOUND (COORDINATE MISMATCH)
  // =========================================================================
  if (!isKnownPublicPath) {
    return (
      <NotFoundPage
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  // =========================================================================
  // 3. PUBLIC BOUTIQUE STOREFRONT (CLEAN, NO CUSTOMER-VISIBLE ADMIN BUTTON)
  // =========================================================================
  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FreshHarvestSection />
        <ProductGrid />
      </main>
      <Footer />

      {/* Global Overlays, Drawers & Modals */}
      <ProductModal />
      <CartDrawer />
      <WishlistDrawer />
      <CheckoutModal />
      <OrderHistoryModal />
      <OrderTrackerModal />
      <AuthModal />
      <SecuritySettingsModal />
      <DevMailboxModal />
      <SellerStudioModal />
      <NeonServiceHub isOpen={isNeonHubOpen} onClose={() => setIsNeonHubOpen(false)} />
      <Toast />
      <ChatbotWidget />
      <DonationPopupModal />
      <AgeGateModal />

      {/* Statutory Legal Suite Modal (DPDP Act 2023, GDPR, Consumer Protection Rules) */}
      {isLegalOpen && (
        <LegalSuite
          isModal={true}
          initialPolicy={currentLegalPolicy}
          onClose={closeLegalPolicy}
        />
      )}

      {/* DPDP Act 2023 & GDPR Statutory Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
