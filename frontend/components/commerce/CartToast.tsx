'use client';

import React from 'react';
import { useCart } from './CartProvider';

export default function CartToast() {
  const { toast, openDrawer, hideToast } = useCart();

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-surface-container-lowest border border-border px-5 py-4 shadow-lg flex items-center gap-4 max-w-sm">
        <span className="material-symbols-outlined text-primary text-[22px]">
          check_circle
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-label-sm uppercase tracking-widest text-primary text-xs font-semibold">
            {toast.message}
          </span>
          {toast.productName && (
            <span className="font-body-md text-on-surface text-sm truncate">
              {toast.productName}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            hideToast();
            openDrawer();
          }}
          className="font-label-sm text-xs uppercase tracking-wider text-primary border-b border-primary hover:text-primary-container pb-0.5"
        >
          View Bag
        </button>
      </div>
    </div>
  );
}
