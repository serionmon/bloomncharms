'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS } from '@/content/products';
import CatalogProductCard from '@/components/catalog/CatalogProductCard';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'bouquets', label: 'Bouquets' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'keyrings', label: 'Keyrings' },
  { id: 'charms', label: 'Charms' },
  { id: 'gift-sets', label: 'Gift Sets' },
  { id: 'custom', label: 'Custom' },
] as const;

type SortOption = 'featured' | 'price-asc' | 'price-desc';

export default function ShopCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return PRODUCTS;
    if (activeCategory === 'custom') return PRODUCTS.filter((product) => product.isCustomizable);
    return PRODUCTS.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    });
  }, [filteredProducts, sortBy]);

  return (
    <div className="min-h-screen w-full bg-background">
      <section className="w-full border-b border-border pb-xl pt-section-mobile lg:pt-section-desktop">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-lg text-center lg:px-xxl">
          <span className="mb-sm font-label-sm text-xs uppercase tracking-widest text-primary">The Collection</span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile uppercase tracking-tight text-on-surface lg:font-display-lg lg:text-display-lg">
            Shop all
          </h1>
          <p className="mx-auto mb-lg mt-sm max-w-md font-body-md text-body-md italic text-on-surface-muted">
            Handmade little things, made to mean more.
          </p>

          <nav aria-label="Product categories" className="mt-lg flex max-w-full gap-md overflow-x-auto hidden-scrollbar">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(category.id)}
                  className={`shrink-0 border-b pb-1 font-label-sm text-xs uppercase tracking-widest transition-colors ${
                    active ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="sticky top-16 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-lg lg:px-xxl">
          <span className="font-label-sm text-xs uppercase tracking-widest text-on-surface-muted">
            {sortedProducts.length} {sortedProducts.length === 1 ? 'Item' : 'Items'}
          </span>

          <label className="flex items-center gap-xs font-label-sm text-xs uppercase tracking-widest text-on-surface">
            <span>Sort</span>
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="border-0 bg-transparent font-label-sm text-xs uppercase tracking-widest outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </section>

      <section className="w-full py-xl lg:py-section-desktop">
        <div className="mx-auto max-w-7xl px-lg lg:px-xxl">
          {sortedProducts.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-lg">
              {sortedProducts.map((product, index) => (
                <CatalogProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="border-y border-border py-xxl text-center">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Nothing here yet</h2>
              <p className="mx-auto mt-sm max-w-md font-body-md text-body-md italic text-on-surface-muted">
                New handmade pieces are being prepared in the Bloomncharms studio.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
