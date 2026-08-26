'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Must contain at least one number.'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    const supabase = createClient();

    // Supabase fires PASSWORD_RECOVERY when the user lands from the reset email link.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if already in a session (e.g. user is already signed in via recovery token).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (values: ResetValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setError('root', { message: error.message });
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/account'), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop flex items-center justify-center">
        <div className="max-w-md w-full border border-border bg-surface-container-lowest p-xl text-center">
          <span className="mb-md block font-label-sm text-xs uppercase tracking-widest text-primary">
            Password Updated
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
            All done.
          </h1>
          <p className="mt-md font-body-md text-body-md text-on-surface-muted">
            Your password has been updated. Redirecting to your account…
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-body-md text-body-md text-on-surface-muted">
            Verifying reset link…
          </p>
          <p className="mt-sm font-label-sm text-xs text-on-surface-muted">
            If you arrived here by mistake,{' '}
            <Link href="/account/sign-in" className="text-primary hover:underline">
              go to sign in
            </Link>
            .
          </p>
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
          Set a new password.
        </h1>

        <section className="mt-xl border border-border bg-surface-container-lowest">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg p-lg lg:p-xl" noValidate>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                New Password
              </span>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.password && (
                <span className="text-xs text-red-600">{errors.password.message}</span>
              )}
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                Confirm New Password
              </span>
              <input
                {...register('confirm_password')}
                type="password"
                autoComplete="new-password"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.confirm_password && (
                <span className="text-xs text-red-600">{errors.confirm_password.message}</span>
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
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
