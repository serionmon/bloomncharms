'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Mode = 'signin' | 'create';

export default function AccountPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [submitted, setSubmitted] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setSubmitted(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop">
      <div className="mx-auto grid w-full max-w-6xl gap-xl lg:grid-cols-12 lg:items-start">
        <section className="lg:col-span-7">
          <span className="mb-sm block font-label-sm text-xs uppercase tracking-widest text-primary">
            Bloomncharms Account
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:font-display-lg lg:text-display-lg">
            Your handmade moments, in one place.
          </h1>
          <p className="mt-md max-w-2xl font-body-lg text-body-lg italic text-on-surface-muted">
            Sign in to manage your profile and, once the backend is connected, follow every Bloomncharms order from atelier to delivery.
          </p>

          <div className="mt-xl grid gap-md sm:grid-cols-3">
            {[
              ['Profile', 'Your details and saved delivery information.'],
              ['Orders', 'A private history of your Bloomncharms purchases.'],
              ['Support', 'Help with orders, returns and custom pieces.'],
            ].map(([title, description]) => (
              <div key={title} className="border border-border bg-surface-container-lowest p-lg">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
                <p className="mt-sm font-body-md text-body-md text-on-surface-muted">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border bg-surface-container-lowest lg:col-span-5">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest ${
                mode === 'signin' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-muted'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest ${
                mode === 'create' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-muted'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg p-lg lg:p-xl">
            {mode === 'create' && (
              <label className="flex flex-col gap-xs">
                <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">Full Name</span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
                />
              </label>
            )}

            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">Password</span>
              <input
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
            </label>

            {mode === 'create' && (
              <label className="flex flex-col gap-xs">
                <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">Confirm Password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
                />
              </label>
            )}

            <button
              type="submit"
              className="bg-primary px-lg py-md font-label-sm text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            {submitted && (
              <p className="border border-secondary/40 bg-secondary-container/30 p-md font-body-md text-sm text-on-surface">
                Account services are prepared in the UI. Authentication, sessions and private order history will be connected in the backend phase.
              </p>
            )}
          </form>

          <div className="border-t border-border p-lg">
            <Link
              href="/shop"
              className="font-label-sm text-xs uppercase tracking-widest text-primary hover:underline"
            >
              Continue shopping →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
