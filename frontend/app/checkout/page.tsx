'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/commerce/CartProvider';
import OrderSuccessModal from '@/components/commerce/OrderSuccessModal';
import PaymentSelector, { PaymentMethodType } from '@/components/commerce/PaymentSelector';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pinCode: string;
  notes: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('full_online');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    pinCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('BC-DEMO-1042');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Financial calculations
  const subtotal = getSubtotal();
  const onlineDiscount = paymentMethod === 'full_online' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - onlineDiscount;
  const payNowAmount = paymentMethod === 'full_online' ? total : Math.round(subtotal * 0.5);
  const codAmount = paymentMethod === 'hybrid' ? subtotal - payNowAmount : 0;

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    // Allows letters, spaces, hyphens, apostrophes — covers Indian names and states
    const nameRegex = /^[A-Za-z][A-Za-z\s'\-]*$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pinRegex = /^\d{6}$/;

    if (formData.firstName.trim().length < 2 || !nameRegex.test(formData.firstName.trim())) newErrors.firstName = 'Enter a valid first name (letters only, min 2 chars)';
    if (formData.lastName.trim().length < 2 || !nameRegex.test(formData.lastName.trim())) newErrors.lastName = 'Enter a valid last name (letters only, min 2 chars)';
    // Strip spaces, dashes and common Indian prefixes (+91, 91, 0) before checking
    const normalizedPhone = formData.phone.replace(/[\s\-().+]/g, '').replace(/^(91|0)/, '');
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) newErrors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 98765 43210)';
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.address.trim().length < 8) newErrors.address = 'Address must be at least 8 characters';
    if (formData.city.trim().length < 2 || !nameRegex.test(formData.city.trim())) newErrors.city = 'Enter a valid city name';
    if (formData.state.trim().length < 2 || !nameRegex.test(formData.state.trim())) newErrors.state = 'Enter a valid state name';
    if (!pinRegex.test(formData.pinCode.trim())) newErrors.pinCode = 'PIN Code must be exactly 6 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueToReview = () => {
    if (validateStep1()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setIsPlacingOrder(true);

    window.setTimeout(() => {
      setGeneratedOrderNumber('BC-DEMO-PREVIEW');
      setIsSuccessModalOpen(true);
      setIsPlacingOrder(false);
      clearCart();
    }, 250);
  };

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-lg lg:px-xxl w-full pt-section-desktop pb-section-desktop">
        {/* Navigation Breadcrumb & Stepper */}
        <div className="mb-xl flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <Link
            href="/cart"
            className="font-label-sm text-on-surface-muted hover:text-primary uppercase flex items-center gap-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to bag
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`font-label-sm text-xs uppercase px-4 py-1.5 border rounded-full transition-colors cursor-pointer ${
                step === 1
                  ? 'bg-primary text-on-primary border-primary font-semibold'
                  : 'bg-surface-container text-on-surface hover:text-primary border-border'
              }`}
            >
              01 Delivery
            </button>
            <span className="text-on-surface-muted text-xs">→</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className={`font-label-sm text-xs uppercase px-4 py-1.5 border rounded-full transition-colors cursor-pointer ${
                step === 2
                  ? 'bg-primary text-on-primary border-primary font-semibold'
                  : 'bg-surface-container text-on-surface-muted hover:text-primary border-border'
              }`}
            >
              02 Payment
            </button>
            <span className="text-on-surface-muted text-xs">→</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(3);
              }}
              className={`font-label-sm text-xs uppercase px-4 py-1.5 border rounded-full transition-colors cursor-pointer ${
                step === 3
                  ? 'bg-primary text-on-primary border-primary font-semibold'
                  : 'bg-surface-container text-on-surface-muted border-border'
              }`}
            >
              03 Review
            </button>
          </div>
        </div>

        {items.length === 0 && !isSuccessModalOpen ? (
          /* Empty Bag State at Checkout */
          <div className="p-xxl text-center border border-border bg-surface-container-low rounded-xl max-w-xl mx-auto">
            <span className="material-symbols-outlined text-4xl text-on-surface-muted mb-md block">
              shopping_bag
            </span>
            <h2 className="font-headline-sm text-on-surface uppercase tracking-wider mb-sm">
              YOUR BAG IS EMPTY
            </h2>
            <p className="font-body-md text-on-surface-muted italic mb-lg">
              &ldquo;Little things are waiting to be chosen.&rdquo;
            </p>
            <Link
              href="/shop"
              className="inline-block bg-primary text-on-primary font-label-sm uppercase tracking-widest px-8 py-3 rounded hover:bg-primary-container transition-colors shadow-sm"
            >
              EXPLORE THE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl">
            {/* Left Column: Step Content */}
            <div className="lg:col-span-7 flex flex-col gap-xxl">
              {/* STEP 01 — DELIVERY DETAILS */}
              {step === 1 && (
                <form onSubmit={handleContinueToPayment} noValidate className="flex flex-col gap-xl">
                  <div>
                    <div className="flex items-center gap-sm mb-xs">
                      <span className="font-display-lg text-primary text-[28px] leading-none">
                        [01]
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
                        Delivery Details
                      </h2>
                    </div>
                    <p className="font-body-md text-on-surface-muted text-sm italic">
                      Please enter your shipping information carefully.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md gap-y-lg">
                    {/* First Name */}
                    <div className="flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="firstName">
                        First Name *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="e.g. Aditi"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.firstName ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.firstName && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.firstName}
                        </span>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="lastName">
                        Last Name *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="e.g. Sharma"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.lastName ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.lastName && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.lastName}
                        </span>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="phone">
                        Phone Number *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.phone ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.phone && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.phone}
                        </span>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="email">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="e.g. aditi@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.email ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.email && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="address">
                        Address *
                      </label>
                      <input
                        id="address"
                        type="text"
                        placeholder="e.g. 14 Bloom Atelier Lane, Sector 5"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.address ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.address && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.address}
                        </span>
                      )}
                    </div>

                    {/* Apartment / Street */}
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="apartment">
                        Apartment / House / Street
                      </label>
                      <input
                        id="apartment"
                        type="text"
                        placeholder="e.g. Apt 4B, Near Silver Oak Park"
                        value={formData.apartment}
                        onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                        className="w-full bg-transparent border-b border-border py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-xs w-full">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="city">
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                          errors.city ? 'border-error' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.city && (
                        <span className="font-body-md text-[11px] text-error mt-0.5">
                          {errors.city}
                        </span>
                      )}
                    </div>

                    {/* State & PIN Code */}
                    <div className="grid grid-cols-2 gap-md w-full">
                      <div className="flex flex-col gap-xs w-full">
                        <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="state">
                          State *
                        </label>
                        <input
                          id="state"
                          type="text"
                          placeholder="e.g. Maharashtra"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                            errors.state ? 'border-error' : 'border-border focus:border-primary'
                          }`}
                        />
                        {errors.state && (
                          <span className="font-body-md text-[11px] text-error mt-0.5">
                            {errors.state}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-xs w-full">
                        <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="pinCode">
                          PIN Code *
                        </label>
                        <input
                          id="pinCode"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="e.g. 400001"
                          value={formData.pinCode}
                          onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                          className={`w-full bg-transparent border-b py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none transition-colors ${
                            errors.pinCode ? 'border-error' : 'border-border focus:border-primary'
                          }`}
                        />
                        {errors.pinCode && (
                          <span className="font-body-md text-[11px] text-error mt-0.5">
                            {errors.pinCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delivery Notes */}
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-xs w-full mt-2">
                      <label className="font-label-sm text-on-surface uppercase text-xs" htmlFor="notes">
                        Delivery Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={2}
                        placeholder="e.g. Leave with security, include a gift card note..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-transparent border-b border-border py-2 font-body-md text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-md">
                    <button
                      type="submit"
                      className="w-full bg-primary text-on-primary py-4 px-lg rounded font-label-sm uppercase tracking-widest hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all duration-300 flex items-center justify-center gap-sm group cursor-pointer"
                    >
                      CONTINUE TO PAYMENT
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 02 — PAYMENT STEP */}
              {step === 2 && (
                <div className="flex flex-col gap-xl">
                  <div>
                    <div className="flex items-center gap-sm mb-xs">
                      <span className="font-display-lg text-primary text-[28px] leading-none">
                        [02]
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
                        Payment Method
                      </h2>
                    </div>
                    <p className="font-body-md text-on-surface-muted text-sm italic">
                      Choose how you would like to settle your handcrafted order.
                    </p>
                  </div>

                  <PaymentSelector
                    selectedMethod={paymentMethod}
                    onChange={setPaymentMethod}
                    subtotal={subtotal}
                    onlineDiscount={onlineDiscount}
                    payNowAmount={payNowAmount}
                    codAmount={codAmount}
                  />

                  {/* Step 2 Actions */}
                  <div className="flex flex-col sm:flex-row gap-md pt-md">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-transparent text-secondary border border-outline font-label-sm text-xs uppercase tracking-widest py-4 px-6 rounded hover:bg-secondary-container/10 transition-colors text-center cursor-pointer"
                    >
                      BACK TO DELIVERY
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueToReview}
                      className="flex-1 bg-primary text-on-primary py-4 px-lg rounded font-label-sm text-xs uppercase tracking-widest hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all duration-300 flex items-center justify-center gap-sm group shadow-md cursor-pointer"
                    >
                      CONTINUE TO REVIEW
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 03 — ORDER REVIEW */}
              {step === 3 && (
                <div className="flex flex-col gap-xl">
                  <div>
                    <div className="flex items-center gap-sm mb-xs">
                      <span className="font-display-lg text-primary text-[28px] leading-none">
                        [03]
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
                        Order Review
                      </h2>
                    </div>
                    <p className="font-body-md text-on-surface-muted text-sm italic">
                      Review your items, delivery details, and payment breakdown before confirming.
                    </p>
                  </div>

                  {/* ORDER SUMMARY LIST */}
                  <div className="p-lg bg-surface-container-low border border-border flex flex-col gap-md rounded">
                    <span className="font-label-sm uppercase tracking-widest text-on-surface font-semibold text-xs border-b border-border pb-sm">
                      SELECTED CREATIONS
                    </span>

                    <div className="flex flex-col divide-y divide-border/50">
                      {items.map((item) => (
                        <div key={item.productId} className="py-sm first:pt-0 last:pb-0 flex gap-md items-center justify-between">
                          <div className="flex items-center gap-md min-w-0">
                            <div className="relative w-12 h-14 bg-surface-container shrink-0 border border-border overflow-hidden rounded">
                              <Image
                                src={item.image}
                                alt={item.alt}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-headline-sm text-sm text-on-surface truncate">
                                {item.name}
                              </h4>
                              <span className="font-label-sm text-[11px] text-on-surface-muted uppercase">
                                Qty: {item.quantity} × {item.currency}{item.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div className="font-headline-sm text-sm text-on-surface shrink-0">
                            {item.currency}{(item.price * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DELIVERY DETAILS SUMMARY CARD */}
                  <div className="p-lg bg-surface-container-low border border-border flex flex-col gap-md rounded">
                    <div className="flex justify-between items-center border-b border-border pb-sm">
                      <span className="font-label-sm uppercase tracking-widest text-on-surface font-semibold text-xs">
                        DELIVERY DETAILS
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="font-label-sm text-xs text-primary uppercase tracking-wider hover:text-primary-container underline underline-offset-4 decoration-primary cursor-pointer"
                      >
                        EDIT DETAILS
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm font-body-md text-sm text-on-surface">
                      <div>
                        <span className="text-on-surface-muted block text-xs uppercase font-label-sm">Recipient</span>
                        {formData.firstName} {formData.lastName}
                      </div>
                      <div>
                        <span className="text-on-surface-muted block text-xs uppercase font-label-sm">Contact</span>
                        {formData.phone} {formData.email ? `• ${formData.email}` : ''}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-on-surface-muted block text-xs uppercase font-label-sm">Shipping Address</span>
                        {formData.address}
                        {formData.apartment ? `, ${formData.apartment}` : ''}, {formData.city}, {formData.state} — {formData.pinCode}
                      </div>
                      {formData.notes && (
                        <div className="sm:col-span-2 pt-1 border-t border-border/40">
                          <span className="text-on-surface-muted block text-xs uppercase font-label-sm">Delivery Notes</span>
                          <span className="italic">{formData.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAYMENT METHOD SUMMARY CARD */}
                  <div className="p-lg bg-surface-container-low border border-border flex flex-col gap-md rounded">
                    <div className="flex justify-between items-center border-b border-border pb-sm">
                      <span className="font-label-sm uppercase tracking-widest text-on-surface font-semibold text-xs">
                        PAYMENT METHOD
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="font-label-sm text-xs text-primary uppercase tracking-wider hover:text-primary-container underline underline-offset-4 decoration-primary cursor-pointer"
                      >
                        EDIT PAYMENT
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-body-md text-sm">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          {paymentMethod === 'full_online' ? 'credit_card' : 'splitscreen'}
                        </span>
                        <div>
                          <strong className="font-headline-sm text-on-surface">
                            {paymentMethod === 'full_online' ? 'Pay 100% Online' : 'Pay 50% Online + 50% on Delivery'}
                          </strong>
                          <span className="text-xs text-on-surface-muted block">
                            {paymentMethod === 'full_online'
                              ? '10% online savings applied'
                              : `₹${payNowAmount.toLocaleString('en-IN')} now + ₹${codAmount.toLocaleString('en-IN')} on delivery`}
                          </span>
                        </div>
                      </div>

                      {paymentMethod === 'full_online' && (
                        <span className="font-label-sm text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 font-bold self-start sm:self-auto">
                          10% SAVINGS APPLIED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: EDIT or PLACE ORDER */}
                  <div className="flex flex-col sm:flex-row gap-md pt-md">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-transparent text-secondary border border-outline font-label-sm text-xs uppercase tracking-widest py-4 px-6 rounded hover:bg-secondary-container/10 transition-colors text-center cursor-pointer"
                    >
                      CHANGE PAYMENT
                    </button>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder || items.length === 0}
                      className="flex-1 bg-primary text-on-primary py-4 px-lg rounded font-label-sm text-xs uppercase tracking-widest hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all duration-300 flex items-center justify-center gap-sm group shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isPlacingOrder ? 'PLACING ORDER...' : `PLACE ORDER (₹${payNowAmount.toLocaleString('en-IN')})`}
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        check
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 bg-surface-container-low p-lg lg:p-xl rounded border border-border flex flex-col gap-lg shadow-sm">
                <div className="flex justify-between items-baseline border-b border-border pb-sm">
                  <h3 className="font-headline-sm text-on-surface uppercase tracking-wide">ORDER SUMMARY</h3>
                  <span className="font-label-sm text-xs text-on-surface-muted uppercase">
                    {items.length} {items.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>

                {/* Items Mini List */}
                <div className="flex flex-col gap-md max-h-80 overflow-y-auto hidden-scrollbar divide-y divide-border/40">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-md items-center pt-md first:pt-0">
                      <div className="relative w-14 h-16 bg-surface-container shrink-0 border border-border overflow-hidden rounded">
                        <Image
                          src={item.image}
                          alt={item.alt}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline-sm text-sm text-on-surface truncate">
                          {item.name}
                        </h4>
                        <span className="font-label-sm text-[10px] text-on-surface-muted uppercase block">
                          Qty: {item.quantity} × {item.currency}{item.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="font-headline-sm text-sm text-on-surface shrink-0">
                        {item.currency}{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="border-t border-border pt-md flex flex-col gap-sm font-body-md text-sm">
                  <div className="flex justify-between text-on-surface-muted">
                    <span>Subtotal</span>
                    <span className="text-on-surface font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Online discount if 100% online selected */}
                  {onlineDiscount > 0 && (
                    <div className="flex justify-between text-secondary font-medium">
                      <span className="flex items-center gap-1">
                        <span>Online Discount (10%)</span>
                      </span>
                      <span>−₹{onlineDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-on-surface-muted">
                    <span>Shipping</span>
                    <span className="text-secondary uppercase text-xs font-semibold">
                      Calculated / Atelier Standard
                    </span>
                  </div>

                  <div className="flex justify-between font-headline-sm text-lg text-on-surface pt-sm border-t border-border">
                    <span>Total Order</span>
                    <span className="font-headline-md text-xl text-primary font-normal">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Pay Now & Due on Delivery Highlights */}
                  <div className="bg-surface border border-border/80 rounded p-md mt-xs flex flex-col gap-xs text-xs">
                    <div className="flex justify-between items-center text-on-surface">
                      <span className="font-label-sm uppercase tracking-wider text-[11px] font-semibold">
                        Pay Now
                      </span>
                      <span className="font-headline-sm text-base text-primary font-bold">
                        ₹{payNowAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {paymentMethod === 'hybrid' && (
                      <div className="flex justify-between items-center text-on-surface-muted pt-1 border-t border-border/40">
                        <span className="font-label-sm uppercase tracking-wider text-[11px]">
                          Due on Delivery
                        </span>
                        <span className="font-headline-sm text-sm text-on-surface font-medium">
                          ₹{codAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-sm text-on-surface-muted text-xs uppercase pt-xs">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Handmade with care & secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        orderNumber={generatedOrderNumber}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
