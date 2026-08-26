export type PaymentMethodType = 'full_online' | 'hybrid';

export interface PaymentOptionCalculation {
  method: PaymentMethodType;
  subtotal: number;
  couponDiscount: number;
  subtotalAfterCoupon: number;
  onlineDiscount: number;
  total: number;
  payNowAmount: number;
  dueOnDelivery: number;
}

/**
 * Pure calculation helper for payment options.
 *
 * Fixed business rules:
 * 1. FULL ONLINE:
 *    - onlineDiscount = 10% of subtotalAfterCoupon (rounded)
 *    - total = subtotalAfterCoupon - onlineDiscount
 *    - payNow = total
 *    - dueOnDelivery = 0
 *
 * 2. HYBRID:
 *    - onlineDiscount = 0
 *    - total = subtotalAfterCoupon
 *    - payNow = 50% of total (rounded)
 *    - dueOnDelivery = total - payNow (guarantees exact sum for odd numbers)
 */
export function calculatePaymentOption(
  subtotal: number,
  method: PaymentMethodType,
  couponDiscount: number = 0
): PaymentOptionCalculation {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const safeCouponDiscount = Math.max(0, Math.min(safeSubtotal, Math.round(couponDiscount)));
  const subtotalAfterCoupon = Math.max(0, safeSubtotal - safeCouponDiscount);

  if (method === 'full_online') {
    const onlineDiscount = Math.round(subtotalAfterCoupon * 0.1);
    const total = Math.max(0, subtotalAfterCoupon - onlineDiscount);
    return {
      method: 'full_online',
      subtotal: safeSubtotal,
      couponDiscount: safeCouponDiscount,
      subtotalAfterCoupon,
      onlineDiscount,
      total,
      payNowAmount: total,
      dueOnDelivery: 0,
    };
  }

  // hybrid (50% online + 50% on delivery)
  const total = subtotalAfterCoupon;
  const payNowAmount = Math.round(total * 0.5);
  const dueOnDelivery = total - payNowAmount;

  return {
    method: 'hybrid',
    subtotal: safeSubtotal,
    couponDiscount: safeCouponDiscount,
    subtotalAfterCoupon,
    onlineDiscount: 0,
    total,
    payNowAmount,
    dueOnDelivery,
  };
}
