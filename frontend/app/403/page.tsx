import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Access Restricted — 403',
  description: 'Administrator privileges are required to access this area.',
};

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-lg py-xxl text-center bg-background text-on-surface">
      <div className="max-w-md w-full flex flex-col items-center gap-md p-xl border border-border rounded bg-surface shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <span className="material-symbols-outlined text-[24px]">lock</span>
        </div>

        <div>
          <span className="font-label-sm text-xs text-primary uppercase tracking-widest font-bold block mb-1">
            Access Restricted — 403
          </span>
          <h1 className="font-headline-md text-2xl uppercase tracking-wide text-on-surface">
            Admin Privileges Required
          </h1>
        </div>

        <p className="font-body-md text-xs text-on-surface-muted leading-relaxed">
          The requested management section is strictly reserved for authorized atelier administrators. Your current authenticated session does not have administrative access.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-sm w-full pt-sm border-t border-border/60">
          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary-container transition-colors text-center"
          >
            Return to Storefront
          </Link>
          <Link
            href="/account"
            className="w-full py-2.5 px-4 border border-border text-on-surface rounded text-xs font-label-sm uppercase tracking-wider hover:bg-surface-container transition-colors text-center"
          >
            View My Account
          </Link>
        </div>
      </div>
    </div>
  );
}
