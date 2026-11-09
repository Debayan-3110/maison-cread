import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  trackShipmentAPI,
  fetchWarehousesAPI,
  fetchLocalStoresAPI,
  sendOrderTrackingEmailAPI
} from '../services/api';
import {
  Truck,
  ShieldCheck,
  Compass,
  MapPin,
  Building,
  Package,
  Calendar,
  Clock,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Mail,
  Search,
  Thermometer,
  Lock,
  FileText,
  Phone,
  Navigation,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Layers,
  Database,
  ArrowLeft
} from 'lucide-react';

interface ShipmentData {
  id: string;
  tracking_number: string;
  order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address: string;
  destination_city: string;
  destination_lat?: number;
  destination_lng?: number;
  warehouse_name?: string;
  warehouse_code?: string;
  warehouse_address?: string;
  warehouse_security?: string;
  warehouse_lat?: number;
  warehouse_lng?: number;
  store_name?: string;
  store_code?: string;
  store_category?: string;
  store_address?: string;
  store_operating_hours?: string;
  store_phone?: string;
  store_manager?: string;
  store_lat?: number;
  store_lng?: number;
  carrier_name?: string;
  carrier_license?: string;
  courier_name?: string;
  courier_phone?: string;
  current_latitude?: number;
  current_longitude?: number;
  current_location_name?: string;
  status: string;
  tamper_seal_id?: string;
  temperature_celsius?: number;
  estimated_delivery?: string;
  actual_delivery?: string;
  items?: any[];
  timeline?: any[];
  origin_source?: string;
}

