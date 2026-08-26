'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/commerce/CartProvider';
import QuantityStepper from '@/components/ui/QuantityStepper';

export default function ShoppingBagPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    getItemCount,
    getSubtotal,
  } = useCart();

  const [paymentOption, setPaymentOption] = useState<'full' | 'split'>('full');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const totalItemCount = getItemCount();
  const subtotal = getSubtotal();
  const discountPercent = paymentOption === 'full' ? 0.1 : 0;
  const discountAmount = subtotal * discountPercent;
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      <div className="px-lg lg:px-xxl py-section-desktop max-w-[1440px] mx-auto w-full relative">
        {/* Header */}
        <div className="mb-xxl flex flex-col md:flex-row md:items-end justify-between gap-lg">
          <div className="relative inline-block group cursor-default">
            <h1 className="font-display-lg text-headline-md text-on-surface lg:text-display-lg tracking-tight inline-block z-10 relative">
              Shopping Bag
            </h1>
            <span className="block font-label-sm text-on-surface-muted uppercase mt-sm tracking-widest relative z-10">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} in your bag
            </span>
          </div>
          <Link
            className="font-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs pb-sm underline underline-offset-4 decoration-border hover:decoration-primary"
            href="/shop"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="p-xxl text-center border border-border bg-surface-container-low rounded-xl">
            <span className="material-symbols-outlined text-4xl text-on-surface-muted mb-md block">
              shopping_bag
            </span>
            <h2 className="font-headline-sm text-on-surface mb-sm">Your shopping bag is empty</h2>
            <p className="font-body-md text-on-surface-muted mb-lg">
              Explore our handmade blooms and charms to start a collection.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-primary text-on-primary font-label-sm uppercase px-8 py-3 rounded-full hover:bg-primary-container transition-colors"
            >
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-xl xl:gap-xxl">
            {/* Cart Items List (Col 1-8) */}
            <div className="xl:col-span-8 flex flex-col gap-lg">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="group relative flex flex-col sm:flex-row gap-lg p-md lg:p-lg bg-surface hover:bg-surface-container transition-colors duration-500 rounded-xl border border-border/40"
                >
                  <div className="w-full sm:w-32 lg:w-48 shrink-0 relative aspect-[4/5] overflow-hidden rounded-lg shadow-sm bg-surface-container">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-surface/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-md">
                      <div className="max-w-[70%]">
                        <span className="inline-block font-label-sm text-primary mb-xs tracking-widest uppercase">
                          {item.category}
                        </span>
                        <h3 className="font-headline-sm text-on-surface leading-tight mb-xs">
                          {item.name}
                        </h3>
                        {item.subtitle && (
                          <p className="font-body-md text-on-surface-muted line-clamp-2">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="font-headline-sm text-on-surface shrink-0">
                        {item.currency}{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-lg">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.stock || 99}
                        onChange={(newQty) => updateQuantity(item.productId, newQty)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="font-label-sm text-on-surface-variant hover:text-error transition-colors uppercase tracking-widest underline underline-offset-4 decoration-border hover:decoration-error"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Sidebar (Col 9-12) */}
            <div className="xl:col-span-4 mt-xl xl:mt-0">
              <div className="sticky top-24 bg-surface-container-low p-lg lg:p-xl rounded-2xl shadow-sm border border-border/40 relative overflow-hidden">
                <h2 className="font-headline-md text-on-surface mb-lg relative z-10">
                  Order Summary
                </h2>
                <div className="flex flex-col gap-md font-body-md text-on-surface-muted relative z-10">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({totalItemCount} items)</span>
                    <span className="text-on-surface font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-md border-b border-border/40">
                    <span className="flex items-center gap-xs">
                      Shipping
                      <span className="material-symbols-outlined text-[16px] cursor-help" title="Calculated at checkout">
                        info
                      </span>
                    </span>
                    <span className="text-on-surface italic">Calculated at checkout</span>
                  </div>

                  {/* Promo Code Input */}
                  <div className="py-sm">
                    <div className="relative group">
                      <input
                        className="w-full bg-surface py-3 px-4 rounded-lg outline-none text-on-surface placeholder:text-on-surface-muted/50 border border-border/50 focus:border-primary/50 transition-colors shadow-sm font-body-md"
                        placeholder="Promo code or Gift Card"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setPromoApplied(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 font-label-sm text-primary uppercase tracking-widest px-sm hover:text-primary-container transition-colors"
                      >
                        {promoApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-end pt-md">
                    <span className="font-headline-sm text-on-surface">Total</span>
                    <div className="text-right">
                      <span className="font-label-sm text-on-surface-muted block mb-xs uppercase">
                        INR (₹)
                      </span>
                      <span className="font-display-lg-mobile text-on-surface leading-none block">
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Offers Callouts */}
                <div className="mt-xl flex flex-col gap-sm relative z-10">
                  {/* Option 1: Pay Full Online */}
                  <label
                    onClick={() => setPaymentOption('full')}
                    className={`group relative flex items-start gap-md p-md rounded-xl bg-surface border transition-all cursor-pointer shadow-sm ${
                      paymentOption === 'full'
                        ? 'border-primary/40 bg-surface-bright'
                        : 'border-border/40 hover:bg-surface-bright'
                    }`}
                  >
                    <div className="pt-1">
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center relative">
                        {paymentOption === 'full' && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-label-sm text-primary uppercase block mb-xs">
                        Pay Full Online
                      </span>
                      <p className="font-body-md text-on-surface leading-tight mb-1">
                        Get 10% OFF instantly
                      </p>
                      <span className="font-label-sm text-on-surface-muted">
                        New total: ₹{(subtotal * 0.9).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Split Payment */}
                  <label
                    onClick={() => setPaymentOption('split')}
                    className={`group relative flex items-start gap-md p-md rounded-xl bg-surface border transition-all cursor-pointer shadow-sm ${
                      paymentOption === 'split'
                        ? 'border-secondary/40 bg-surface-bright'
                        : 'border-border/40 hover:bg-surface-bright opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="pt-1">
                      <div className="w-4 h-4 rounded-full border-2 border-on-surface-muted flex items-center justify-center relative">
                        {paymentOption === 'split' && (
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-label-sm text-secondary uppercase block mb-xs">
                        Split Payment
                      </span>
                      <p className="font-body-md text-on-surface leading-tight">
                        Pay 50% online + 50% on delivery
                      </p>
                    </div>
                  </label>
                </div>

                {/* Primary CTA */}
                <div className="mt-xl relative z-10">
                  <button
                    type="button"
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-primary text-on-primary py-4 px-lg rounded-full font-label-sm uppercase tracking-widest hover:bg-primary-container hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-sm group"
                  >
                    Continue to checkout
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                  <div className="mt-md flex items-center justify-center gap-md opacity-60">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span className="font-label-sm text-on-surface-muted uppercase">
                      Secure SSL Checkout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
