import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Package,
  Sparkles,
  DollarSign,
  Heart,
  Copy,
  Check,
  Gift,
  Thermometer,
  Box,
  Layers,
  Award,
  MapPin,
  Compass,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { Order } from '../types/models';
import { calculateCartTotals, formatRupees } from '../utils/commerce';
import { calculateDonationImpact, reverseGeocodeAPI, getNearbyStoresAPI } from '../services/api';

interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

interface PaymentInfo {
  method: 'card' | 'paypal' | 'upi';
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  upiId: string;
}

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    appliedCoupon,
    createOrder,
    user,
    setIsOrderHistoryOpen,
    showToast,
    openLegalPolicy,
    openOrderTracker
  } = useShop();

  const [step, setStep] = useState<number>(1); // 1: Shipping, 2: Payment, 3: Success
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [isHandlingInspecting, setIsHandlingInspecting] = useState<boolean>(false);
  const [handlingStep, setHandlingStep] = useState<number>(0);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [nearestShop, setNearestShop] = useState<any | null>(null);

  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    city: 'Bengaluru',
    zipCode: '560001',
    phone: '+91 '
  });

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || ''
      }));
    }
  }, [user]);

  const [payment, setPayment] = useState<PaymentInfo>({
    method: 'card',
    cardNumber: '4532 •••• •••• 8892',
    cardExpiry: '12/28',
    cardCvc: '888',
    upiId: 'alex@okicici'
  });

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(100);
  const [donationImpact, setDonationImpact] = useState<any>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  useEffect(() => {
    if (donationAmount > 0) {
      calculateDonationImpact(donationAmount).then((data) => {
        if (data) setDonationImpact(data);
      });
    } else {
      setDonationImpact(null);
    }
  }, [donationAmount]);

  if (!isCheckoutOpen) return null;

  const totals = calculateCartTotals(cart, appliedCoupon);
  const finalTotalDue = totals.total + donationAmount;

  // Uses browser geolocation & open-source map scraper to resolve exact address & nearest shop
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // 1. Resolve exact street address via reverse geocode
          const geo = await reverseGeocodeAPI(lat, lng);
          if (geo && geo.success) {
            setShipping((prev) => ({
              ...prev,
              address: geo.street || geo.formattedAddress || prev.address,
              city: geo.city || prev.city,
              zipCode: geo.postalCode || prev.zipCode,
              latitude: lat,
              longitude: lng
            }));
            showToast('Exact delivery address resolved via GPS!', 'success');
          }

          // 2. Discover nearest registered store for optimal order distribution
          const nearby = await getNearbyStoresAPI(lat, lng, 50.0);
          if (Array.isArray(nearby) && nearby.length > 0) {
            setNearestShop(nearby[0]);
          }
        } catch (err: any) {
          console.error('Location error:', err);
          showToast(err.message || 'Failed to resolve exact address', 'error');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation denied or unavailable:', error);
        // Fallback to demo atelier coordinates (Place Vendôme Paris)
        showToast('Using demo high-precision atelier coordinates (Paris Central)', 'info');
        setShipping((prev) => ({
          ...prev,
          address: '15 Place Vendôme',
          city: 'Paris',
          zipCode: '75001',
          latitude: 48.8675,
          longitude: 2.3294
        }));
        setNearestShop({
          name: "Maison de l'Horlogerie",
          distance_km: 0.1,
          delivery_sla: 'Instant 2-Hour White-Glove Courier',
          location: 'Place Vendôme, Paris'
        });
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handles order placement with White-Glove Handling & Packaging animation sequence
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsHandlingInspecting(true);
    setHandlingStep(1);

    // Sequence of micro-animations to simulate white-glove inspection & packaging
    setTimeout(() => setHandlingStep(2), 500);
    setTimeout(() => setHandlingStep(3), 1100);
    setTimeout(() => setHandlingStep(4), 1600);

    setTimeout(async () => {
      const donationData = donationAmount > 0 ? {
        amount: donationAmount,
        beneficiary: donationImpact?.beneficiary || "Sunshine Children's Sanctuary",
        impactDescription: donationImpact?.impactDescription || "Sponsored fresh fruits & floral cheer for children in need.",
        rewardCoupon: donationImpact?.rewardCoupon?.code || "HOPE-BLOOM-20",
        badge: donationImpact?.badge || "Maison Hope Angel"
      } : null;

      const order = await createOrder(
        shipping,
        payment,
        totals.subtotal,
        totals.gst,
        totals.shipping,
        totals.discount,
        finalTotalDue,
        donationData,
        shipping.latitude,
        shipping.longitude
      );

      setPlacedOrder(order);
      setIsHandlingInspecting(false);
      setStep(3);

      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 2000);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep(1);
    setPlacedOrder(null);
    setIsHandlingInspecting(false);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showToast(`Reward coupon ${code} copied! (20% Off)`, 'success');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-scrim/80 backdrop-blur-[4px]"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-premium relative z-10 flex min-h-full w-full flex-col overflow-hidden rounded-none phone-xl:my-8 phone-xl:min-h-0 phone-xl:max-h-[92dvh] phone-xl:rounded-[18px] max-w-2xl bg-canvas text-left shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline p-4 phone-lg:p-6 bg-panel/70 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-accent">Private Checkout</span>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                White-Glove Certified
              </span>
            </div>
            <h2 className="title-editorial mt-1 text-[21px] phone-lg:text-[25px]">
              {step === 3 ? 'Order Confirmed & Sealed' : 'Complete Your Order'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close checkout"
            className="btn-ghost h-9 w-9 rounded-full p-0 text-quiet hover:text-body"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Progress Bar with Animated Stepper */}
        {step !== 3 && !isHandlingInspecting && (
          <div className="border-b border-hairline bg-panel/40 px-6 py-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-quiet">
              <span className={step === 1 ? 'font-semibold text-accent flex items-center gap-1' : 'text-body'}>
                1. Shipping &amp; Recipient
              </span>
              <span className="h-0.5 w-10 bg-hairline" />
              <span className={step === 2 ? 'font-semibold text-accent flex items-center gap-1' : 'text-quiet'}>
                2. Payment &amp; Freshness Guarantee
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hairline/60">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: '50%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] phone-lg:space-y-6 phone-lg:p-6 sm:p-8">
          {/* Animated Packaging & Cold-Chain Processing Overlay */}
          {isHandlingInspecting ? (
            <div className="py-12 text-center space-y-6">
              <div className="relative mx-auto h-24 w-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-accent/60"
                />
                <div className="flex h-full w-full items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Package className="h-10 w-10 animate-pulse" />
                </div>
              </div>

              <div>
                <span className="eyebrow text-accent">Maison White-Glove Protocol</span>
                <h3 className="title-editorial mt-1 text-[22px] text-body">
                  Inspecting &amp; Cold-Chain Sealing Your Order
                </h3>
                <p className="mt-1 text-[13px] text-quiet">
                  Securing thermal insulation and ensuring peak harvest freshness before dispatch.
                </p>
              </div>

              {/* Progress Checklist */}
              <div className="mx-auto max-w-sm rounded-[16px] border border-hairline bg-panel p-4 text-left space-y-2.5">
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <CheckCircle2 className={`h-4 w-4 ${handlingStep >= 1 ? 'text-success' : 'text-faint'}`} />
                  <span className={handlingStep >= 1 ? 'text-body font-medium' : 'text-quiet'}>
                    Verifying Peak Freshness &amp; Sourcing Harvest
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <CheckCircle2 className={`h-4 w-4 ${handlingStep >= 2 ? 'text-success' : 'text-faint'}`} />
                  <span className={handlingStep >= 2 ? 'text-body font-medium' : 'text-quiet'}>
                    Sealing in 1.4°C Bio-Insulated Cryo-Gel Container
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <CheckCircle2 className={`h-4 w-4 ${handlingStep >= 3 ? 'text-success' : 'text-faint'}`} />
                  <span className={handlingStep >= 3 ? 'text-body font-medium' : 'text-quiet'}>
                    Affixing Zero-Impact Shock Padded Interior
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <CheckCircle2 className={`h-4 w-4 ${handlingStep >= 4 ? 'text-success' : 'text-faint'}`} />
                  <span className={handlingStep >= 4 ? 'text-body font-medium' : 'text-quiet'}>
                    Securing Tamper-Evident Seal &amp; Welfare Impact
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Shipping &amp; Recipient Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-quiet font-semibold block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={shipping.fullName}
                        onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-quiet font-semibold block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={shipping.email}
                        onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-quiet font-semibold">Delivery Address</label>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isLocating}
                          className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {isLocating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                          <span>{isLocating ? 'Resolving GPS...' : 'Detect Exact Location (GPS / Map)'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={shipping.address}
                        onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                        placeholder="House / Suite / Building & Street"
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  {/* Nearest Registered Atelier & Order Distribution Preview */}
                  {nearestShop && (
                    <div className="p-3.5 rounded-2xl border border-accent/40 bg-accent-soft/20 flex items-start gap-3 text-xs">
                      <div className="w-8 h-8 rounded-xl bg-accent text-on-solid flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-body">{nearestShop.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-accent text-on-solid font-mono text-[10px] font-bold">
                            {nearestShop.distance_km} km away
                          </span>
                        </div>
                        <p className="text-[11px] text-quiet mt-0.5">
                          {nearestShop.location || nearestShop.address} • <strong className="text-body">{nearestShop.delivery_sla}</strong>
                        </p>
                        <p className="text-[10.5px] text-accent font-semibold mt-1">
                          ✓ Optimal fulfillment atelier assigned for zero-delay order distribution.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 phone-xl:grid-cols-3 phone-lg:gap-4">
                    <div>
                      <label className="text-xs text-quiet font-semibold block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-quiet font-semibold block mb-1">PIN Code</label>
                      <input
                        type="text"
                        required
                        value={shipping.zipCode}
                        onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-quiet font-semibold block mb-1">Phone</label>
                      <input
                        type="text"
                        required
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-solid hover:opacity-90 text-on-solid font-bold text-xs flex items-center gap-2 shadow-quiet"
                    >
                      <span>Continue to Payment &amp; Handling</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handlePlaceOrder}
                  className="space-y-5"
                >
                  {/* Certified White-Glove Handling & Packaging Guarantee Card */}
                  <div className="rounded-[16px] border border-hairline bg-panel/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow flex items-center gap-1.5 text-accent">
                        <Award className="h-3.5 w-3.5" />
                        Freshness &amp; White-Glove Handling Guarantee
                      </span>
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                        Active 1.4°C Cold Chain
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-[11.5px]">
                      <div className="rounded-xl border border-hairline bg-recess p-2.5">
                        <p className="font-semibold text-body flex items-center gap-1">
                          <Thermometer className="h-3.5 w-3.5 text-accent" /> 0–2°C Sealed
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-quiet">
                          Maintained under strict cryo-insulation right up to delivery.
                        </p>
                      </div>

                      <div className="rounded-xl border border-hairline bg-recess p-2.5">
                        <p className="font-semibold text-body flex items-center gap-1">
                          <Box className="h-3.5 w-3.5 text-accent" /> Eco-Shock Shield
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-quiet">
                          Zero-impact cushioning protects fragile flowers, fruits &amp; cuts.
                        </p>
                      </div>

                      <div className="rounded-xl border border-hairline bg-recess p-2.5">
                        <p className="font-semibold text-body flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-success" /> 100% Guaranteed
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-quiet">
                          Full replacement if peak freshness is compromised in transit.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Selection */}
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment Selection
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5 phone-lg:grid-cols-3 phone-lg:gap-3">
                    {[
                      { id: 'card', label: 'Credit Card', icon: CreditCard },
                      { id: 'paypal', label: 'Wallet', icon: DollarSign },
                      { id: 'upi', label: 'Instant UPI', icon: Sparkles }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayment({ ...payment, method: m.id as any })}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                          payment.method === m.id
                            ? 'bg-accent-soft border-accent text-accent'
                            : 'bg-recess border-hairline text-quiet hover:text-body'
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {payment.method === 'card' && (
                    <div className="space-y-3 bg-recess p-4 rounded-2xl border border-hairline">
                      <div>
                        <label className="text-xs text-quiet font-semibold block mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          value={payment.cardNumber}
                          onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-panel border border-hairline text-sm text-body focus:border-accent outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-quiet font-semibold block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            value={payment.cardExpiry}
                            onChange={(e) => setPayment({ ...payment, cardExpiry: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-panel border border-hairline text-sm text-body focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-quiet font-semibold block mb-1">CVV Code</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={payment.cardCvc}
                            onChange={(e) => setPayment({ ...payment, cardCvc: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-panel border border-hairline text-sm text-body focus:border-accent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {payment.method === 'upi' && (
                    <div className="bg-recess p-4 rounded-2xl border border-hairline">
                      <label className="text-xs text-quiet font-semibold block mb-1">UPI ID / VPA</label>
                      <input
                        type="text"
                        required
                        value={payment.upiId}
                        onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-panel border border-hairline text-sm text-body focus:border-accent outline-none"
                      />
                    </div>
                  )}

                  {payment.method === 'paypal' && (
                    <div className="bg-recess p-4 rounded-2xl border border-hairline text-center text-xs text-quiet">
                      Complete the payment securely using your preferred wallet.
                    </div>
                  )}

                  {/* Orphanage Bloom & Nourishment Pledge Card */}
                  <div className="rounded-2xl border border-accent/30 bg-accent-soft/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-accent font-semibold text-xs uppercase tracking-wider">
                        <Heart className="w-3.5 h-3.5 fill-accent" />
                        Orphanage Nourishment &amp; Bloom Pledge
                      </div>
                      <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                        Instant 20% Reward Coupon
                      </span>
                    </div>

                    <p className="text-xs text-quiet leading-relaxed">
                      Support our zero-waste initiative. Fresh surplus and your micro-gift provide organic fruits
                      and flower decor for local children's homes.
                    </p>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { amt: 0, label: 'Skip' },
                        { amt: 50, label: '+₹50' },
                        { amt: 100, label: '+₹100 (Rec)' },
                        { amt: 250, label: '+₹250' }
                      ].map((tier) => (
                        <button
                          key={tier.amt}
                          type="button"
                          onClick={() => setDonationAmount(tier.amt)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                            donationAmount === tier.amt
                              ? 'bg-accent text-on-solid border-accent shadow-sm'
                              : 'bg-panel border-hairline text-quiet hover:text-body'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>

                    {donationImpact && donationAmount > 0 && (
                      <div className="bg-panel/90 p-3 rounded-xl border border-hairline/80 text-[11.5px] space-y-1">
                        <div className="flex items-center gap-1 text-accent font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Real-Time Impact For {donationImpact.beneficiary}:</span>
                        </div>
                        <p className="text-body font-medium leading-relaxed">
                          {donationImpact.impactDescription}
                        </p>
                        <p className="text-[10.5px] text-success font-semibold pt-1">
                          🎁 Unlocks Coupon code: <span className="font-mono bg-success/10 px-1.5 py-0.5 rounded">{donationImpact.rewardCoupon?.code}</span> (20% Off)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Indian Statutory Dual GST Tax Invoice Summary */}
                  <div className="p-4 rounded-2xl bg-panel border border-hairline space-y-2 text-sm shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold">
                        Indian Business Law Tax Invoice (Rule 46 CGST)
                      </span>
                      <span className="text-[10px] font-mono text-faint">
                        GSTIN: 29AABCS1429B1Z8
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-quiet">
                      <span>Taxable Goods Value:</span>
                      <span className="font-mono text-body font-semibold">{formatRupees(totals.taxableAmount)}</span>
                    </div>

                    {totals.discount > 0 && (
                      <div className="flex justify-between items-center text-xs text-success">
                        <span>Privilege Discount:</span>
                        <span className="font-mono">-{formatRupees(totals.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-quiet">
                      <span>Central GST (CGST @ {totals.cgstRate}%):</span>
                      <span className="font-mono text-body">{formatRupees(totals.cgst)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-quiet">
                      <span>State GST (SGST @ {totals.sgstRate}%):</span>
                      <span className="font-mono text-body">{formatRupees(totals.sgst)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-quiet">
                      <span>Insured White-Glove Delivery:</span>
                      <span className="font-mono text-body">
                        {totals.shipping === 0 ? 'Complimentary' : formatRupees(totals.shipping)}
                      </span>
                    </div>

                    {donationAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-accent font-semibold pt-1 border-t border-hairline/60">
                        <span>Orphanage Sanctuary Pledge:</span>
                        <span className="font-mono">+{formatRupees(donationAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-hairline">
                      <div>
                        <span className="text-body font-bold block text-sm">Total Payment Due:</span>
                        <span className="text-[10.5px] text-faint font-mono">Inclusive of all Central &amp; State Taxes</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-success">{formatRupees(finalTotalDue)}</span>
                    </div>
                  </div>

                  {/* Statutory Legal Consent Checkbox (DPDP Act 2023, OBD Protocol & BNS) */}
                  <div className="p-3.5 rounded-xl border border-hairline bg-recess/60 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-left select-none">
                      <input
                        type="checkbox"
                        required
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-hairline accent-[#007BA7] focus:ring-1 focus:ring-[#007BA7]"
                      />
                      <span className="text-[11px] leading-tight text-quiet">
                        I have reviewed and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => openLegalPolicy('terms')}
                          className="text-[#007BA7] underline hover:opacity-80"
                        >
                          Terms &amp; Conditions
                        </button>
                        , the{' '}
                        <button
                          type="button"
                          onClick={() => openLegalPolicy('returns')}
                          className="text-[#007BA7] underline hover:opacity-80"
                        >
                          Open Box Delivery (OBD) Protocol
                        </button>
                        , and consent to BNS encrypted phone masking for delivery verification under the DPDP Act 2023.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-recess text-body text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={!agreedToTerms}
                      className="px-6 py-3 rounded-xl bg-solid text-on-solid font-semibold text-xs shadow-quiet flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Place Order
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 3 && placedOrder && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-hairline shadow-scrim">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <span className="eyebrow text-success">Order Successfully Dispatched</span>
                    <h3 className="title-editorial text-[24px] text-body">
                      Thank You, {shipping.fullName || 'Valued Client'}
                    </h3>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-xs text-quiet">Unique Order ID:</span>
                      <span className="font-mono text-sm font-bold text-accent px-2.5 py-0.5 rounded-lg bg-accent/10 border border-accent/30">
                        {placedOrder.id}
                      </span>
                    </div>
                  </div>

                  {/* Dispatch & Handling Status Card with Assigned Shop Details */}
                  <div className="rounded-[16px] border border-hairline bg-panel p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-body flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-accent" /> Priority Sovereign Dispatch
                      </span>
                      <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        {placedOrder.estimatedDelivery || 'Instant 2-Hour Courier'}
                      </span>
                    </div>
                    {placedOrder.assignedShopName && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-recess border border-hairline text-xs">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-accent" />
                          <div>
                            <span className="text-quiet text-[11px] block">Fulfilling Boutique / Atelier:</span>
                            <span className="font-bold text-body">{placedOrder.assignedShopName}</span>
                          </div>
                        </div>
                        {placedOrder.distanceKm && (
                          <span className="font-mono text-[11px] text-accent font-bold">
                            {placedOrder.distanceKm} km away
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[12px] text-quiet">
                      Delivering to: <span className="text-body font-medium">{shipping.address}, {shipping.city} ({shipping.zipCode})</span>
                    </p>
                    <p className="text-[11px] text-faint">
                      Packaging Guarantee: Insulated thermal shield with bio-cushioning and tamper-evident seal applied.
                    </p>
                  </div>

                  {/* Real-Time Orphanage Certificate */}
                  {donationAmount > 0 && donationImpact && (
                    <div className="rounded-2xl border-2 border-accent/40 bg-accent-soft/30 p-5 text-left space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                          <Gift className="w-5 h-5" />
                          <span>Real-Time Orphanage Impact Certificate</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-accent text-on-solid">
                          Verified Impact
                        </span>
                      </div>

                      <p className="text-xs text-body leading-relaxed">
                        Your micro-gift of <strong className="text-accent">{formatRupees(donationAmount)}</strong> has been directly matched with our evening zero-waste redistribution cycle for{' '}
                        <strong>{donationImpact.beneficiary}</strong>.
                      </p>

                      <div className="bg-canvas/80 p-3 rounded-xl border border-hairline text-xs space-y-2">
                        <div className="flex items-center justify-between text-quiet">
                          <span>Children's Meals Sponsored:</span>
                          <span className="text-body font-semibold">{donationImpact.metrics?.mealsSponsored || 1} Fresh Breakfast Meal</span>
                        </div>
                        <div className="flex items-center justify-between text-quiet">
                          <span>Floral Decor Arranged:</span>
                          <span className="text-body font-semibold">{donationImpact.metrics?.bouquetsDonated || 1} Bouquet for Study Hall</span>
                        </div>
                        <div className="flex items-center justify-between text-quiet">
                          <span>Surplus Waste Diverted:</span>
                          <span className="text-success font-semibold">100% Zero-Waste Safe Cycle</span>
                        </div>
                      </div>

                      {/* Reward Coupon Box */}
                      <div className="p-3 bg-panel rounded-xl border border-accent/40 flex items-center justify-between">
                        <div>
                          <p className="text-[10.5px] uppercase tracking-wider text-quiet font-semibold">
                            Your 20% Reward Coupon
                          </p>
                          <p className="font-mono text-sm font-bold text-accent">
                            {donationImpact.rewardCoupon?.code || 'HOPE-BLOOM-20'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyCoupon(donationImpact.rewardCoupon?.code || 'HOPE-BLOOM-20')}
                          className="px-3 py-1.5 rounded-lg bg-accent text-on-solid text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
                        >
                          {copiedCoupon ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCoupon ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const orderId = placedOrder.id;
                        handleClose();
                        openOrderTracker(orderId);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-accent text-on-solid text-xs font-bold flex items-center gap-2 shadow-quiet hover:opacity-90 transition-all"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Track Sovereign Delivery</span>
                    </button>
                    <button
                      onClick={() => {
                        handleClose();
                        setIsOrderHistoryOpen(true);
                      }}
                      className="px-6 py-2.5 rounded-xl border border-hairline text-xs font-semibold text-body hover:bg-recess"
                    >
                      View Order History
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl bg-solid text-on-solid text-xs font-semibold shadow-quiet hover:opacity-90"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
