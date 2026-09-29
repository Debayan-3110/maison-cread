import React, { useState } from 'react';
import { ShopProvider } from './context/ShopContext.tsx';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import AuthModal from './components/AuthModal';
import SecuritySettingsModal from './components/SecuritySettingsModal';
import DevMailboxModal from './components/DevMailboxModal';
import Toast from './components/Toast';
import Footer from './components/Footer';
import InventoryManager from './pages/admin/Inventory';
import AdminDashboard from './pages/admin/Dashboard';
import ChatbotWidget from './components/ChatbotWidget';

function AppContent() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminTab, setAdminTab] = useState('inventory');

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-grow">
        {isAdminView ? (
          <div className="flex flex-col h-full">
            {/* Atelier Sub-navigation */}
            <div className="border-b border-hairline bg-panel/80 backdrop-blur">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 py-3">
                <span className="eyebrow mr-4 hidden sm:inline">Atelier Console</span>
                <button
                  onClick={() => setAdminTab('inventory')}
                  className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    adminTab === 'inventory' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    adminTab === 'dashboard' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'
                  }`}
                >
                  Intelligence
                </button>
              </div>
            </div>
            {adminTab === 'inventory' ? <InventoryManager /> : <AdminDashboard />}
          </div>
        ) : (
          <>
            <Hero />
            <ProductGrid />
          </>
        )}
      </main>
      <Footer />

      {/* Atelier Toggle */}
      <button
        onClick={() => setIsAdminView(!isAdminView)}
        className="fixed bottom-5 left-5 px-4 py-2 bg-solid text-on-solid/90 text-[11px] font-semibold tracking-[0.14em] uppercase rounded-full shadow-scrim hover:opacity-90 transition-colors z-50"
      >
        {isAdminView ? '← Boutique' : 'Atelier'}
      </button>

      {/* Global Overlays, Drawers & Modals */}
      <ProductModal />
      <CartDrawer />
      <WishlistDrawer />
      <CheckoutModal />
      <OrderHistoryModal />
      <AuthModal />
      <SecuritySettingsModal />
      <DevMailboxModal />
      <Toast />
      <ChatbotWidget />
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
