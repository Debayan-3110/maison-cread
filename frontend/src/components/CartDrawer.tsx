import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Minus, Plus, ArrowRight, Tag, Lock } from 'lucide-react';
import { Product } from '../types/models';
import { calculateCartTotals, formatRupees } from '../utils/commerce';
import { getSafeImageUrl, handleImageError } from '../utils/imageFallback';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
  } = useShop();

  const [couponInput, setCouponInput] = useState<string>('');

  if (!isCartOpen) return null;

  const totals = calculateCartTotals(cart, appliedCoupon);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const success = await applyCoupon(couponInput);
    if (success) setCouponInput('');
  };

  const handleCheckoutTrigger = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const summaryRow = (label: string, value: React.ReactNode, muted = false) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px] text-quiet">{label}</span>
      <span className={`numerals text-[13px] ${muted ? 'text-success' : 'text-body'}`}>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="backdrop-in fixed inset-0 bg-scrim backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 phone-lg:pl-10">
        <aside className="drawer-in flex w-screen max-w-full flex-col justify-between border-l border-hairline bg-canvas text-left shadow-scrim sm:max-w-md">
          {/* Header */}
          <header className="flex items-start justify-between gap-3 border-b border-hairline p-4 pt-[max(1rem,env(safe-area-inset-top))] phone-lg:gap-4 phone-lg:p-6">
            <div className="min-w-0">
              <p className="eyebrow">Your selection</p>
              <h2 className="title-editorial mt-2 text-[22px] phone-lg:text-[26px]">The bag</h2>
              <p className="mt-1 text-[12px] text-quiet">
                {cart.length} {cart.length === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {cart.length > 0 && (
                <button onClick={clearCart} className="link-quiet text-[11.5px] underline underline-offset-4">
                  Empty
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
                className="btn-ghost h-9 w-9 rounded-full p-0"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </div>
          </header>

          {/* Items */}
          <div className="thin-scroll flex-1 overflow-y-auto p-4 phone-lg:p-6">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline">
                  <Lock className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="title-editorial mt-6 text-[22px]">Your bag is quiet</h3>
                <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-quiet">
                  Pieces you choose will rest here until you are ready to complete the order.
                </p>
                <button onClick={() => setIsCartOpen(false)} className="btn-line mt-7 uppercase tracking-[0.14em]">
                  Continue browsing
                </button>
              </div>
            ) : (
              <ul className="space-y-5">
                {cart.map((item: Product & { quantity: number }) => (
                  <li key={item.id} className="flex gap-4 border-b border-hairline pb-5 last:border-0">
                    <div className="frame-still flex h-20 w-20 shrink-0 items-center justify-center p-2">
                      <img
                        src={getSafeImageUrl(item.thumbnail, item.category)}
                        alt={item.title}
                        onError={(e) => handleImageError(e, item.category)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="eyebrow capitalize">{item.category}</p>
                          <h4 className="mt-1.5 truncate text-[13.5px] text-body">{item.title}</h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.title}`}
                          className="btn-ghost h-7 w-7 shrink-0 rounded-full p-0"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-hairline">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="p-2 text-quiet transition-colors hover:text-body"
                          >
                            <Minus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                          <span className="numerals w-7 text-center text-[12.5px] text-body">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="p-2 text-quiet transition-colors hover:text-body"
                          >
                            <Plus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        </div>
                        <span className="numerals text-[13.5px] text-body">{formatRupees(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <footer className="space-y-4 border-t border-hairline p-4 pb-[max(1rem,env(safe-area-inset-bottom))] phone-lg:space-y-5 phone-lg:p-6">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-[10px] border border-hairline bg-accent-soft px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[12px] text-success">
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {appliedCoupon.description} ({appliedCoupon.code})
                  </span>
                  <button onClick={removeCoupon} className="text-[11.5px] text-[#9B3B22] underline underline-offset-4">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promotion code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    aria-label="Promotion code"
                    className="field"
                  />
                  <button type="submit" className="btn-line shrink-0 px-5 py-2.5 text-[11.5px] uppercase tracking-[0.14em]">
                    Apply
                  </button>
                </form>
              )}

              <div className="border-t border-hairline pt-3 space-y-0.5">
                {summaryRow('Taxable Subtotal', formatRupees(totals.taxableAmount))}
                {totals.discount > 0 && summaryRow('Privilege Discount', `-${formatRupees(totals.discount)}`, true)}
                {summaryRow(`Central GST (CGST @ ${totals.cgstRate}%)`, formatRupees(totals.cgst))}
                {summaryRow(`State GST (SGST @ ${totals.sgstRate}%)`, formatRupees(totals.sgst))}
                {summaryRow('White-Glove Delivery', totals.shipping === 0 ? 'Complimentary' : formatRupees(totals.shipping), totals.shipping === 0)}
              </div>

              <div className="flex items-end justify-between border-t border-hairline pt-4">
                <span className="eyebrow">Total due</span>
                <span className="numerals font-display text-[26px] leading-none text-body">{formatRupees(totals.total)}</span>
              </div>

              <button onClick={handleCheckoutTrigger} className="btn-solid w-full uppercase tracking-[0.14em]">
                <Lock className="h-4 w-4" strokeWidth={1.5} />
                Secure checkout
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </footer>
          )}
        </aside>
      </div>
    </div>
  );
}