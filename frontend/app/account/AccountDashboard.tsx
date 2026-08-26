'use client';

import React from 'react';
import Link from 'next/link';
import { type User } from '@supabase/supabase-js';
import { useAuth } from '@/components/auth/AuthProvider';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

interface AccountDashboardProps {
  user: User;
  profile: Profile | null;
}

export default function AccountDashboard({ user, profile }: AccountDashboardProps) {
  const { signOut } = useAuth();

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name || user.email || 'Customer';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop">
      <div className="mx-auto grid w-full max-w-6xl gap-xl lg:grid-cols-12 lg:items-start">
        {/* Left — greeting */}
        <section className="lg:col-span-7">
          <span className="mb-sm block font-label-sm text-xs uppercase tracking-widest text-primary">
            Bloomncharms Account
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:font-display-lg lg:text-display-lg">
            Welcome back, {profile?.first_name || 'there'}.
          </h1>
          <p className="mt-md max-w-2xl font-body-lg text-body-lg italic text-on-surface-muted">
            Manage your profile, track your orders, and get support — all in one place.
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

        {/* Right — profile panel */}
        <section className="border border-border bg-surface-container-lowest lg:col-span-5">
          <div className="border-b border-border px-lg py-md">
            <span className="font-label-sm text-xs uppercase tracking-widest text-primary">
              Signed In
            </span>
          </div>

          <div className="flex flex-col gap-lg p-lg lg:p-xl">
            {/* Name */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface-muted">
                Name
              </span>
              <p className="font-body-md text-body-md text-on-surface">{displayName}</p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface-muted">
                Email
              </span>
              <p className="font-body-md text-body-md text-on-surface">
                {profile?.email || user.email}
              </p>
            </div>

            {/* Member since */}
            {memberSince && (
              <div className="flex flex-col gap-xs">
                <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface-muted">
                  Member Since
                </span>
                <p className="font-body-md text-body-md text-on-surface">{memberSince}</p>
              </div>
            )}

            {/* Orders placeholder */}
            <div className="border border-border bg-background p-md">
              <p className="font-label-sm text-xs uppercase tracking-widest text-on-surface-muted">
                Orders
              </p>
              <p className="mt-xs font-body-md text-body-md text-on-surface-muted italic">
                Order history will be available once the orders backend is connected.
              </p>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={signOut}
              className="border border-border px-lg py-md font-label-sm text-xs uppercase tracking-widest text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              Sign Out
            </button>
          </div>

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
