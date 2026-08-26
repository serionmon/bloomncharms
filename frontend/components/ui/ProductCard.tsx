import React from 'react';
import Link from 'next/link';
import { Product } from '@/content/products';

interface ProductCardProps {
  product: Product;
  showHoverAction?: boolean;
}

export default function ProductCard({
  product,
  showHoverAction = true,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-md"
    >
      <div className="relative w-full aspect-[4/5] bg-surface-container border border-border overflow-hidden">
        {/* eslint-disable-next-js/no-img-element */}
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          data-alt={product.alt}
          src={product.image}
          alt={product.name}
          loading="lazy"
        />

        {/* Hover Overlay Shade */}
        <div className="absolute inset-0 bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Category / Tag Badge */}
        {product.tag && (
          <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1 border border-border z-10">
            <span className="font-label-sm text-label-sm text-on-surface uppercase">
              {product.tag}
            </span>
          </div>
        )}

        {/* Hover Quick Action */}
        {showHoverAction && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
            <span className="inline-block bg-surface text-on-surface font-label-sm uppercase px-md py-sm border border-border shadow-sm whitespace-nowrap">
              View Details
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex justify-between items-start pt-xs">
        <div className="flex flex-col">
          <h3 className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="font-body-md text-body-md text-on-surface-muted">
              {product.subtitle}
            </p>
          )}
        </div>
        <span className="font-body-md text-body-md text-on-surface">
          ₹{product.price.toLocaleString('en-IN')}
        </span>
      </div>
    </Link>
  );
}
