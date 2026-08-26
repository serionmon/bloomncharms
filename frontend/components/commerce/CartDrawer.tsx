'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    incrementItem,
    decrementItem,
    getItemCount,
    getSubtotal,
  } = useCart();

  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleProceedToCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  const handleExplore = () => {
    closeDrawer();
    router.push('/shop');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full sm:max-w-[460px] h-full bg-background border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-lg border-b border-border flex items-center justify-between bg-surface">
          <div>
            <h2
              id="cart-drawer-title"
              className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wide"
            >
              Your Bag
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-muted uppercase tracking-widest block mt-0.5">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close bag"
            className="p-sm text-on-surface hover:text-primary focus-visible:ring-1 focus-visible:ring-primary outline-none transition-colors flex items-center justify-center rounded"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto hidden-scrollbar p-lg flex flex-col">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-xxl">
              <span className="material-symbols-outlined text-[48px] text-on-surface-muted/60 mb-md">
                shopping_bag
              </span>
              <h3 className="font-headline-sm text-on-surface uppercase tracking-wider mb-xs">
                YOUR BAG IS EMPTY
              </h3>
              <p className="font-body-md text-on-surface-muted italic mb-xl max-w-xs">
                &ldquo;Little things are waiting to be chosen.&rdquo;
              </p>
              <button
                type="button"
                onClick={handleExplore}
                className="bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest py-3.5 px-8 rounded hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-colors shadow-sm"
              >
                EXPLORE THE COLLECTION
              </button>
            </div>
          ) : (
            /* Cart Items List */
            <div className="flex flex-col divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} className="py-md flex gap-md items-start">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeDrawer}
                    className="relative w-20 h-24 sm:w-24 sm:h-28 bg-surface-container shrink-0 border border-border overflow-hidden rounded group"
                    aria-label={`View ${item.name}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="96px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                    <div>
                      <div className="flex justify-between items-start gap-sm">
                        <span className="font-label-sm text-[10px] text-primary uppercase tracking-widest block">
                          {item.category}
                        </span>
                        <span className="font-headline-sm text-sm sm:text-base text-on-surface font-normal">
                          {item.currency}{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <h4 className="font-headline-sm text-sm sm:text-base text-on-surface leading-tight mt-0.5">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="hover:text-primary transition-colors focus-visible:underline outline-none"
                        >
                          {item.name}
                        </Link>
                      </h4>

                      {item.subtitle && (
                        <p className="font-body-md text-xs text-on-surface-muted line-clamp-1 mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-center border border-border bg-surface-container rounded-full h-8">
                        <button
                          type="button"
                          onClick={() => decrementItem(item.productId)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-7 h-full text-on-surface hover:text-primary focus-visible:ring-1 focus-visible:ring-primary outline-none transition-colors flex items-center justify-center font-body-lg disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="font-body-md text-xs text-on-surface font-medium px-2 select-none" aria-label={`Quantity: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => incrementItem(item.productId)}
                          disabled={Boolean(item.stock && item.quantity >= item.stock)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-7 h-full text-on-surface hover:text-primary focus-visible:ring-1 focus-visible:ring-primary outline-none transition-colors flex items-center justify-center font-body-lg disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-muted hover:text-error focus-visible:ring-1 focus-visible:ring-error outline-none transition-colors underline underline-offset-4 decoration-border hover:decoration-error"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Actions */}
        {items.length > 0 && (
          <div className="p-lg border-t border-border bg-surface flex flex-col gap-md">
            <div className="flex justify-between items-baseline">
              <span className="font-label-sm uppercase tracking-widest text-on-surface">
                Subtotal
              </span>
              <span className="font-headline-md text-xl sm:text-2xl text-on-surface font-normal">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="font-body-md text-xs text-on-surface-muted italic">
              Shipping and final order details will be confirmed at checkout.
            </p>

            <div className="flex flex-col gap-sm mt-1">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest py-4 px-6 rounded hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-colors shadow-sm flex items-center justify-center gap-sm group cursor-pointer"
              >
                PROCEED TO CHECKOUT
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                onClick={closeDrawer}
                className="w-full bg-transparent text-secondary border border-outline font-label-sm text-label-sm uppercase tracking-widest py-3 px-6 rounded hover:bg-secondary-container/10 focus-visible:ring-1 focus-visible:ring-secondary outline-none transition-colors text-center cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
