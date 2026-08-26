import React from 'react';
import Link from 'next/link';
import { Product } from '@/content/products';

interface BouquetCardProps {
  product: Product;
}

export default function BouquetCard({ product }: BouquetCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-surface relative hover:bg-surface-container transition-colors duration-500 overflow-hidden h-[600px] flex flex-col p-md border border-border"
    >
      <div className="flex-1 w-full relative overflow-hidden mb-md border border-border">
        {/* eslint-disable-next-js/no-img-element */}
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          data-alt={product.alt}
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-xs">
          <h3 className="font-body-lg text-on-surface font-normal">
            {product.name}
          </h3>
          {product.subtitle && (
            <span className="font-label-sm text-on-surface-muted">
              {product.subtitle}
            </span>
          )}
        </div>
        <span className="font-body-md text-on-surface font-normal">
          ₹{product.price.toLocaleString('en-IN')}
        </span>
      </div>
    </Link>
  );
}
