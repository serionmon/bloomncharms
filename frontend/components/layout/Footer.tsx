import React from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low border-t border-border pt-section-desktop pb-xl">
      <div className="max-w-7xl mx-auto px-lg lg:px-xxl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-xl mb-xxl">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 pr-xl">
            <div className="mb-md">
              <BrandLogo size="footer" />
            </div>
            <p className="font-body-md text-on-surface-muted italic mb-lg">
              Handmade flowers, keyrings, charms and thoughtful gifts — made to mean more.
            </p>
            <div className="flex gap-md">
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <span className="material-symbols-outlined text-[20px]">camera</span>
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="/shop"
                aria-label="Share Collection"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div className="flex flex-col gap-md">
            <h4 className="font-label-sm text-on-surface uppercase font-bold">Shop</h4>
            <nav className="flex flex-col gap-sm">
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/shop">
                All Products
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/bouquets">
                Bouquets
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/keyrings">
                Keyrings
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/shop?category=charms">
                Charms
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/shop?category=flowers">
                Flowers
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/shop?category=gift-sets">
                Gift Sets
              </Link>
            </nav>
          </div>

          {/* Discover Column */}
          <div className="flex flex-col gap-md">
            <h4 className="font-label-sm text-on-surface uppercase font-bold">Discover</h4>
            <nav className="flex flex-col gap-sm">
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/our-story">
                Our Story
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/custom">
                Custom Orders
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/shop">
                Gift Guide
              </Link>
            </nav>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-md">
            <h4 className="font-label-sm text-on-surface uppercase font-bold">Support</h4>
            <nav className="flex flex-col gap-sm">
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/track-order">
                Contact &amp; FAQ
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/track-order">
                Shipping
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/track-order">
                Returns
              </Link>
            </nav>
          </div>

          {/* Account Column */}
          <div className="flex flex-col gap-md">
            <h4 className="font-label-sm text-on-surface uppercase font-bold">Account</h4>
            <nav className="flex flex-col gap-sm">
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/track-order">
                Track Order
              </Link>
              <Link className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="/cart">
                My Cart
              </Link>
            </nav>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="border-t border-border pt-xl flex flex-col md:flex-row justify-between items-center gap-md">
          <p className="font-label-sm text-on-surface-muted">
            © 2026 Bloomncharms. Handcrafted with love.
          </p>
          <nav className="flex gap-lg">
            <Link className="font-label-sm text-on-surface-muted hover:text-on-surface uppercase" href="/support">
              Privacy
            </Link>
            <Link className="font-label-sm text-on-surface-muted hover:text-on-surface uppercase" href="/support">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
