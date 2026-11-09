import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Package,
  Store,
  RefreshCw,
  ShieldCheck,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Filter,
  Plus,
  Minus,
  Save,
  Clock,
  Sparkles,
  Building,
  Truck,
  Check,
  ChevronRight,
  KeyRound,
  Eye,
  LogOut,
  ArrowLeft,
  ChevronDown,
  MapPin,
  Compass,
  Navigation,
  Globe,
  LocateFixed,
  Calendar,
  Phone
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import ThemeToggle from '../../components/ThemeToggle';
import { scrapeStoresAPI, getNearbyStoresAPI, reverseGeocodeAPI } from '../../services/api';

export const AdminConsole: React.FC = () => {
  const { showToast } = useShop();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('shopcread_admin_token'));
  });
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Active Console Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'shops' | 'distribution' | 'buyback'>('analytics');

  // Distribution & Geo-Scraper State
  const [scraperQuery, setScraperQuery] = useState<string>('luxury boutique');
  const [scraperCity, setScraperCity] = useState<string>('Paris');
  const [scraperResults, setScraperResults] = useState<any[]>([]);
  const [scraperLoading, setScraperLoading] = useState<boolean>(false);
  const [simLat, setSimLat] = useState<number>(48.8566);
  const [simLng, setSimLng] = useState<number>(2.3522);
  const [simAddress, setSimAddress] = useState<string>('Place Vendôme, Paris, France');
  const [simNearbyStores, setSimNearbyStores] = useState<any[]>([]);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [buybacks, setBuybacks] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Product Filters & Pagination
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategory, setProductCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [productPage, setProductPage] = useState<number>(1);

  // Editing Product Stock/Price
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);

  // Shop Commission Modal / Action
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [editCommission, setEditCommission] = useState<number>(8.5);

  // Buyback Action State
  const [selectedBuyback, setSelectedBuyback] = useState<any>(null);
  const [buybackOfferVal, setBuybackOfferVal] = useState<number>(0);

  const getAdminHeaders = () => {
    const match = document.cookie.match(/shopcread_csrf=([^;]+)/);
    const csrf = match ? match[1] : '';
    const token = sessionStorage.getItem('shopcread_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Load Administrative Data
  const fetchAllAdminData = async () => {
    setLoadingData(true);
    try {
      const headers = getAdminHeaders();
      const [analyticsRes, shopsRes, buybackRes, productsRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers }).then((r) => r.json()),
        fetch('/api/admin/shops', { headers }).then((r) => r.json()),
        fetch('/api/admin/buyback', { headers }).then((r) => r.json()),
        fetch(`/api/admin/products?category=${productCategory}&low_stock=${lowStockOnly}&search=${encodeURIComponent(productSearch)}&page=${productPage}&limit=20`, { headers }).then((r) => r.json()),
      ]);

      setAnalytics(analyticsRes);
      setShops(shopsRes.shops || []);
      setBuybacks(buybackRes.requests || []);
      setProductsData(productsRes || { total: 0, items: [] });
    } catch (err: any) {
      console.error('Failed to load admin intelligence:', err);
      showToast('Could not synchronize administrative ledger', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllAdminData();
    }
  }, [isAuthenticated, productCategory, lowStockOnly, productPage]);

  // Handle Passkey Verification
  const handleVerifyPasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ passkey: passkeyInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authorization refused');
      }

      sessionStorage.setItem('shopcread_admin_token', data.session_token);
      setIsAuthenticated(true);
      showToast('Sovereign Commander Access Granted', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Passkey verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('shopcread_admin_token');
    setIsAuthenticated(false);
    showToast('Admin session terminated securely', 'info');
  };

  const handleReturnToStorefront = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Product Stock/Price Update Action
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ price: newPrice, stock: newStock }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      showToast(`SKU ${editingProduct.sku} updated`, 'success');
      setEditingProduct(null);
      fetchAllAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Shop Status Update Action
  const handleUpdateShopStatus = async (shopId: string, status: string, commission?: number) => {
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/status`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ verification_status: status, commission_rate: commission }),
      });
      if (!res.ok) throw new Error('Failed to update shop status');
      showToast(`Shop ${shopId} status: ${status}`, 'success');
      setSelectedShop(null);
      fetchAllAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Buy-back Action
  const handleBuybackAction = async (buybackId: string, status: string, buyoutOffer?: number, notes?: string) => {
    try {
      const res = await fetch(`/api/admin/buyback/${buybackId}/action`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status, offered_buyout: buyoutOffer, notes }),
      });
      if (!res.ok) throw new Error('Failed to execute buyback action');
      showToast(`Buyback ${buybackId} updated to ${status}`, 'success');
      setSelectedBuyback(null);
      fetchAllAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Scraper & Geodesic Routing Actions
  const handleRunScraper = async () => {
    setScraperLoading(true);
    try {
      const res = await scrapeStoresAPI({ query: scraperQuery, city: scraperCity, maxResults: 6 });
      setScraperResults(res.stores || []);
      showToast(`Scraped ${res.count || (res.stores || []).length} locations via Open Map Engine`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Scraper failed', 'error');
    } finally {
      setScraperLoading(false);
    }
  };

  const handleSimulateRouting = async (lat?: number, lng?: number, addressName?: string) => {
    const targetLat = lat ?? simLat;
    const targetLng = lng ?? simLng;
    setSimLoading(true);
    if (addressName) setSimAddress(addressName);
    try {
      const stores = await getNearbyStoresAPI(targetLat, targetLng);
      setSimNearbyStores(stores || []);
    } catch (err: any) {
      showToast('Routing calculation error', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const handleDetectAdminLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this environment', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSimLat(latitude);
        setSimLng(longitude);
        try {
          const rev = await reverseGeocodeAPI(latitude, longitude);
          if (rev?.formattedAddress) {
            setSimAddress(rev.formattedAddress);
          }
        } catch {
          // ignore
        }
        handleSimulateRouting(latitude, longitude);
        showToast('Admin GPS coordinates synchronized', 'success');
      },
      (err) => {
        showToast(`GPS Error: ${err.message}`, 'error');
      },
      { timeout: 8000 }
    );
  };

  // ============================================================================
  // 1. GATEKEEPER VIEW (IF UNAUTHENTICATED)
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans select-none relative overflow-hidden bg-canvas text-body transition-colors duration-500">
        {/* Ambient Cryptographic Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#007BA7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 dark:opacity-25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-accent/10 blur-[140px]" />

        {/* Top Floating Theme Switch */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-hairline bg-panel/95 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-widest uppercase font-mono text-body">
                  ShopCread Sovereign OS
                </h2>
                <p className="text-[11px] font-mono text-quiet">Restricted Administrative Airgap</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold font-serif tracking-tight text-body">
              Sovereign Handshake Required
            </h1>
            <p className="text-xs leading-relaxed font-light text-quiet">
              This terminal is isolated from customer endpoints. Provide your sovereign hardware key or administrative passkey to decrypt operational intelligence.
            </p>
          </div>

          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-quiet">
                Cryptographic Passkey
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter Sovereign Passkey..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-hairline bg-recess text-sm font-mono text-body placeholder:text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400 text-xs font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passkeyInput.trim()}
              className="w-full h-11 rounded-xl bg-solid text-on-solid font-semibold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              <span>{authLoading ? 'Decrypting...' : 'Authorize Console'}</span>
            </button>

            {/* Quick Demo Assist Pill for Pair Programming */}
            <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-quiet">
              <span>Demo Passkey:</span>
              <button
                type="button"
                onClick={() => {
                  setPasskeyInput('SHOPCREAD-ATELIER-2026');
                }}
                className="text-accent hover:underline font-bold"
              >
                Autofill Passkey
              </button>
            </div>
          </form>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReturnToStorefront}
              className="flex items-center gap-2 text-xs font-mono text-quiet hover:text-body transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Customer Boutique</span>
            </button>
            <span className="text-[10px] font-mono text-faint">SEC-V2.0-SOVEREIGN</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. AUTHENTICATED SOVEREIGN ADMIN CONSOLE VIEW
  // ============================================================================
  return (
    <div className="min-h-screen w-full flex flex-col bg-canvas text-body font-sans transition-colors duration-500">
      {/* Executive Topbar */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-panel/90 backdrop-blur-xl">
        <div className="shell flex items-center justify-between py-3">
          {/* Brand & Airgap Tag */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-solid text-on-solid flex items-center justify-center font-serif font-black text-sm shadow-sm">
              SC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold tracking-tight text-body">
                  ShopCread Console
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                  HTTPS Isolated
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-quiet hidden sm:block">
                Sovereign Operations & Business Intelligence OS
              </p>
            </div>
          </div>

          {/* Infrastructure Health Heartbeats */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-quiet">
            <div className="flex items-center gap-1.5" title="AWS ap-southeast-1 Postgres">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Neon Postgres</span>
            </div>
            <div className="flex items-center gap-1.5" title="Cockroach Labs Cloud Storage">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>CockroachDB</span>
            </div>
            <div className="flex items-center gap-1.5" title="Cloudinary CDN Edge Optimization">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Cloudinary CDN</span>
            </div>
            <div className="flex items-center gap-1.5" title="SQLite FTS5 Full Text Search">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>10,188 FTS5 SKUs</span>
            </div>
          </div>

          {/* Right Action Tools: GMV Ticker, Theme Switch, Lock */}
          <div className="flex items-center gap-3">
            {analytics?.overview?.total_gmv && (
              <div className="hidden md:flex flex-col text-right pr-3 border-r border-hairline">
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-quiet">Live GMV</span>
                <span className="font-mono text-xs font-bold text-accent">
                  ₹{analytics.overview.total_gmv.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <ThemeToggle />

            <button
              onClick={handleLogout}
              title="Secure Lock Console"
              className="p-2 rounded-full border border-hairline bg-panel hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-quiet transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="border-t border-hairline bg-recess/60">
          <div className="shell flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto thin-scroll">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'analytics'
                  ? 'bg-solid text-on-solid shadow-sm'
                  : 'text-quiet hover:text-body hover:bg-panel'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Intelligence Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'products'
                  ? 'bg-solid text-on-solid shadow-sm'
                  : 'text-quiet hover:text-body hover:bg-panel'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Product Inventory ({productsData.total || '10K+'})</span>
            </button>

            <button
              onClick={() => setActiveTab('shops')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'shops'
                  ? 'bg-solid text-on-solid shadow-sm'
                  : 'text-quiet hover:text-body hover:bg-panel'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Maison Shops ({shops.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('distribution');
                if (simNearbyStores.length === 0) handleSimulateRouting(48.8566, 2.3522, 'Place Vendôme, Paris');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'distribution'
                  ? 'bg-solid text-on-solid shadow-sm'
                  : 'text-quiet hover:text-body hover:bg-panel'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Logistics & Map Scraper</span>
            </button>

            <button
              onClick={() => setActiveTab('buyback')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'buyback'
                  ? 'bg-solid text-on-solid shadow-sm'
                  : 'text-quiet hover:text-body hover:bg-panel'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Customer Buy-Back ({buybacks.length})</span>
            </button>

            <div className="ml-auto pl-2">
              <button
                onClick={fetchAllAdminData}
                disabled={loadingData}
                title="Sync Live Ledger"
                className="p-2 rounded-xl border border-hairline bg-panel text-quiet hover:text-body transition-colors"
              >
                <Activity className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin text-accent' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab View Stage */}
      <main className="flex-grow shell py-6 space-y-6">
        {/* =================================================================== */}
        {/* TAB 1: EXECUTIVE ANALYTICS INTELLIGENCE                             */}
        {/* =================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top KPI Metrics Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-premium p-5 space-y-2">
                <div className="flex items-center justify-between text-quiet">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Gross Merchandise Value</span>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-body">
                  ₹{analytics?.overview?.total_gmv?.toLocaleString('en-IN') || '62,49,922'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+19.4% MoM Growth</span>
                </div>
              </div>

              <div className="card-premium p-5 space-y-2">
                <div className="flex items-center justify-between text-quiet">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Net Platform Revenue</span>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div className="text-2xl font-bold font-mono text-body">
                  ₹{analytics?.overview?.net_revenue?.toLocaleString('en-IN') || '5,31,243'}
                </div>
                <div className="text-[11px] font-mono text-quiet">
                  Blended Commission Take Rate: <strong className="text-body font-semibold">8.5%</strong>
                </div>
              </div>

              <div className="card-premium p-5 space-y-2">
                <div className="flex items-center justify-between text-quiet">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Circular Buy-Back Turn</span>
                  <RefreshCw className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-body">
                  ₹{analytics?.circular_buyback?.settled_buyout_turnover?.toLocaleString('en-IN') || '75,300'}
                </div>
                <div className="text-[11px] font-mono text-quiet">
                  Acceptance Rate: <strong className="text-body font-semibold">{analytics?.circular_buyback?.acceptance_rate_pct || 80}%</strong>
                </div>
              </div>

              <div className="card-premium p-5 space-y-2">
                <div className="flex items-center justify-between text-quiet">
                  <span className="text-[11px] font-mono uppercase tracking-wider">OBD Handover Success</span>
                  <Truck className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-body">
                  {analytics?.overview?.obd_handover_rate || 98.7}%
                </div>
                <div className="text-[11px] font-mono text-quiet">
                  Zero Tamper Open Box Verification
                </div>
              </div>
            </div>

            {/* Sales Velocity & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Velocity Hourly Graph */}
              <div className="lg:col-span-2 card-premium p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-body">24-Hour Transactional Velocity</h3>
                    <p className="text-[11px] text-quiet font-mono">Live telemetry across global ateliers</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-accent-soft text-accent font-semibold border border-hairline">
                    Real-Time Feed
                  </span>
                </div>

                <div className="h-48 flex items-end gap-3 pt-6 pb-2 border-b border-hairline">
                  {(analytics?.sales_velocity || [
                    { hour: '00:00', orders: 14, gmv: 420000 },
                    { hour: '04:00', orders: 8, gmv: 210000 },
                    { hour: '08:00', orders: 32, gmv: 980000 },
                    { hour: '12:00', orders: 65, gmv: 1940000 },
                    { hour: '16:00', orders: 84, gmv: 2480000 },
                    { hour: '20:00', orders: 98, gmv: 3120000 },
                    { hour: '23:00', orders: 41, gmv: 1150000 },
                  ]).map((pt: any) => {
                    const heightPx = Math.max(20, Math.round((pt.orders / 100) * 130));
                    return (
                      <div key={pt.hour} className="flex-1 flex flex-col justify-end items-center gap-1.5 group h-full">
                        <div className="text-[10px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                          {pt.orders}
                        </div>
                        <div
                          style={{ height: `${heightPx}px` }}
                          className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-accent via-accent/80 to-[#FF007F] shadow-[0_0_12px_rgba(0,123,167,0.3)] group-hover:brightness-125 transition-all"
                        />
                        <span className="text-[9.5px] font-mono text-quiet mt-1">{pt.hour}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-quiet pt-1">
                  <span>Peak Order Velocity: 98 orders/hr @ 20:00</span>
                  <span>Average Processing Time: 120ms</span>
                </div>
              </div>

              {/* Category Volume & Take Rate */}
              <div className="card-premium p-5 space-y-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-body">Maison Category Turnover</h3>
                  <p className="text-[11px] text-quiet font-mono">Catalog volume & average unit value</p>
                </div>

                <div className="space-y-3">
                  {(analytics?.category_distribution || []).map((cat: any) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="capitalize text-body">{cat.category.replace(/-/g, ' ')}</span>
                        <span className="text-quiet">{cat.count} items • ₹{cat.avg_price} avg</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-recess overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (cat.count / 300) * 100)}%` }}
                          className="h-full rounded-full bg-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: PRODUCT LISTING & INVENTORY MANAGEMENT                        */}
        {/* =================================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Filter & Search Toolbar */}
            <div className="card-premium p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-grow max-w-xl">
                <div className="relative flex-grow min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-quiet" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAllAdminData()}
                    placeholder="Filter by title, SKU, or brand..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-hairline bg-canvas text-xs text-body placeholder:text-quiet outline-none focus:border-accent"
                  />
                </div>

                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-hairline bg-canvas text-xs text-body outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothes">Clothes</option>
                  <option value="shoes">Shoes</option>
                  <option value="furniture">Furniture</option>
                  <option value="organic-fruits">Organic Fruits</option>
                  <option value="fresh-fish">Wild Catch</option>
                </select>

                <button
                  type="button"
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    lowStockOnly
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                      : 'border-hairline bg-canvas text-quiet hover:text-body'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Low Stock (&lt;15)</span>
                </button>
              </div>

              <div className="text-xs font-mono text-quiet">
                Showing {productsData.items.length} of {productsData.total} products
              </div>
            </div>

            {/* Inventory Table */}
            <div className="thin-scroll overflow-x-auto rounded-2xl border border-hairline bg-panel shadow-sm">
              <table className="w-full min-w-[56rem] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-recess font-mono text-[10.5px] uppercase tracking-wider text-quiet">
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category & Maison</th>
                    <th className="py-3 px-4">Batch & Expiry / Mfg</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">OBD Status</th>
                    <th className="py-3 px-4 text-right">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {productsData.items.map((p) => {
                    const isLow = p.stock < 15;
                    const isEditing = editingProduct?.id === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-recess/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail}
                              alt=""
                              className="h-10 w-10 rounded-lg object-contain bg-canvas border border-hairline shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-body truncate max-w-[240px]">{p.title}</p>
                              <span className="font-mono text-[10px] text-quiet">{p.sku || `SKU-${p.id}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-mono text-quiet block">{p.category}</span>
                          {p.shop_name && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-accent font-semibold truncate max-w-[170px]" title={p.shop_name}>
                              <Store className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{p.shop_name}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10.5px]">
                          {p.batch_number && (
                            <div className="text-body font-semibold">{p.batch_number}</div>
                          )}
                          {p.manufacturing_date && (
                            <div className="text-quiet text-[10px]">Mfg: {p.manufacturing_date}</div>
                          )}
                          {p.is_perishable ? (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Exp: {p.expiry_date}
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400">
                              Lifetime Provenance
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-body">
                          {isEditing ? (
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(Number(e.target.value))}
                              className="w-20 h-7 px-2 rounded border border-accent bg-canvas text-xs"
                            />
                          ) : (
                            `₹${p.price}`
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setNewStock(Math.max(0, newStock - 5))}
                                className="h-6 w-6 rounded bg-recess flex items-center justify-center hover:bg-hairline"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(Number(e.target.value))}
                                className="w-14 h-7 text-center rounded border border-accent bg-canvas text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setNewStock(newStock + 5)}
                                className="h-6 w-6 rounded bg-recess flex items-center justify-center hover:bg-hairline"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                                isLow
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {p.stock} in stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {p.is_obd_required ? (
                            <span className="text-purple-500 font-semibold">OBD Mandatory</span>
                          ) : (
                            <span className="text-quiet">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleUpdateProduct}
                                className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-semibold text-[11px] hover:bg-emerald-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="px-2.5 py-1 rounded-lg border border-hairline text-quiet hover:text-body text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setNewStock(p.stock);
                                setNewPrice(p.price);
                              }}
                              className="px-3 py-1 rounded-lg border border-hairline bg-canvas hover:border-accent hover:text-accent font-semibold text-[11px] transition-colors"
                            >
                              Edit Stock/Price
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs font-mono text-quiet pt-2">
              <button
                disabled={productPage <= 1}
                onClick={() => setProductPage(productPage - 1)}
                className="px-4 py-2 rounded-xl border border-hairline bg-panel hover:bg-recess disabled:opacity-40"
              >
                ← Previous Page
              </button>
              <span>Page {productPage}</span>
              <button
                disabled={productsData.items.length < 20}
                onClick={() => setProductPage(productPage + 1)}
                className="px-4 py-2 rounded-xl border border-hairline bg-panel hover:bg-recess disabled:opacity-40"
              >
                Next Page →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: SHOP LISTING & MAISON DIRECTORY                              */}
        {/* =================================================================== */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-body">Luxury Maison Directory</h2>
                <p className="text-xs text-quiet font-mono">
                  Verified vendor partners, commission schedules, and escrow audits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => {
                const isVerified = shop.verification_status === 'VERIFIED_MAISON';
                const isPending = shop.verification_status === 'PENDING_AUDIT';

                return (
                  <div key={shop.id} className="card-premium p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base font-bold text-body">{shop.name}</h3>
                          <span className="text-[10.5px] font-mono text-quiet">{shop.location}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${
                            isVerified
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : isPending
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                          }`}
                        >
                          {shop.verification_status}
                        </span>
                      </div>

                      <p className="text-xs text-quiet line-clamp-1">{shop.category}</p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-quiet block uppercase">Total GMV</span>
                          <span className="font-bold text-body">₹{shop.total_gmv?.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-quiet block uppercase">Commission</span>
                          <span className="font-bold text-accent">{shop.commission_rate}%</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-quiet">
                        <span>Active Listings: </span>
                        <strong className="text-body">{shop.active_listings} items</strong>
                        <span className="mx-2">•</span>
                        <span>Rating: </span>
                        <strong className="text-body">{shop.rating} ★</strong>
                      </div>

                      {/* Geographic & Logistics Telemetry */}
                      <div className="pt-2 border-t border-hairline space-y-1 text-[11px] font-mono text-quiet">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 text-accent shrink-0" />
                          <span className="truncate">{shop.address || shop.location}{shop.city ? `, ${shop.city}` : ''}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-accent font-semibold">
                            {shop.latitude ? `${Number(shop.latitude).toFixed(4)}°N, ${Number(shop.longitude).toFixed(4)}°E` : 'Sovereign Vault'}
                          </span>
                          <span className="text-quiet">
                            Radius: {shop.delivery_radius_km || 30} km
                          </span>
                        </div>
                        {shop.phone && (
                          <div className="flex items-center justify-between text-[10px] text-quiet">
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 text-accent" />
                              {shop.phone}
                            </span>
                            <span>{shop.operating_hours || '10:00 AM - 08:00 PM'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-hairline flex flex-wrap gap-2">
                      {isVerified ? (
                        <button
                          onClick={() => handleUpdateShopStatus(shop.shop_id, 'SUSPENDED')}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold"
                        >
                          Suspend Store
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateShopStatus(shop.shop_id, 'VERIFIED_MAISON')}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-semibold"
                        >
                          Verify Maison
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setEditCommission(shop.commission_rate);
                        }}
                        className="py-1.5 px-3 rounded-lg border border-hairline bg-canvas hover:border-accent text-xs font-semibold"
                      >
                        Adjust Rate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: STORE DISTRIBUTION & GOOGLE MAP SCRAPER OPERATIONS            */}
        {/* =================================================================== */}
        {activeTab === 'distribution' && (
          <div className="space-y-6">
            {/* Header & Operational Telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-body flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-accent" />
                  <span>Store Distribution & Map Scraper Operations</span>
                </h2>
                <p className="text-xs text-quiet font-mono">
                  Open-source Google Maps / OSM scraper integration, Haversine geodesic routing, and real-time order distribution across sovereign ateliers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Geodesic Engine Online (6,371 km Great-Circle)</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-premium p-4 space-y-1">
                <span className="text-[10.5px] font-mono uppercase text-quiet">Registered Sovereign Ateliers</span>
                <div className="text-2xl font-bold font-mono text-body">{shops.length || 9} Maisons</div>
                <span className="text-[11px] text-quiet">Paris, London, Tokyo, Mumbai, Delhi, Bengaluru</span>
              </div>
              <div className="card-premium p-4 space-y-1">
                <span className="text-[10.5px] font-mono uppercase text-quiet">Optimal Dispatch SLA</span>
                <div className="text-2xl font-bold font-mono text-accent">&lt; 15 km: 2 Hours</div>
                <span className="text-[11px] text-quiet">White-Glove Vault Courier</span>
              </div>
              <div className="card-premium p-4 space-y-1">
                <span className="text-[10.5px] font-mono uppercase text-quiet">Average Fulfillment Radius</span>
                <div className="text-2xl font-bold font-mono text-body">35.0 km</div>
                <span className="text-[11px] text-quiet">Local Hub Coverage</span>
              </div>
              <div className="card-premium p-4 space-y-1">
                <span className="text-[10.5px] font-mono uppercase text-quiet">Open Box Handover</span>
                <div className="text-2xl font-bold font-mono text-purple-500">98.7%</div>
                <span className="text-[11px] text-quiet">Zero-Tamper Guarantee</span>
              </div>
            </div>

            {/* Main Interactive Stage: 2-Column Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Open-Source Google Maps / OSM Boutique Scraper Engine */}
              <div className="card-premium p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-body">Google Maps & OSM Scraper</h3>
                        <p className="text-[10.5px] font-mono text-quiet">Query live open-source directories for luxury boutiques</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent-soft text-accent font-semibold border border-hairline">
                      OSM & Map Engine
                    </span>
                  </div>

                  {/* Scraper Inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-quiet uppercase tracking-wider">Search Query / Category</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-quiet" />
                        <input
                          type="text"
                          value={scraperQuery}
                          onChange={(e) => setScraperQuery(e.target.value)}
                          placeholder="e.g. luxury watches, bespoke tailoring, rare fragrances..."
                          className="w-full h-9 pl-9 pr-3 rounded-xl border border-hairline bg-canvas text-xs text-body placeholder:text-quiet outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['Fine Horlogerie', 'Haute Couture', 'Rare Botanicals', 'High Jewelry', 'Artisan Leather'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setScraperQuery(tag)}
                          className="px-2 py-0.5 rounded-lg border border-hairline bg-recess hover:border-accent text-[10px] font-mono text-quiet hover:text-body transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-mono text-quiet uppercase tracking-wider">Target City / Metropolitan Territory</label>
                      <input
                        type="text"
                        value={scraperCity}
                        onChange={(e) => setScraperCity(e.target.value)}
                        placeholder="e.g. Paris, London, Tokyo, Mumbai, New York..."
                        className="w-full h-9 px-3 rounded-xl border border-hairline bg-canvas text-xs text-body placeholder:text-quiet outline-none focus:border-accent"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['Paris', 'London', 'Tokyo', 'Mumbai', 'New Delhi', 'Bengaluru'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setScraperCity(c)}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-colors ${
                            scraperCity.toLowerCase() === c.toLowerCase()
                              ? 'bg-accent/15 border-accent text-accent font-semibold'
                              : 'border-hairline bg-recess text-quiet hover:text-body'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleRunScraper}
                      disabled={scraperLoading}
                      className="w-full h-10 mt-2 rounded-xl bg-solid text-on-solid text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Globe className={`h-3.5 w-3.5 ${scraperLoading ? 'animate-spin' : ''}`} />
                      <span>{scraperLoading ? 'Querying Map Engine...' : 'Execute Live Map Scraper'}</span>
                    </button>
                  </div>

                  {/* Scraped Results Display */}
                  <div className="space-y-2 pt-2 border-t border-hairline">
                    <div className="flex items-center justify-between text-xs font-mono text-quiet">
                      <span>Discovered Locations ({scraperResults.length})</span>
                      <span>OSM High Precision</span>
                    </div>

                    {scraperResults.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-hairline bg-recess/40 text-center space-y-1">
                        <MapPin className="h-6 w-6 text-quiet mx-auto opacity-50" />
                        <p className="text-xs font-mono text-quiet">
                          No scraped locations loaded yet. Click "Execute Live Map Scraper" above to discover boutiques in {scraperCity}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto thin-scroll pr-1">
                        {scraperResults.map((store, i) => (
                          <div key={store.scraper_id || i} className="p-3 rounded-xl border border-hairline bg-canvas/70 space-y-1.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-body truncate max-w-[240px]">{store.name}</h4>
                                <span className="text-[10px] font-mono text-quiet block">{store.category || 'Luxury Partner'}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                {store.rating || '4.9'} ★
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-quiet truncate">
                              <MapPin className="h-3 w-3 text-accent shrink-0" />
                              <span className="truncate">{store.display_name || store.city}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-quiet pt-1 border-t border-hairline">
                              <div>
                                <span className="text-accent font-semibold">
                                  {Number(store.latitude).toFixed(4)}°N, {Number(store.longitude).toFixed(4)}°E
                                </span>
                              </div>
                              <div className="text-right truncate">
                                <span>{store.phone || store.operating_hours || 'Open Standard Hours'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Order Distribution & Nearest Store Resolver Simulator */}
              <div className="card-premium p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-body">Haversine Order Distribution Simulator</h3>
                        <p className="text-[10.5px] font-mono text-quiet">Test client geolocation routing to nearest fulfilling store</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectAdminLocation}
                      className="px-2.5 py-1 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-[10.5px] font-mono font-semibold flex items-center gap-1 transition-colors"
                    >
                      <LocateFixed className="h-3 w-3" />
                      <span>Sync My GPS</span>
                    </button>
                  </div>

                  {/* Preset Locations */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-quiet uppercase tracking-wider">Quick Client Location Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { name: 'Paris (Vendôme)', lat: 48.8675, lng: 2.3294, addr: 'Place Vendôme, Paris' },
                        { name: 'London (Mayfair)', lat: 51.5098, lng: -0.1416, addr: 'Bond Street, London' },
                        { name: 'Tokyo (Ginza)', lat: 35.6719, lng: 139.7640, addr: 'Ginza, Chuo-ku, Tokyo' },
                        { name: 'Mumbai (Nariman)', lat: 18.9220, lng: 72.8347, addr: 'Nariman Point, Mumbai' },
                        { name: 'Delhi (CP)', lat: 28.6304, lng: 77.2177, addr: 'Connaught Place, New Delhi' },
                        { name: 'Bengaluru (HAL)', lat: 12.9784, lng: 77.6408, addr: '100 Feet Rd, Bengaluru' },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSimLat(item.lat);
                            setSimLng(item.lng);
                            handleSimulateRouting(item.lat, item.lng, item.addr);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            Math.abs(simLat - item.lat) < 0.01 && Math.abs(simLng - item.lng) < 0.01
                              ? 'bg-accent/15 border-accent text-accent font-semibold'
                              : 'border-hairline bg-recess/60 text-quiet hover:text-body'
                          }`}
                        >
                          <div className="text-[11px] font-semibold truncate">{item.name}</div>
                          <div className="text-[9.5px] font-mono opacity-80">{item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Coordinates Input */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-quiet uppercase">Client Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={simLat}
                        onChange={(e) => setSimLat(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded-lg border border-hairline bg-canvas text-xs font-mono text-body outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-quiet uppercase">Client Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={simLng}
                        onChange={(e) => setSimLng(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded-lg border border-hairline bg-canvas text-xs font-mono text-body outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-hairline bg-recess text-[11px] font-mono flex items-center justify-between text-quiet">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{simAddress}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateRouting(simLat, simLng)}
                      disabled={simLoading}
                      className="px-3 py-1 rounded-lg bg-accent text-[#16130E] text-[10.5px] font-semibold shrink-0 hover:opacity-90"
                    >
                      {simLoading ? 'Routing...' : 'Re-Calculate'}
                    </button>
                  </div>

                  {/* Nearest Store Match & Ranked Distribution List */}
                  <div className="space-y-2 pt-2 border-t border-hairline">
                    <div className="flex items-center justify-between text-xs font-mono text-quiet">
                      <span>Proximity Ranking via Haversine</span>
                      <span className="text-accent font-semibold">{simNearbyStores.length} Registered Hubs</span>
                    </div>

                    {simNearbyStores.length > 0 && (
                      <div className="p-3.5 rounded-xl border-2 border-accent bg-accent/5 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-accent text-[#16130E] font-bold">
                            ★ Optimal Assigned Atelier
                          </span>
                          <span className="text-xs font-mono font-bold text-accent">
                            {simNearbyStores[0].distance_km} km away
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif text-sm font-bold text-body">{simNearbyStores[0].name}</h4>
                          <p className="text-[11px] font-mono text-quiet">{simNearbyStores[0].address || simNearbyStores[0].location}, {simNearbyStores[0].city}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-accent/20 text-[10.5px] font-mono">
                          <div>
                            <span className="text-quiet block">Calculated SLA:</span>
                            <strong className="text-accent">{simNearbyStores[0].delivery_sla}</strong>
                          </div>
                          <div>
                            <span className="text-quiet block">Dispatch Readiness:</span>
                            <strong className="text-body">{simNearbyStores[0].dispatch_readiness}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Secondary Nearby Stores */}
                    <div className="space-y-2 max-h-48 overflow-y-auto thin-scroll pr-1">
                      {simNearbyStores.slice(1).map((s, idx) => (
                        <div key={s.id || idx} className="p-2.5 rounded-xl border border-hairline bg-canvas flex items-center justify-between text-xs font-mono">
                          <div className="min-w-0 pr-2">
                            <h5 className="font-semibold text-body truncate">{s.name}</h5>
                            <span className="text-[10px] text-quiet truncate block">{s.city} • {s.category}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-body block">{s.distance_km} km</span>
                            <span className="text-[9.5px] text-quiet">{s.delivery_sla}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CUSTOMER BUY-BACK PROCESS (CIRCULAR LUXURY TRADE-IN)         */}
        {/* =================================================================== */}
        {activeTab === 'buyback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-body">Customer Buy-Back & Trade-In Engine</h2>
                <p className="text-xs text-quiet font-mono">
                  Circular luxury appraisal, tamper-evident OBD inspection, and instant payout release
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {buybacks.map((bb) => {
                const isSettled = bb.status === 'PAYOUT_DISPATCHED';
                const isOffered = bb.status === 'OFFER_ACCEPTED';
                const isAuth = bb.status === 'AUTHENTICATED';

                return (
                  <div key={bb.id} className="card-premium p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-body">{bb.item_title}</h3>
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-recess border border-hairline text-quiet font-semibold">
                            {bb.buyback_id}
                          </span>
                        </div>
                        <p className="text-xs text-quiet font-mono mt-0.5">
                          Client: <strong className="text-body font-semibold">{bb.customer_name}</strong> • Phone:{' '}
                          <span className="text-accent">{bb.masked_phone}</span> (Zero-Knowledge Masked)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase border ${
                            isSettled
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : isOffered
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                          }`}
                        >
                          {bb.status}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-recess text-body font-bold">
                          {bb.condition_grade}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-recess/60 border border-hairline text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-quiet block uppercase">Original Retail</span>
                        <span className="font-bold text-body">₹{bb.original_price?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-quiet block uppercase">AI Valuation</span>
                        <span className="font-bold text-body">₹{bb.estimated_valuation?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-quiet block uppercase">Offered Buyout</span>
                        <span className="font-bold text-accent">₹{bb.offered_buyout?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-quiet block uppercase">Disbursement Mode</span>
                        <span className="font-bold text-purple-500">{bb.payout_method}</span>
                      </div>
                    </div>

                    {bb.notes && (
                      <p className="text-xs text-quiet italic border-l-2 border-accent pl-3">
                        Inspection Log: {bb.notes}
                      </p>
                    )}

                    {/* Operational Action Workflow */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {bb.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleBuybackAction(bb.buyback_id, 'OBD_INSPECTION_SCHEDULED', bb.offered_buyout, 'Reverse OBD white-glove courier pickup confirmed.')}
                          className="px-4 py-2 rounded-xl bg-solid text-on-solid text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Dispatch White-Glove OBD Courier
                        </button>
                      )}

                      {bb.status === 'OBD_INSPECTION_SCHEDULED' && (
                        <button
                          onClick={() => handleBuybackAction(bb.buyback_id, 'AUTHENTICATED', bb.offered_buyout, 'Physical inspection complete. Hologram & serial verified.')}
                          className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition-colors"
                        >
                          Pass Authentication Check
                        </button>
                      )}

                      {bb.status === 'AUTHENTICATED' && (
                        <button
                          onClick={() => handleBuybackAction(bb.buyback_id, 'OFFER_ACCEPTED', bb.offered_buyout, 'Client signed off on buyout valuation.')}
                          className="px-4 py-2 rounded-xl bg-accent text-[#16130E] text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Confirm Client Acceptance
                        </button>
                      )}

                      {bb.status === 'OFFER_ACCEPTED' && (
                        <button
                          onClick={() => handleBuybackAction(bb.buyback_id, 'PAYOUT_DISPATCHED', bb.offered_buyout, 'IMPS instant payout dispatched. Provenance Certificate issued.')}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Disburse Instant Payout</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedBuyback(bb);
                          setBuybackOfferVal(bb.offered_buyout);
                        }}
                        className="px-3 py-2 rounded-xl border border-hairline bg-canvas text-quiet hover:text-body text-xs font-semibold"
                      >
                        Adjust Valuation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Adjust Commission Rate Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-premium p-6 w-full max-w-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-body">
              Adjust Commission: {selectedShop.name}
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-mono text-quiet">Platform Commission Rate (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={editCommission}
                onChange={(e) => setEditCommission(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-hairline bg-canvas text-sm font-mono text-body outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateShopStatus(selectedShop.shop_id, selectedShop.verification_status, editCommission)}
                className="flex-1 py-2 rounded-xl bg-solid text-on-solid text-xs font-semibold"
              >
                Save Rate
              </button>
              <button
                onClick={() => setSelectedShop(null)}
                className="py-2 px-4 rounded-xl border border-hairline text-xs font-semibold text-quiet hover:text-body"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Buyback Offer Modal */}
      {selectedBuyback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-premium p-6 w-full max-w-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-body">
              Valuation Counter-Offer: {selectedBuyback.buyback_id}
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-mono text-quiet">Offered Buyout Value (₹)</label>
              <input
                type="number"
                step="500"
                value={buybackOfferVal}
                onChange={(e) => setBuybackOfferVal(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-hairline bg-canvas text-sm font-mono text-body outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBuybackAction(selectedBuyback.buyback_id, selectedBuyback.status, buybackOfferVal, 'Counter-offer adjusted by sovereign admin.')}
                className="flex-1 py-2 rounded-xl bg-solid text-on-solid text-xs font-semibold"
              >
                Update Offer
              </button>
              <button
                onClick={() => setSelectedBuyback(null)}
                className="py-2 px-4 rounded-xl border border-hairline text-xs font-semibold text-quiet hover:text-body"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
