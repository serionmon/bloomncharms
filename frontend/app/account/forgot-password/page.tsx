'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (values: ForgotValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });

    if (error) {
      setError('root', { message: error.message });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop flex items-center justify-center">
        <div className="max-w-md w-full border border-border bg-surface-container-lowest p-xl text-center">
          <span className="mb-md block font-label-sm text-xs uppercase tracking-widest text-primary">
            Email Sent
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
            Check your inbox.
          </h1>
          <p className="mt-md font-body-md text-body-md text-on-surface-muted">
            If an account exists for that address, you&apos;ll receive a password reset link shortly.
          </p>
          <Link
            href="/account/sign-in"
            className="mt-xl inline-block bg-primary px-lg py-md font-label-sm text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop flex items-center justify-center">
      <div className="w-full max-w-md">
        <span className="mb-sm block font-label-sm text-xs uppercase tracking-widest text-primary">
          Bloomncharms Account
        </span>
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
          Reset your password.
        </h1>
        <p className="mt-md font-body-md text-body-md italic text-on-surface-muted">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

        <section className="mt-xl border border-border bg-surface-container-lowest">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg p-lg lg:p-xl" noValidate>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                Email
              </span>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.email && (
                <span className="text-xs text-red-600">{errors.email.message}</span>
              )}
            </label>

            {errors.root && (
              <p className="border border-red-200 bg-red-50 p-md font-body-md text-sm text-red-700">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary px-lg py-md font-label-sm text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <div className="border-t border-border p-lg">
            <Link
              href="/account/sign-in"
              className="font-label-sm text-xs uppercase tracking-widest text-primary hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
