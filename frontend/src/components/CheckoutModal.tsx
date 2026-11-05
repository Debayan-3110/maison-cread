import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext.tsx';
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
  DollarSign
} from 'lucide-react';
import { Order } from '../types/models';
import { calculateCartTotals, formatRupees } from '../utils/commerce';

interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
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
    setIsOrderHistoryOpen
  } = useShop();

  const [step, setStep] = useState<number>(1); // 1: Shipping, 2: Payment, 3: Success

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

  if (!isCheckoutOpen) return null;

  const totals = calculateCartTotals(cart, appliedCoupon);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await createOrder(
      shipping,
      payment,
      totals.subtotal,
      totals.gst,
      totals.shipping,
      totals.discount,
      totals.total
    );

    setPlacedOrder(order);
    setStep(3);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep(1);
    setPlacedOrder(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto sm:items-center sm:p-6">
      <div className="fixed inset-0 bg-scrim backdrop-blur-[3px]" onClick={handleClose} />

      <div className="card-premium modal-in relative z-10 flex min-h-full w-full flex-col overflow-hidden rounded-none phone-xl:my-8 phone-xl:min-h-0 phone-xl:max-h-[92dvh] phone-xl:rounded-[16px] max-w-2xl bg-canvas text-left">

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline p-4 phone-lg:p-6">
          <div className="min-w-0">
            <p className="eyebrow">Private checkout</p>
            <h2 className="title-editorial mt-2 text-[22px] phone-lg:text-[26px]">
              {step === 3 ? 'Order confirmed' : 'Complete your order'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close checkout"
            className="btn-ghost h-9 w-9 rounded-full p-0"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {step !== 3 && (
          <div className="h-px w-full bg-hairline">
            <div
              className="h-px bg-accent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] phone-lg:space-y-6 phone-lg:p-6 sm:p-8">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4" /> Shipping & Delivery Information
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
                  <label className="text-xs text-quiet font-semibold block mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-recess border border-hairline text-sm text-body focus:border-accent outline-none"
                  />
                </div>
              </div>

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
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handlePlaceOrder} className="space-y-5">
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

              <div className="p-4 rounded-2xl bg-accent-soft border border-hairline flex justify-between items-center text-sm">
                <span className="text-body font-semibold">Total Payment Due:</span>
                <span className="text-xl font-semibold text-success">{formatRupees(totals.total)}</span>
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
                  className="px-6 py-3 rounded-xl bg-solid text-on-solid font-semibold text-xs shadow-quiet flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Place Order Now
                </button>
              </div>
            </form>
          )}

          {step === 3 && placedOrder && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-hairline shadow-scrim">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-widest text-success uppercase">
                  Thank You For Your Order!
                </span>
                <h3 className="text-2xl font-semibold text-body mt-1">Order #{placedOrder.id}</h3>
                <p className="text-xs text-quiet mt-1">
                  Confirmation email dispatched to <span className="text-accent font-semibold">{placedOrder.shippingInfo.email}</span>
                </p>
              </div>

              <div className="card-premium p-4 border border-hairline text-left space-y-3 text-xs text-body">
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-accent">{placedOrder.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span>Lest Items Purchased</span>
                  <span className="font-bold text-body">{placedOrder.items.length} product(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount Paid</span>
                  <span className="font-bold text-success">{formatRupees(placedOrder.summary.total)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    setIsOrderHistoryOpen(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-solid hover:opacity-90 text-on-solid font-bold text-xs shadow-quiet"
                >
                  Track Order in Dashboard
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl bg-recess hover:bg-recess text-body font-bold text-xs"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
