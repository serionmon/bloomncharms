'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const createSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required.').max(50),
    last_name: z.string().min(1, 'Last name is required.').max(50),
    email: z.string().email('Please enter a valid email address.'),
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

type CreateValues = z.infer<typeof createSchema>;

export default function CreateAccountPage() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = async (values: CreateValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Passed to raw_user_meta_data — picked up by handle_new_user DB trigger
        data: {
          first_name: values.first_name,
          last_name: values.last_name,
        },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setError('email', {
          message: 'An account with this email already exists. Please sign in.',
        });
      } else {
        setError('root', { message: error.message });
      }
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop flex items-center justify-center">
        <div className="max-w-md w-full border border-border bg-surface-container-lowest p-xl text-center">
          <span className="mb-md block font-label-sm text-xs uppercase tracking-widest text-primary">
            Account Created
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
            Check your inbox.
          </h1>
          <p className="mt-md font-body-md text-body-md text-on-surface-muted">
            We&apos;ve sent a confirmation email. Follow the link to activate your account, then sign in.
          </p>
          <Link
            href="/account/sign-in"
            className="mt-xl inline-block bg-primary px-lg py-md font-label-sm text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

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
            Create an account to manage your profile and follow every Bloomncharms order from atelier to delivery.
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

        {/* Right — Create Account Form */}
        <section className="border border-border bg-surface-container-lowest lg:col-span-5">
          {/* Tab row */}
          <div className="flex border-b border-border">
            <Link
              href="/account/sign-in"
              className="flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest text-on-surface-muted text-center hover:text-on-surface"
            >
              Sign In
            </Link>
            <Link
              href="/account/create"
              className="flex-1 px-md py-md font-label-sm text-xs uppercase tracking-widest border-b-2 border-primary text-primary text-center"
            >
              Create Account
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg p-lg lg:p-xl" noValidate>
            {/* First Name */}
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                First Name
              </span>
              <input
                {...register('first_name')}
                autoComplete="given-name"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.first_name && (
                <span className="text-xs text-red-600">{errors.first_name.message}</span>
              )}
            </label>

            {/* Last Name */}
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                Last Name
              </span>
              <input
                {...register('last_name')}
                autoComplete="family-name"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.last_name && (
                <span className="text-xs text-red-600">{errors.last_name.message}</span>
              )}
            </label>

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
                autoComplete="new-password"
                className="border-b border-border bg-transparent py-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
              {errors.password && (
                <span className="text-xs text-red-600">{errors.password.message}</span>
              )}
            </label>

            {/* Confirm Password */}
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface">
                Confirm Password
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
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
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
