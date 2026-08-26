'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError('root', {
        message:
          error.message === 'Invalid login credentials'
            ? 'The email or password you entered is incorrect.'
            : error.message,
      });
      return;
    }

    router.push('/account');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop">
      <div className="mx-auto grid w-full max-w-6xl gap-xl lg:grid-cols-12 lg:items-start">
        {/* Left — Brand copy */}
        <section className="lg:col-span-7">
          <span className="mb-sm block font-label-sm text-xs uppercase tracking-widest text-primary">
            Bloomncharms Account
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:font-display-lg lg:text-display-lg">
            Your handmade moments, in one place.
          </h1>
          <p className="mt-md max-w-2xl font-body-lg text-body-lg italic text-on-surface-muted">
            Sign in to manage your profile and follow every Bloomncharms order from atelier to delivery.
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

        {/* Right — Sign In Form */}
        <section className="border border-border bg-surface-container-lowest lg:col-span-5">
          {/* Tab row */}
          <div className="flex border-b border-border">
            <Link
              href="/account/sign-in"
              className="flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest border-b-2 border-primary text-primary text-center"
            >
              Sign In
            </Link>
            <Link
              href="/account/create"
              className="flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest text-on-surface-muted text-center hover:text-on-surface"
            >
              Create Account
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg p-lg lg:p-xl" noValidate>
            {/* Email */}
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

            {/* Password */}
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                Password
              </span>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.password && (
                <span className="text-xs text-red-600">{errors.password.message}</span>
              )}
            </label>

            {/* Root error */}
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
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            <Link
              href="/account/forgot-password"
              className="text-center font-label-sm text-xs uppercase tracking-widest text-primary hover:underline"
            >
              Forgot password?
            </Link>
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
