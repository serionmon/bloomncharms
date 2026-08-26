'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/content/products';
import { fetchProducts } from '@/lib/api';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetchProducts();
      setProducts(res.products);
    } catch (err) {
      console.error('[ShopCatalogContent] Failed to fetch products:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'custom') return products.filter((product) => product.isCustomizable);
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

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
            {isLoading ? 'Loading...' : `${sortedProducts.length} ${sortedProducts.length === 1 ? 'Item' : 'Items'}`}
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
          {isLoading ? (
            /* Loading State: Editorial Skeleton Grid */
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-lg">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-shop-${i}`}
                  className="flex flex-col bg-surface-container-lowest border border-border animate-pulse"
                >
                  <div className="w-full aspect-[4/5] bg-surface-container" />
                  <div className="p-3 sm:p-md flex flex-col gap-2">
                    <div className="h-3 bg-surface-container rounded w-1/3" />
                    <div className="h-4 bg-surface-container rounded w-3/4" />
                    <div className="h-3 bg-surface-container rounded w-1/2 mt-2" />
                    <div className="h-8 bg-surface-container rounded w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            /* Error State with Graceful Retry */
            <div className="border-y border-border py-xxl text-center p-xl">
              <span className="material-symbols-outlined text-3xl text-primary mb-sm block">
                sync_problem
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Connection to collection unavailable</h2>
              <p className="mx-auto mt-sm max-w-md font-body-md text-body-md italic text-on-surface-muted mb-md">
                We were unable to load the latest catalog. Please try again.
              </p>
              <button
                type="button"
                onClick={loadProducts}
                className="font-label-sm text-xs text-primary uppercase tracking-widest border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : sortedProducts.length ? (
            /* Normal Product Grid */
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-lg">
              {sortedProducts.map((product, index) => (
                <CatalogProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            /* Empty State */
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