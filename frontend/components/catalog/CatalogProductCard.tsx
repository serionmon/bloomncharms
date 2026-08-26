'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, getStockStatus } from '@/content/products';
import { useCart } from '@/components/commerce/CartProvider';

interface CatalogProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function CatalogProductCard({
  product,
  priority = false,
}: CatalogProductCardProps) {
  const { addItem } = useCart();
  const stockInfo = getStockStatus(product.stock, product.available);

  return (
    <article className="group flex flex-col h-full bg-surface-container-lowest border border-border transition-all duration-300 hover:border-primary/40">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View details for ${product.name}`}
        className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden block"
      >
        <Image
          src={product.image}
          alt={product.alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges: Category / Tag / Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-xs pointer-events-none z-10">
          <span className="font-label-sm text-[10px] sm:text-label-sm uppercase tracking-widest text-on-surface bg-surface/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 border border-border">
            {product.category}
          </span>
          {product.badge && (
            <span className="font-label-sm text-[10px] sm:text-label-sm uppercase tracking-widest text-primary bg-surface/95 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 border border-primary/30">
              {product.badge}
            </span>
          )}
        </div>

        {/* Quick View Details Button on Hover (Desktop) */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden sm:flex justify-center z-10 pointer-events-none">
          <span className="w-full text-center bg-surface/95 text-on-surface font-label-sm text-label-sm uppercase tracking-widest py-2 px-3 border border-border shadow-sm group-hover:border-primary transition-colors">
            View Details
          </span>
        </div>
      </Link>

      {/* Card Info Section */}
      <div className="p-3 sm:p-md flex flex-col justify-between flex-1 gap-xs sm:gap-sm">
        <div>
          {/* Subtitle / Category Note */}
          {product.subtitle && (
            <p className="font-body-md text-xs sm:text-sm text-on-surface-muted line-clamp-1 mb-0.5 sm:mb-1">
              {product.subtitle}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-headline-sm text-base sm:text-lg text-on-surface font-normal leading-tight group-hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Bottom Metadata: Price & Stock Status */}
        <div className="pt-2 sm:pt-sm border-t border-border mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1">
            <span className="font-headline-sm text-base sm:text-lg text-on-surface font-normal">
              {product.currency}{product.price.toLocaleString('en-IN')}
            </span>
            <span
              className={`font-label-sm text-[10px] sm:text-xs uppercase tracking-wider px-1.5 py-0.5 border ${stockInfo.className}`}
            >
              {stockInfo.label}
            </span>
          </div>

          {/* Explicit View Details Link for Mobile & Accessibility */}
          <Link
            href={`/products/${product.slug}`}
            className="w-full text-center sm:hidden bg-surface-container-low hover:bg-surface text-on-surface font-label-sm text-[11px] uppercase tracking-widest py-2 px-2 border border-border transition-colors mt-1"
          >
            View Details
          </Link>
          <button
            type="button"
            disabled={!product.available || product.stock <= 0}
            onClick={() => addItem(product)}
            className="w-full border border-primary bg-primary px-2 py-2 font-label-sm text-[11px] uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-container disabled:text-on-surface-muted"
          >
            {product.available && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