export default function ShipmentTrackingPortal() {
  const { theme, showToast, orders } = useShop();
  const isDark = theme === 'dark';

  // Search & Telemetry State
  const [searchInput, setSearchInput] = useState<string>('SHP-2026-89412');
  const [loading, setLoading] = useState<boolean>(false);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [emailing, setEmailing] = useState<boolean>(false);

  // Network Directory State (Neon Warehouses & Stores)
  const [activeTab, setActiveTab] = useState<'shipment' | 'warehouses' | 'stores'>('shipment');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState<boolean>(false);

  // Initial Load from URL params or default Paris shipment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialId = urlParams.get('id') || urlParams.get('track') || (orders.length > 0 ? orders[0].id : 'SHP-2026-89412');
    setSearchInput(initialId);
    handleFetchShipment(initialId);
    loadNetworkDirectory();
  }, []);

  const loadNetworkDirectory = async () => {
    setLoadingNetwork(true);
    try {
      const [whList, stList] = await Promise.all([
        fetchWarehousesAPI().catch(() => []),
        fetchLocalStoresAPI().catch(() => [])
      ]);
      setWarehouses(whList || []);
      setStores(stList || []);
    } catch (err) {
      console.error('Failed to load Neon network directory:', err);
    } finally {
      setLoadingNetwork(false);
    }
  };

  const handleFetchShipment = async (idToQuery: string) => {
    const clean = idToQuery.trim();
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await trackShipmentAPI(clean);
      setShipment(data);
      // Update browser URL query without reloading
      window.history.replaceState({}, '', `/tracking?id=${encodeURIComponent(clean)}`);
    } catch (err: any) {
      setErrorMsg(err.message || `No telemetry record found for "${clean}". Check the tracking code.`);
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchShipment(searchInput);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    showToast(`✓ Copied "${text}" to clipboard`, 'info');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleEmailManifest = async () => {
    if (!shipment) return;
    setEmailing(true);
    try {
      await sendOrderTrackingEmailAPI({
        orderId: shipment.order_id || shipment.tracking_number,
        recipient: shipment.customer_email || null
      });
      showToast(`✓ Sendmail dispatched tracking telemetry to ${shipment.customer_email || 'recipient'}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email notification', 'error');
    } finally {
      setEmailing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'delivered') {
      return {
        label: 'Delivered & Handed Over',
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400'
      };
    }
    if (st === 'out_for_delivery') {
      return {
        label: 'Out for White-Glove Hand Delivery',
        color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        dot: 'bg-cyan-400 animate-pulse'
      };
    }
    if (st.includes('transit') || st === 'dispatched') {
      return {
        label: 'In Armored High-Security Transit',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse'
      };
    }
    return {
      label: 'Cryo-Vault Certified & In Queue',
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400'
    };
  };

  return (
    <div className="min-h-screen bg-canvas text-body font-sans antialiased transition-colors duration-500 selection:bg-cyan-500/30 selection:text-body">
      
      {/* Top Cyber Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-panel/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex items-center gap-2 text-xs font-semibold text-quiet hover:text-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Return to Storefront</span>
            </a>

            <div className="h-4 w-px bg-hairline hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-sm uppercase text-body">MAISON CREAD LOGISTICS</span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    ESCROW v2.6
                  </span>
                </div>
                <p className="text-[10px] text-quiet hidden md:block">Forensic Armored Transit & Sub-Millimeter Vault Telemetry</p>
              </div>
            </div>
          </div>

          {/* Neon Database Live Indicator & Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>Neon PostgreSQL Ledger: Queryable</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('shipment')}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'shipment' ? 'bg-cyan-500 text-black font-bold shadow-sm' : 'text-quiet hover:text-body'}`}
              >
                Tracking
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'warehouses' ? 'bg-cyan-500 text-black font-bold shadow-sm' : 'text-quiet hover:text-body'}`}
              >
                Warehouses ({warehouses.length})
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === 'stores' ? 'bg-cyan-500 text-black font-bold shadow-sm' : 'text-quiet hover:text-body'}`}
              >
                Ateliers ({stores.length})
              </button>
            </div>

            <div className="pl-1 border-l border-hairline">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Live Search */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-hairline bg-gradient-to-b from-recess via-panel to-canvas">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            Global Escrow & Real-Time GPS Corridors
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-body">
            Universal White-Glove <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">Shipment Telemetry</span>
          </h1>

          <p className="text-sm sm:text-base text-quiet max-w-2xl mx-auto">
            Direct real-time query interface connected to Neon PostgreSQL. Track sovereign vaults, partner ateliers, armored couriers, and custody escrow.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-2xl shadow-cyan-950/20">
              <Search className="absolute left-4 w-5 h-5 text-cyan-500 dark:text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Shipment ID (SHP-2026-89412) or Order ID (MC-ORD-2026-79102)..."
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-panel border border-cyan-500/40 text-sm sm:text-base text-body placeholder:text-quiet focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-black text-xs sm:text-sm font-extrabold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>Track Live</span>
              </button>
            </div>
          </form>

          {/* Quick Preset Selector Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-quiet font-mono">Sample Corridors:</span>
            <button
              onClick={() => { setSearchInput('SHP-2026-89412'); handleFetchShipment('SHP-2026-89412'); }}
              className="px-3 py-1 rounded-lg bg-panel hover:bg-recess text-cyan-600 dark:text-cyan-300 border border-hairline font-mono transition-all"
            >
              Paris • SHP-2026-89412
            </button>
            <button
              onClick={() => { setSearchInput('SHP-2026-90455'); handleFetchShipment('SHP-2026-90455'); }}
              className="px-3 py-1 rounded-lg bg-panel hover:bg-recess text-amber-600 dark:text-amber-300 border border-hairline font-mono transition-all"
            >
              London • SHP-2026-90455
            </button>
            <button
              onClick={() => { setSearchInput('SHP-2026-77810'); handleFetchShipment('SHP-2026-77810'); }}
              className="px-3 py-1 rounded-lg bg-panel hover:bg-recess text-emerald-600 dark:text-emerald-300 border border-hairline font-mono transition-all"
            >
              Bengaluru • SHP-2026-77810
            </button>
            {orders.length > 0 && (
              <button
                onClick={() => { setSearchInput(orders[0].id); handleFetchShipment(orders[0].id); }}
                className="px-3 py-1 rounded-lg bg-panel hover:bg-recess text-body border border-hairline font-mono transition-all"
              >
                Your Order • #{orders[0].id}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* TAB 1: SHIPMENT TELEMETRY VIEW */}
        {activeTab === 'shipment' && (
          <div className="space-y-8">
            
            {/* Error Message if query failed */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <strong>Query Error:</strong> {errorMsg}
                </div>
              </div>
            )}

            {/* Shipment Telemetry Container */}
            {shipment && (
              <div className="space-y-6">
                
                {/* 1. Master Telemetry Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-hairline backdrop-blur-xl relative overflow-hidden shadow-2xl">
                  {/* Glowing corner line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500"></div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-hairline">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs text-quiet uppercase tracking-widest">
                          Tracking Identifier
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl sm:text-2xl font-black text-cyan-500 dark:text-cyan-400 tracking-wider">
                            {shipment.tracking_number}
                          </span>
                          <button
                            onClick={() => handleCopy(shipment.tracking_number)}
                            className="p-1.5 rounded-lg bg-recess hover:bg-hairline text-quiet hover:text-body transition-colors"
                            title="Copy Tracking Number"
                          >
                            {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-recess border border-hairline text-quiet">
                          Order #{shipment.order_id}
                        </span>
                      </div>

                      <p className="text-xs text-quiet">
                        Consigned to: <strong className="text-body">{shipment.customer_name}</strong> • Destination: <span className="text-body font-medium">{shipment.destination_city}</span>
                      </p>
                    </div>

                    {/* Actions: Sendmail Manifest & Airway Bill */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleEmailManifest}
                        disabled={emailing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-panel hover:bg-recess border border-hairline text-xs font-bold text-body transition-all disabled:opacity-50"
                      >
                        {emailing ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-500 dark:text-cyan-400" /> : <Mail className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
                        <span>Email Manifest</span>
                      </button>

                      <button
                        onClick={() => {
                          showToast(`✓ Waybill & Sovereign Escrow Certificate generated!`, 'success');
                          window.print();
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-panel hover:bg-recess border border-hairline text-xs font-bold text-body transition-all"
                      >
                        <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span>Print Bill of Lading</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                    {/* Status Badge */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-faint uppercase tracking-widest block">Operational Status</span>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadge(shipment.status).color}`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusBadge(shipment.status).dot}`}></div>
                        <span>{getStatusBadge(shipment.status).label}</span>
                      </div>
                    </div>

                    {/* Tamper Seal */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-faint uppercase tracking-widest block">Tamper Hologram Seal</span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-body">
                        <Lock className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                        <span>{shipment.tamper_seal_id || 'SEAL-CRYPT-OK'}</span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-faint uppercase tracking-widest block">Cold-Chain Temperature</span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                        <Thermometer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{shipment.temperature_celsius || 18.2}°C Hermetic Seal</span>
                      </div>
                    </div>

                    {/* ETA */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-faint uppercase tracking-widest block">Estimated Arrival</span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Within 30 mins'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Routing Waypoints & Live GPS Corridor */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Node 1: Origin Warehouse */}
                  <div className="p-6 rounded-3xl bg-panel border border-hairline space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-quiet">
                      <span className="uppercase tracking-widest">Origin Regional Vault</span>
                      <span className="px-2 py-0.5 rounded bg-recess text-cyan-600 dark:text-cyan-400 font-bold">{shipment.warehouse_code || 'WH-CDG'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-body">{shipment.warehouse_name || 'Maison Central Vault'}</h4>
                        <p className="text-xs text-quiet mt-0.5">{shipment.warehouse_address || 'Zone Fret 4, Paris CDG'}</p>
                        <span className="inline-block mt-2 text-[10px] font-mono text-quiet bg-recess px-2 py-0.5 rounded">
                          {shipment.warehouse_security || 'Tier 4 High-Assurance Vault'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node 2: Local Partner Atelier Store */}
                  <div className="p-6 rounded-3xl bg-panel border border-hairline space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-quiet">
                      <span className="uppercase tracking-widest">Local Atelier Partner</span>
                      <span className="px-2 py-0.5 rounded bg-recess text-amber-600 dark:text-amber-400 font-bold">{shipment.store_code || 'STORE-01'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-body">{shipment.store_name || 'Place Vendôme Atelier'}</h4>
                        <p className="text-xs text-quiet mt-0.5">{shipment.store_address || '12 Place Vendôme, Paris'}</p>
                        <span className="inline-block mt-2 text-[10px] font-mono text-quiet bg-recess px-2 py-0.5 rounded">
                          Hours: {shipment.store_operating_hours || '10:00 AM - 08:00 PM'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Node 3: Live Courier Telemetry */}
                  <div className="p-6 rounded-3xl bg-panel border border-hairline space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-quiet">
                      <span className="uppercase tracking-widest">Assigned Courier Escort</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">ARMORED TRANSIT</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-body">{shipment.courier_name || 'Jean-Luc Moreau'}</h4>
                        <p className="text-xs text-quiet mt-0.5">{shipment.carrier_name || 'Maison Armored White-Glove Transit'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-mono text-quiet bg-recess px-2 py-0.5 rounded">
                            Vehicle: {shipment.carrier_license || 'FR-782-MC'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            GPS Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Live Simulated Map / Beacon Corridor */}
                <div className="p-6 rounded-3xl bg-panel border border-hairline space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-quiet">
                      <MapPin className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                      <span>Live Coordinate Route: {shipment.destination_city} Corridor</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                      Current: {shipment.current_location_name || 'En Route to Destination'}
                    </span>
                  </div>

                  {/* Graphical GPS Pipeline */}
                  <div className="relative py-8 px-4 bg-recess/70 rounded-2xl border border-hairline-soft overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#007BA7_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                      
                      {/* Step A: Warehouse */}
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-mono font-bold text-lg shadow-lg">
                          WH
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">Dispatch Origin</div>
                          <div className="text-sm font-bold text-body">{shipment.warehouse_name || 'Paris Central Vault'}</div>
                          <div className="text-[11px] font-mono text-quiet">Lat: {shipment.warehouse_lat || 49.0097}, Lng: {shipment.warehouse_lng || 2.5479}</div>
                        </div>
                      </div>

                      {/* Direction Arrow */}
                      <div className="flex-1 hidden md:flex items-center justify-center px-4">
                        <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-500 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-panel border border-hairline text-[10px] font-mono text-body whitespace-nowrap shadow-sm">
                            Escort In Transit
                          </div>
                        </div>
                      </div>

                      {/* Step B: Boutique Hand-off */}
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-mono font-bold text-lg shadow-lg">
                          AT
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">Boutique Waypoint</div>
                          <div className="text-sm font-bold text-body">{shipment.store_name || 'Place Vendôme'}</div>
                          <div className="text-[11px] font-mono text-quiet">Lat: {shipment.store_lat || 48.8675}, Lng: {shipment.store_lng || 2.3294}</div>
                        </div>
                      </div>

                      {/* Direction Arrow */}
                      <div className="flex-1 hidden md:flex items-center justify-center px-4">
                        <div className="w-full h-0.5 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-500 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-panel border border-hairline text-[10px] font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap shadow-sm">
                            Final Leg
                          </div>
                        </div>
                      </div>

                      {/* Step C: Customer Destination */}
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg shadow-lg">
                          VIP
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">Destination Address</div>
                          <div className="text-sm font-bold text-body">{shipment.customer_name}</div>
                          <div className="text-[11px] font-mono text-quiet">{shipment.delivery_address}</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 4. Detailed 6-Stage Timeline */}
                <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-hairline space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-hairline">
                    <h3 className="text-base font-extrabold uppercase tracking-wider text-body flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                      <span>Custody Audit & Telemetry Log</span>
                    </h3>
                    <span className="text-xs font-mono text-faint">6 Verified Stages</span>
                  </div>

                  <div className="space-y-6">
                    {(shipment.timeline || []).map((step: any, idx: number) => {
                      const isComplete = step.status === 'completed';
                      const isActive = step.status === 'active';

                      return (
                        <div key={idx} className="flex items-start gap-4 group">
                          {/* Indicator Icon */}
                          <div className="pt-0.5 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                              isComplete ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' :
                              isActive ? 'bg-cyan-500 text-black animate-pulse shadow-md shadow-cyan-500/30' :
                              'bg-recess text-faint border border-hairline'
                            }`}>
                              {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            {idx < (shipment.timeline?.length || 0) - 1 && (
                              <div className={`w-0.5 h-12 my-1 ${isComplete ? 'bg-emerald-500/50' : 'bg-hairline'}`}></div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className={`text-sm font-bold ${isActive ? 'text-cyan-600 dark:text-cyan-400' : isComplete ? 'text-body' : 'text-faint'}`}>
                                {step.title}
                              </h4>
                              {step.timestamp && (
                                <span className="text-[11px] font-mono text-quiet">
                                  {new Date(step.timestamp).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-quiet mt-1">{step.details || step.description}</p>
                            {step.location && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-quiet">
                                <MapPin className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                                <span>{step.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Item Acquisition Manifest */}
                <div className="p-6 sm:p-8 rounded-3xl bg-panel border border-hairline space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-hairline">
                    <h3 className="text-base font-extrabold uppercase tracking-wider text-body flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Insured Manifest Items</span>
                    </h3>
                    <span className="text-xs font-mono text-faint">Declared Value Escrow Protected</span>
                  </div>

                  <div className="divide-y divide-hairline-soft">
                    {(shipment.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="w-14 h-14 rounded-xl object-cover bg-panel border border-hairline" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-recess border border-hairline flex items-center justify-center text-quiet">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-body">{item.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-quiet font-mono">
                              <span>Qty: {item.quantity || 1}</span>
                              {item.serial && <span className="text-cyan-600 dark:text-cyan-400">SN: {item.serial}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
                          ${floatFormat(item.price * (item.quantity || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEON REGIONAL WAREHOUSES DIRECTORY */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-body">Neon Queryable Regional Warehouses</h2>
                <p className="text-xs text-quiet">High-assurance climate vaults storing sovereign inventories across 5 global hubs.</p>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                Live Neon Table: warehouses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-6 rounded-3xl bg-panel border border-hairline space-y-4 hover:border-cyan-500/40 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">{wh.code}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">{wh.status}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-body">{wh.name}</h3>
                    <p className="text-xs text-quiet mt-1">{wh.address}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-hairline text-xs font-mono text-quiet">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-body">{wh.latitude}, {wh.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="text-body">{wh.capacity_sqft?.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security:</span>
                      <span className="text-amber-600 dark:text-amber-400">{wh.security_level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NEON PARTNER ATELIERS DIRECTORY */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-body">Neon Queryable Partner Boutiques & Ateliers</h2>
                <p className="text-xs text-quiet">Certified local master ateliers handling waypoint inspections and VIP pickups.</p>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                Live Neon Table: local_stores
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((st) => (
                <div key={st.id} className="p-6 rounded-3xl bg-panel border border-hairline space-y-4 hover:border-amber-500/40 transition-all shadow-md">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{st.store_code}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">★ {st.rating || 4.95}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-body">{st.name}</h3>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 block mt-0.5">{st.category}</span>
                    <p className="text-xs text-quiet mt-1.5">{st.address}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-hairline text-xs font-mono text-quiet">
                    <div className="flex justify-between">
                      <span>Manager:</span>
                      <span className="text-body">{st.manager_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span className="text-body font-medium">{st.operating_hours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="text-body">{st.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-panel/80 py-8 px-4 text-center text-xs text-quiet space-y-2">
        <p className="font-semibold text-body">Maison Cread Sovereign Logistics & Custody Escrow OS</p>
        <p className="font-mono text-[11px] text-faint">Connected to Neon PostgreSQL (Lakebase ap-southeast-1) • Sendmail Protocol Active</p>
      </footer>
    </div>
  );
}

function floatFormat(num: number | undefined): string {
  if (num === undefined || num === null) return '0.00';
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

