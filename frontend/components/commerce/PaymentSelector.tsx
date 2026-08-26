'use client';

import React from 'react';
import {
  calculatePaymentOption,
  type PaymentMethodType,
  type PaymentOptionCalculation,
} from '@/lib/payment-calc';

export type { PaymentMethodType } from '@/lib/payment-calc';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  subtotal: number;
  couponDiscount?: number;
  onlineCalculation?: PaymentOptionCalculation;
  hybridCalculation?: PaymentOptionCalculation;
}

export default function PaymentSelector({
  selectedMethod,
  onChange,
  subtotal,
  couponDiscount = 0,
  onlineCalculation,
  hybridCalculation,
}: PaymentSelectorProps) {
  // Independent calculations for each payment option card
  const onlineCalc =
    onlineCalculation || calculatePaymentOption(subtotal, 'full_online', couponDiscount);
  const hybridCalc =
    hybridCalculation || calculatePaymentOption(subtotal, 'hybrid', couponDiscount);

  return (
    <div className="flex flex-col gap-md">
      {/* Option 1: PAY 100% ONLINE */}
      <label
        htmlFor="payment-full-online"
        className={`relative flex flex-col p-lg rounded border transition-all duration-200 cursor-pointer ${
          selectedMethod === 'full_online'
            ? 'bg-surface-container-low border-primary ring-1 ring-primary shadow-sm'
            : 'bg-surface border-border hover:border-outline/60'
        }`}
      >
        <div className="flex items-start justify-between gap-md mb-sm">
          <div className="flex items-center gap-md">
            <div className="relative flex items-center justify-center">
              <input
                id="payment-full-online"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === 'full_online'}
                onChange={() => onChange('full_online')}
                className="w-4 h-4 text-primary accent-primary focus:ring-primary cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center gap-sm flex-wrap">
                <span className="font-headline-sm text-base text-on-surface uppercase tracking-wide">
                  Pay 100% Online
                </span>
                <span className="font-label-sm text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  10% OFF
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-muted mt-1">
                Instant checkout via UPI, Cards, or Netbanking. Includes exclusive 10% atelier savings.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-headline-md text-lg text-primary font-bold">
              ₹{onlineCalc.total.toLocaleString('en-IN')}
            </div>
            {onlineCalc.onlineDiscount > 0 && (
              <span className="font-label-sm text-[11px] text-on-surface-muted line-through block">
                ₹{onlineCalc.subtotalAfterCoupon.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Breakdown preview pill (Independent Online Calculation) */}
        <div className="mt-sm pt-sm border-t border-border/50 flex flex-wrap items-center justify-between text-xs text-on-surface-muted gap-2 font-body-md">
          <div className="flex items-center gap-xs text-secondary font-medium">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              savings
            </span>
            <span>
              You save ₹{onlineCalc.onlineDiscount.toLocaleString('en-IN')} with 100% online payment
            </span>
          </div>
          <div className="font-label-sm uppercase tracking-wider text-[11px] text-on-surface">
            Pay Now: <strong className="text-primary font-bold">₹{onlineCalc.payNowAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </label>

      {/* Option 2: PAY 50% ONLINE + 50% ON DELIVERY */}
      <label
        htmlFor="payment-hybrid"
        className={`relative flex flex-col p-lg rounded border transition-all duration-200 cursor-pointer ${
          selectedMethod === 'hybrid'
            ? 'bg-surface-container-low border-primary ring-1 ring-primary shadow-sm'
            : 'bg-surface border-border hover:border-outline/60'
        }`}
      >
        <div className="flex items-start justify-between gap-md mb-sm">
          <div className="flex items-center gap-md">
            <div className="relative flex items-center justify-center">
              <input
                id="payment-hybrid"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === 'hybrid'}
                onChange={() => onChange('hybrid')}
                className="w-4 h-4 text-primary accent-primary focus:ring-primary cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center gap-sm flex-wrap">
                <span className="font-headline-sm text-base text-on-surface uppercase tracking-wide">
                  Pay 50% Online + 50% on Delivery
                </span>
                <span className="font-label-sm text-[10px] tracking-widest uppercase px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-border font-medium">
                  Flexible Split
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-muted mt-1">
                Reserve your artisanal order with 50% advance online; settle the remaining 50% at doorstep.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-headline-md text-lg text-on-surface font-bold">
              ₹{hybridCalc.total.toLocaleString('en-IN')}
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-muted block">
              Total Order
            </span>
          </div>
        </div>

        {/* Breakdown preview pill (Independent Hybrid Calculation) */}
        <div className="mt-sm pt-sm border-t border-border/50 flex flex-wrap items-center justify-between text-xs text-on-surface-muted gap-2 font-body-md">
          <div className="flex items-center gap-xs text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">
              local_shipping
            </span>
            <span>
              Due on delivery: <strong className="text-on-surface font-semibold">₹{hybridCalc.dueOnDelivery.toLocaleString('en-IN')}</strong>
            </span>
          </div>
          <div className="font-label-sm uppercase tracking-wider text-[11px] text-on-surface">
            Pay Now: <strong className="text-primary font-bold">₹{hybridCalc.payNowAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </label>

      {/* Editorial reassurance footer */}
      <div className="flex items-center gap-xs text-[11px] text-on-surface-muted/80 font-body-md mt-1 px-1">
        <span className="material-symbols-outlined text-[14px]">
          verified_user
        </span>
        <span>All transactions are encrypted with 256-bit security.</span>
      </div>
    </div>
  );
}
