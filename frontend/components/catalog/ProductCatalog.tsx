'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductCategory, Product } from '@/content/products';
import { fetchProducts } from '@/lib/api';
import CatalogProductCard from './CatalogProductCard';

type FilterOption = 'ALL' | 'BOUQUETS' | 'FLOWERS' | 'KEYRINGS' | 'CHARMS' | 'GIFT SETS';

const FILTER_TABS: { label: FilterOption; categoryKey: 'all' | ProductCategory }[] = [
  { label: 'ALL', categoryKey: 'all' },
  { label: 'BOUQUETS', categoryKey: 'bouquets' },
  { label: 'FLOWERS', categoryKey: 'flowers' },
  { label: 'KEYRINGS', categoryKey: 'keyrings' },
  { label: 'CHARMS', categoryKey: 'charms' },
  { label: 'GIFT SETS', categoryKey: 'gift-sets' },
];

export default function ProductCatalog() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetchProducts();
      setProducts(res.products);
    } catch (err) {
      console.error('[ProductCatalog] Failed to load products:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'ALL') {
      return products;
    }
    const currentTab = FILTER_TABS.find((t) => t.label === activeFilter);
    if (!currentTab || currentTab.categoryKey === 'all') {
      return products;
    }
    return products.filter((product) => product.category === currentTab.categoryKey);
  }, [activeFilter, products]);

  return (
    <section
      id="the-collection"
      className="w-full bg-surface py-section-desktop px-lg lg:px-xxl border-b border-border"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-xl lg:gap-xxl">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="flex items-center gap-xs mb-sm">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
              [THE COLLECTION]
            </span>
          </div>

          <h2 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mb-md">
            Little things, made to mean more.
          </h2>

          <p className="font-body-lg text-body-lg text-on-surface-variant italic max-w-2xl">
            &ldquo;Handmade flowers, charming keepsakes and thoughtful little gifts, created slowly and made to last.&rdquo;
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="w-full border-y border-border py-3">
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto hidden-scrollbar gap-2 sm:gap-3 px-2">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.label;
              const productCount =
                tab.categoryKey === 'all'
                  ? products.length
                  : products.filter((p) => p.category === tab.categoryKey).length;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveFilter(tab.label)}
                  className={`flex-shrink-0 font-label-sm text-xs sm:text-label-sm uppercase tracking-widest px-4 py-2 rounded transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm font-semibold'
                      : 'bg-surface-container-lowest/80 text-on-surface hover:text-primary hover:bg-surface-container border border-border'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${tab.label}`}
                >
                  {tab.label}
                  {!isLoading && (
                    <span
                      className={`ml-1.5 text-[10px] opacity-80 ${
                        isActive ? 'text-on-primary' : 'text-on-surface-muted'
                      }`}
                    >
                      ({productCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid / Loading / Error / Empty States */}
        <div className="w-full">
          {isLoading ? (
            /* Loading State: Editorial Skeleton Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-md lg:gap-lg">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
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
            <div className="py-xxl text-center border border-border bg-surface-container-low p-xl rounded">
              <span className="material-symbols-outlined text-3xl text-primary mb-sm block">
                sync_problem
              </span>
              <p className="font-body-md text-on-surface mb-sm">
                Unable to load the latest atelier collection right now.
              </p>
              <button
                type="button"
                onClick={loadCatalog}
                className="font-label-sm text-xs text-primary uppercase tracking-widest border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="py-xxl text-center">
              <p className="font-body-md text-on-surface-muted italic">
                No products found in this category.
              </p>
            </div>
          ) : (
            /* Normal Catalog Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-md lg:gap-lg">
              {filteredProducts.map((product, idx) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}