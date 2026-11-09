import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { trackOrderAPI, sendOrderTrackingEmailAPI } from '../services/api';
import {
  X,
  Compass,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Package,
  Calendar,
  Layers,
  Copy,
  Check,
  Building,
  RefreshCw,
  ExternalLink,
  Mail
} from 'lucide-react';
import { formatRupees } from '../utils/commerce';

export default function OrderTrackerModal() {
  const {
    isOrderTrackerOpen,
    closeOrderTracker,
    trackingOrderId,
    setTrackingOrderId,
    orders,
    theme,
    showToast
  } = useShop();

  const isDark = theme === 'dark';

  const [inputOrderId, setInputOrderId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Sync initial order ID from context
  useEffect(() => {
    if (isOrderTrackerOpen) {
      const targetId = trackingOrderId || (orders.length > 0 ? orders[0].id : '');
      setInputOrderId(targetId);
      if (targetId) {
        fetchTrackingData(targetId);
      }
    } else {
      setOrderData(null);
      setErrorMsg('');
    }
  }, [isOrderTrackerOpen, trackingOrderId]);

  const fetchTrackingData = async (id: string) => {
    const cleanId = id.trim();
    if (!cleanId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await trackOrderAPI(cleanId);
      setOrderData(data);
      setTrackingOrderId(cleanId);
    } catch (err: any) {
      console.warn('Track order lookup:', err);
      // Fallback to locally held orders if available
      const localMatch = orders.find((o) => o.id === cleanId || o.id.includes(cleanId));
      if (localMatch) {
        setOrderData(localMatch);
      } else {
        setErrorMsg(err.message || `No record found for Order ID '${cleanId}'. Please check your receipt.`);
        setOrderData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOrderId.trim()) {
      setErrorMsg('Please enter a Unique Order ID (e.g. MC-ORD-2026-...)');
      return;
    }
    fetchTrackingData(inputOrderId);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    showToast('Unique Order ID copied to clipboard', 'info');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOrderTrackerOpen) return null;

  const timeline = orderData?.trackingTimeline || [
    { step: 1, stage: 'placed', title: 'Order Placed & Vault Registered', location: 'Maison Cloud Infrastructure Gateway', status: 'completed', timestamp: orderData?.orderDate || 'Recently' },
    { step: 2, stage: 'confirmed_by_shop', title: 'Assigned to Registered Atelier', location: orderData?.assignedShopName || "Maison de l'Horlogerie", status: 'active', timestamp: 'In Progress' },
    { step: 3, stage: 'vault_inspected', title: 'Quality & Freshness Certification', location: 'Quality Desk', status: 'pending', timestamp: null },
    { step: 4, stage: 'dispatched', title: 'Dispatched via White-Glove Courier', location: 'Local Hub', status: 'pending', timestamp: null },
    { step: 5, stage: 'out_for_delivery', title: 'Out for Hand-Delivery', location: orderData?.shippingInfo?.city || 'Destination', status: 'pending', timestamp: null },
    { step: 6, stage: 'delivered', title: 'Safely Delivered', location: 'Private Client Destination', status: 'pending', timestamp: null }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-scrim/80 backdrop-blur-md phone-xl:items-center phone-xl:p-4 sm:p-6">
      <div
        className={`relative flex max-h-dvh w-full max-w-3xl flex-col rounded-3xl border p-5 md:p-7 shadow-2xl backdrop-blur-xl transition-all overflow-hidden ${
          isDark
            ? 'bg-[#0A1218]/95 border-[#007BA7]/40 text-white shadow-[0_0_50px_rgba(0,123,167,0.25)]'
            : 'bg-[#FFFDD0] border-[#0C0C0C]/20 text-[#0C0C0C] shadow-[0_20px_60px_rgba(12,12,12,0.15)]'
        }`}
      >
        {/* Luminescent Header Glow */}
        <div
          className={`pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[90px] ${
            isDark ? 'bg-[#007BA7]/25' : 'bg-[#CC5500]/15'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                isDark ? 'bg-[#007BA7]/20 text-[#007BA7] border border-[#007BA7]/40' : 'bg-[#CC5500]/15 text-[#CC5500] border border-[#CC5500]/30'
              }`}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-serif tracking-tight">Sovereign Order Tracking</h3>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-[#007BA7]/15 text-[#007BA7] border-[#007BA7]/40'
                      : 'bg-[#CC5500]/15 text-[#CC5500] border-[#CC5500]/30'
                  }`}
                >
                  LIVE GPS &amp; ATELIER ROUTING
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Track your order in real-time across registered partner ateliers and delivery couriers.
              </p>
            </div>
          </div>
          <button
            onClick={closeOrderTracker}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order ID Search Bar */}
        <form onSubmit={handleSearchSubmit} className="pt-4 pb-2 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Enter Unique Order ID (e.g. MC-ORD-2026-89412)"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono tracking-wider outline-none border transition-all ${
                  isDark
                    ? 'bg-zinc-900/90 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                    : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm ${
                isDark
                  ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white'
                  : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white'
              } disabled:opacity-50`}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              <span>Track Order</span>
            </button>
          </div>
        </form>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {orderData && (
            <>
              {/* Order Overview Header Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                      Unique Order ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-accent">
                        {orderData.id || orderData.orderId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(orderData.id || orderData.orderId)}
                        className={`p-1 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
                        }`}
                        title="Copy Order ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await sendOrderTrackingEmailAPI({ orderId: orderData.id || orderData.orderId });
                            showToast(`✓ Sendmail dispatched tracking manifest to customer email!`, 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Failed to dispatch email', 'error');
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white hover:border-accent' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                        }`}
                        title="Dispatch Tracking Email via Sendmail"
                      >
                        <Mail className="w-3.5 h-3.5 text-accent" />
                        <span className="hidden sm:inline">Email Tracker</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono block">
                      Estimated Delivery Window
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block font-mono">
                      {orderData.estimatedDelivery || '2-3 Business Days'}
                    </span>
                  </div>
                </div>

                {/* Routing & Geolocation Pair */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                  {/* Origin Boutique / Atelier */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <Building className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[11px] text-quiet">Fulfilling Registered Atelier</span>
                        {orderData.distanceKm && (
                          <span className="px-1.5 py-0.2 rounded bg-accent/20 text-accent font-mono text-[9px] font-bold">
                            {orderData.distanceKm} km away
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-body mt-0.5">{orderData.assignedShopName || "Maison de l'Horlogerie"}</p>
                      <p className="text-[11px] text-quiet">
                        {orderData.assignedShopId || 'SHOP-HORLOGERIE-01'} • Direct Atelier Dispatch Hub
                      </p>
                    </div>
                  </div>

                  {/* Destination Customer Address */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[11px] text-quiet">Delivery Destination (GPS Resolved)</span>
                      <p className="font-bold text-body mt-0.5">
                        {orderData.deliveryAddress ||
                          (orderData.shippingInfo
                            ? `${orderData.shippingInfo.address}, ${orderData.shippingInfo.city}`
                            : 'Client Private Address')}
                      </p>
                      <p className="text-[11px] text-quiet">
                        Recipient: {orderData.shippingInfo?.fullName || 'Private Client'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Stage Real-Time Tracking Timeline */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Live Tracking Pipeline
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Stage {timeline.filter((s: any) => s.status === 'completed').length + 1} of {timeline.length}
                  </span>
                </div>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-hairline">
                  {timeline.map((item: any, idx: number) => {
                    const isCompleted = item.status === 'completed';
                    const isActive = item.status === 'active';
                    const isPending = item.status === 'pending';

                    return (
                      <div key={idx} className="relative flex items-start gap-3.5 pl-1 group">
                        {/* Status Icon Node */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : isActive
                              ? isDark
                                ? 'bg-[#007BA7] text-white animate-pulse shadow-[0_0_12px_rgba(0,123,167,0.6)]'
                                : 'bg-[#CC5500] text-white animate-pulse shadow-[0_0_10px_rgba(204,85,0,0.4)]'
                              : isDark
                              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              : 'bg-zinc-200 text-zinc-400 border border-zinc-300'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isActive ? (
                            <Compass className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold ${
                                isCompleted
                                  ? 'text-body'
                                  : isActive
                                  ? 'text-accent'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.timestamp && (
                              <span className="text-[10px] font-mono text-zinc-400">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                            {item.description || item.location}
                          </p>
                          {item.location && (
                            <span className="text-[10px] text-quiet flex items-center gap-1 mt-0.5 font-mono">
                              <MapPin className="w-3 h-3 text-accent" /> {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items in this Order (with Photo Gallery, Expiry & Mfg Dates) */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Ordered Items &amp; Provenance Data
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {orderData.items?.length || 0} Products
                  </span>
                </div>

                <div className="divide-y divide-hairline">
                  {(orderData.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                      {/* Thumbnail Photo */}
                      <img
                        src={item.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover border border-hairline bg-recess shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-body truncate">{item.title}</h5>
                          <span className="text-xs font-mono font-bold text-body">
                            {formatRupees(item.price * (item.quantity || 1))}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-quiet">Qty: {item.quantity || 1}</span>
                          {item.category && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-recess text-quiet border border-hairline uppercase font-mono">
                              {item.category}
                            </span>
                          )}
                          {item.shopName && (
                            <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                              <Building className="w-3 h-3" /> {item.shopName}
                            </span>
                          )}
                        </div>

                        {/* Manufacturing & Expiry Date Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {item.manufacturingDate && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-recess border border-hairline text-quiet flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-accent" /> Mfg: {item.manufacturingDate}
                            </span>
                          )}
                          {item.expiryDate && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                item.expiryDate.includes('Not Applicable')
                                  ? 'bg-recess text-quiet border-hairline'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                              }`}
                            >
                              <Clock className="w-3 h-3" /> Exp: {item.expiryDate}
                            </span>
                          )}
                          {item.batchNumber && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-recess text-quiet border border-hairline">
                              Batch: {item.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!orderData && !loading && !errorMsg && (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 rounded-full bg-recess flex items-center justify-center mx-auto text-quiet">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-body">Enter an Order ID to Begin Tracking</h4>
              <p className="text-xs text-quiet max-w-sm mx-auto">
                Each order placed in Maison Cread receives a sovereign tracking ID with GPS route coordinates and certified boutique provenance.
              </p>
              {orders.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-quiet block mb-1.5">Or select from your recent orders:</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {orders.slice(0, 3).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setInputOrderId(o.id);
                          fetchTrackingData(o.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-accent-soft text-accent border border-hairline hover:border-accent"
                      >
                        {o.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-quiet flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Maison Sovereign Escrow &amp; GPS Dispatch Protocol</span>
          </span>
          <button
            type="button"
            onClick={closeOrderTracker}
            className={`px-4 py-1.5 rounded-xl border text-xs font-semibold ${
              isDark ? 'border-zinc-700 text-zinc-300 hover:text-white' : 'border-zinc-300 text-zinc-700 hover:text-black'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

