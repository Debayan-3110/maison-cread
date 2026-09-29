export const USD_TO_INR = 83;
export const GST_RATE = 0.18;
export const FREE_DELIVERY_THRESHOLD = 1999;
export const DELIVERY_FEE = 99;

export const toINR = (usdAmount: number) => usdAmount * USD_TO_INR;

export const formatINR = (usdAmount: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(toINR(usdAmount));

export const formatRupees = (amount: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(amount);

type CartItem = { price: number; quantity: number };
type Coupon = { discountPercent?: number; freeShipping?: boolean } | null | undefined;

export function calculateCartTotals(items: CartItem[], coupon: Coupon) {
  const subtotal = items.reduce((sum, item) => sum + toINR(item.price) * item.quantity, 0);
  const discount = coupon?.discountPercent ? subtotal * (coupon.discountPercent / 100) : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = taxableAmount * GST_RATE;
  const shipping = items.length === 0 || taxableAmount >= FREE_DELIVERY_THRESHOLD || coupon?.freeShipping
    ? 0
    : DELIVERY_FEE;

  return {
    subtotal,
    discount,
    taxableAmount,
    gst,
    shipping,
    total: taxableAmount + gst + shipping,
    deliveryRemaining: Math.max(0, FREE_DELIVERY_THRESHOLD - taxableAmount),
  };
}
