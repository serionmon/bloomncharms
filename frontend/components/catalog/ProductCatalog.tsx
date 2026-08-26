'use client';

import React, { useState, useMemo } from 'react';
import { PRODUCTS, ProductCategory, Product } from '@/content/products';
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

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'ALL') {
      return PRODUCTS;
    }
    const currentTab = FILTER_TABS.find((t) => t.label === activeFilter);
    if (!currentTab || currentTab.categoryKey === 'all') {
      return PRODUCTS;
    }
    return PRODUCTS.filter((product) => product.category === currentTab.categoryKey);
  }, [activeFilter]);

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
                  ? PRODUCTS.length
                  : PRODUCTS.filter((p) => p.category === tab.categoryKey).length;

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
                  <span
                    className={`ml-1.5 text-[10px] opacity-80 ${
                      isActive ? 'text-on-primary' : 'text-on-surface-muted'
                    }`}
                  >
                    ({productCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-md lg:gap-lg">
            {filteredProducts.map((product, idx) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                priority={idx < 4}
              />
            ))}
          </div>

          {/* Empty state fallback if zero matches */}
          {filteredProducts.length === 0 && (
            <div className="py-xxl text-center">
              <p className="font-body-md text-on-surface-muted italic">
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
