'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { useCart } from '@/components/commerce/CartProvider';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openDrawer, getItemCount } = useCart();
  const totalCount = getItemCount();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Bouquets', href: '/bouquets' },
    { name: 'Keyrings', href: '/keyrings' },
    { name: 'Charms', href: '/shop?category=charms' },
    { name: 'Flowers', href: '/shop?category=flowers' },
    { name: 'Gift Sets', href: '/shop?category=gift-sets' },
    { name: 'Custom', href: '/custom' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/shop?category=')) {
      return false;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="h-16 w-full px-lg lg:px-xl flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex-1 flex items-center">
          <BrandLogo size="header" priority />
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-lg absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-label-sm uppercase py-1 transition-colors ${
                  active
                    ? 'text-primary font-medium border-b border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end gap-md">
          <Link
            href="/shop"
            aria-label="Search collection"
            className="p-xs text-on-surface hover:text-primary transition-colors flex items-center"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </Link>

          {/* Account Link */}
          <Link
            href="/account"
            aria-label="Customer Account"
            className="p-xs text-on-surface hover:text-primary transition-colors flex items-center"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>

          {/* Cart Bag Icon & Counter */}
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Shopping Bag, ${totalCount} items`}
            className="p-xs text-on-surface hover:text-primary transition-colors relative flex items-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {totalCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full text-[9px] font-bold flex items-center justify-center text-on-primary">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="xl:hidden p-xs text-on-surface"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface border-b border-border px-lg py-md flex flex-col gap-sm animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-label-sm uppercase py-2 transition-colors ${
                isActive(link.href)
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-border pt-sm mt-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="font-label-sm text-primary uppercase text-xs flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                Sign In / Register
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="font-label-sm text-on-surface-muted uppercase text-xs"
              >
                Track Order
              </Link>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <Link
                href="/our-story"
                onClick={() => setMobileMenuOpen(false)}
                className="font-label-sm text-on-surface-muted uppercase text-xs"
              >
                Our Story
              </Link>
              <Link
                href="/custom"
                onClick={() => setMobileMenuOpen(false)}
                className="font-label-sm text-on-surface-muted uppercase text-xs"
              >
                Custom Inquiries
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
