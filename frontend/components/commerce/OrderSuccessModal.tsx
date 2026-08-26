'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
}

export default function OrderSuccessModal({
  isOpen,
  orderNumber,
  onClose,
}: OrderSuccessModalProps) {
  const router = useRouter();

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinueShopping = () => {
    onClose();
    router.push('/shop');
  };

  const handleViewOrder = () => {
    onClose();
    router.push('/track-order');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-surface border border-border p-8 sm:p-12 shadow-2xl animate-in zoom-in-95 duration-300 text-center flex flex-col items-center">
        {/* Editorial Icon Stamp */}
        <div className="w-16 h-16 rounded-full bg-surface-container-highest border border-border flex items-center justify-center mb-6 text-primary">
          <span className="material-symbols-outlined text-[32px]">
            check_circle
          </span>
        </div>

        <span className="font-label-sm text-xs text-primary uppercase tracking-widest mb-2 block font-semibold">
          ORDER RECEIVED
        </span>

        <h2
          id="success-modal-title"
          className="font-display-lg text-3xl sm:text-4xl text-on-surface uppercase tracking-tight mb-4"
        >
          Thank you for choosing Bloomncharms.
        </h2>

        <p className="font-body-lg text-on-surface-variant italic mb-6 max-w-md">
          &ldquo;Your little things are being prepared with care.&rdquo;
        </p>

        {/* Order Details Card */}
        <div className="w-full bg-surface-container-low border border-border py-4 px-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-label-sm uppercase tracking-widest text-on-surface-muted text-xs">
            Demo Order Number:
          </span>
          <span className="font-mono text-base font-bold text-primary tracking-wider">
            {orderNumber}
          </span>
        </div>

        <p className="font-body-md text-xs text-on-surface-muted mb-8 max-w-sm">
          * Frontend demonstration. No real order has been created on a server or payment processed.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleContinueShopping}
            className="flex-1 bg-primary text-on-primary font-label-sm text-xs uppercase tracking-widest py-4 px-6 rounded hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-colors shadow-sm text-center cursor-pointer"
          >
            CONTINUE SHOPPING
          </button>
          <button
            type="button"
            onClick={handleViewOrder}
            className="flex-1 bg-transparent text-secondary border border-outline font-label-sm text-xs uppercase tracking-widest py-4 px-6 rounded hover:bg-secondary-container/10 focus-visible:ring-1 focus-visible:ring-secondary outline-none transition-colors text-center cursor-pointer"
          >
            VIEW ORDER
          </button>
        </div>
      </div>
    </div>
  );
}
