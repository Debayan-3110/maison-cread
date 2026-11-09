/**
 * Indian Commerce & Statutory Dual GST Calculation Engine.
 * Implements compliant CGST (Central GST) and SGST (State GST) dual-taxation calculations
 * under the Central Goods and Services Tax Act, 2017 & State GST Acts.
 * All amounts are natively in Indian Rupees (INR, ₹).
 */

export const GST_RATE = 0.18; // Combined 18% standard rate
export const CGST_RATE = 0.09; // Central GST (9%)
export const SGST_RATE = 0.09; // State GST / UTGST (9%)
export const FREE_DELIVERY_THRESHOLD = 1999; // Free white-glove delivery over ₹1,999
export const DELIVERY_FEE = 99;

/**
 * Currency conversion identity: All prices in the system are natively in INR (₹).
 */
export const toINR = (amount: number) => amount;

/**
 * Standard Indian Rupee (₹) currency formatter using the Indian numbering system
 * (e.g., ₹1,49,999 or ₹2,499).
 */
export const formatINR = (inrAmount: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(inrAmount || 0);

export const formatRupees = formatINR;

export type CartItem = {
  price: number;
  quantity: number;
  category?: string;
  hsnCode?: string;
};

export type Coupon = {
  discountPercent?: number;
  freeShipping?: boolean;
} | null | undefined;

export interface GSTBreakdown {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  cgstRate: number;
  sgstRate: number;
  gst: number;
  shipping: number;
  total: number;
  deliveryRemaining: number;
  sellerGstin: string;
  supplierState: string;
}

/**
 * Calculates cart totals and statutory Indian GST with itemized CGST + SGST breakdown.
 */
export function calculateCartTotals(items: CartItem[], coupon: Coupon): GSTBreakdown {
  // 1. Calculate raw subtotal directly in INR
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  // 2. Privilege / coupon discount
  const discount = coupon?.discountPercent ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0;

  // 3. Taxable value under Section 15 of CGST Act
  const taxableAmount = Math.max(0, subtotal - discount);

  // 4. Statutory Dual GST: 50% CGST + 50% SGST
  const cgst = Math.round(taxableAmount * CGST_RATE * 100) / 100;
  const sgst = Math.round(taxableAmount * SGST_RATE * 100) / 100;
  const gst = Math.round((cgst + sgst) * 100) / 100;

  // 5. Compliant delivery fee
  const shipping = items.length === 0 || taxableAmount >= FREE_DELIVERY_THRESHOLD || coupon?.freeShipping
    ? 0
    : DELIVERY_FEE;

  return {
    subtotal,
    discount,
    taxableAmount,
    cgst,
    sgst,
    cgstRate: 9,
    sgstRate: 9,
    gst,
    shipping,
    total: taxableAmount + gst + shipping,
    deliveryRemaining: Math.max(0, FREE_DELIVERY_THRESHOLD - taxableAmount),
    sellerGstin: '29AABCS1429B1Z8',
    supplierState: '29-Karnataka',
  };
}
