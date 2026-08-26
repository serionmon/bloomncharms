'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inventory', href: '/admin/inventory', icon: 'inventory_2' },
    { name: 'Discounts', href: '/admin/discounts', icon: 'local_offer' },
  ];

  return (
    <header className="border-b border-border bg-surface-container-low px-lg py-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-headline-sm text-sm uppercase tracking-widest text-on-surface hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Storefront
          </Link>
          <span className="text-border">|</span>
          <span className="font-label-sm text-xs uppercase tracking-widest text-primary font-bold">
            Atelier Management Console
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-xs font-label-sm uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
