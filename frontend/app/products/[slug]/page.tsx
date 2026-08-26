'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { getProductBySlug, PRODUCTS, getStockStatus } from '@/content/products';
import { useCart } from '@/components/commerce/CartProvider';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const product = (slug && getProductBySlug(slug)) || PRODUCTS[0];
  const stockInfo = getStockStatus(product.stock, product.available);

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'materials' | 'dimensions' | 'care' | 'shipping'>('materials');
  const [personalization, setPersonalization] = useState('');

  const maxStock = product.stock || 99;

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="flex flex-col w-full bg-background min-h-screen relative">
      {/* Top Section: Image Gallery & Fixed Details Panel */}
      <section className="flex flex-col lg:flex-row w-full pt-md lg:pt-lg pb-section-desktop lg:min-h-screen">
        {/* Left: Asymmetrical Image Gallery */}
        <div className="w-full lg:w-[60%] px-md lg:pl-xxl lg:pr-lg overflow-y-auto hidden-scrollbar pb-xl lg:pb-0">
          <div className="grid grid-cols-12 gap-md auto-rows-[250px] lg:auto-rows-[400px]">
            {/* Hero Image (Spans 12 cols, 2 rows) */}
            <div className="col-span-12 row-span-2 relative group overflow-hidden border border-border bg-surface-container">
              <Image
                src={product.image}
                alt={product.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            {/* Detail 1 (Spans 7 cols, 1 row) */}
            <div className="col-span-12 md:col-span-7 row-span-1 relative group overflow-hidden border border-border bg-surface-container">
              <Image
                src={product.image}
                alt={`${product.name} detail craft`}
                fill
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            {/* Detail 2 (Spans 5 cols, 1 row) */}
            <div className="col-span-12 md:col-span-5 row-span-1 relative group overflow-hidden border border-border bg-surface-container">
              <Image
                src={product.image}
                alt={`${product.name} arrangement`}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Right: Sticky Details Panel */}
        <div className="w-full lg:w-[40%] px-md lg:pr-xxl lg:pl-lg lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto flex flex-col gap-xl py-xl lg:py-0">
            {/* Breadcrumbs & Category */}
            <div className="flex flex-col gap-xs">
              <nav className="flex items-center gap-sm">
                <Link href="/#the-collection" className="font-label-sm text-on-surface-muted uppercase tracking-widest hover:text-primary transition-colors">
                  The Collection
                </Link>
                <span className="font-label-sm text-on-surface-muted">/</span>
                <span className="font-label-sm text-on-surface-muted uppercase tracking-widest">
                  {product.category}
                </span>
              </nav>
            </div>

            {/* Title & Price */}
            <div className="flex flex-col gap-md">
              <h1 className="font-display-lg-mobile lg:font-display-lg text-on-surface leading-none">
                {product.name}
              </h1>
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-on-surface-variant">
                  {product.currency}{product.price.toLocaleString('en-IN')}
                </span>
                <div className={`px-md py-sm rounded-full border ${stockInfo.className}`}>
                  <span className="font-label-sm uppercase tracking-wider">
                    {stockInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-border" />

            {/* Description */}
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {product.description}
            </p>

            {/* Customization Input */}
            {product.isCustomizable && (
              <div className="flex flex-col gap-sm">
                <label className="font-label-sm text-on-surface uppercase tracking-widest" htmlFor="custom-note">
                  Personalization (Optional)
                </label>
                <input
                  id="custom-note"
                  value={personalization}
                  onChange={(e) => setPersonalization(e.target.value)}
                  placeholder="Enter initials, color notes, or a short message..."
                  type="text"
                  className="w-full bg-transparent border-b border-border py-sm font-body-md text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:border-on-surface transition-colors"
                />
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex flex-col gap-md mt-sm">
              <div className="flex items-center gap-md">
                {/* Quantity Selector */}
                <div className="flex items-center bg-surface-container border border-border rounded-full h-12 w-32">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="flex-1 h-full text-on-surface hover:text-primary transition-colors flex items-center justify-center font-body-lg disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="font-body-md text-on-surface font-medium select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    disabled={quantity >= maxStock}
                    className="flex-1 h-full text-on-surface hover:text-primary transition-colors flex items-center justify-center font-body-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-on-primary h-12 rounded-full font-label-sm uppercase tracking-widest hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm group"
                >
                  Add to Cart
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    shopping_bag
                  </span>
                </button>
              </div>

              {/* Secondary CTA */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full h-12 bg-transparent text-secondary font-label-sm uppercase tracking-widest border border-border rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Details Tabs Section */}
      <section className="w-full px-md lg:px-xxl py-section-desktop bg-surface-container-lowest relative overflow-hidden border-t border-border">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row gap-xl md:gap-xxl">
          {/* Tab Navigation (Vertical) */}
          <div className="w-full md:w-1/4 flex flex-col gap-lg border-l border-border pl-lg">
            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`text-left font-label-sm uppercase tracking-widest transition-colors ${
                activeTab === 'materials' ? 'text-primary font-bold' : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Materials &amp; Craft
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dimensions')}
              className={`text-left font-label-sm uppercase tracking-widest transition-colors ${
                activeTab === 'dimensions' ? 'text-primary font-bold' : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Dimensions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('care')}
              className={`text-left font-label-sm uppercase tracking-widest transition-colors ${
                activeTab === 'care' ? 'text-primary font-bold' : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Care Instructions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`text-left font-label-sm uppercase tracking-widest transition-colors ${
                activeTab === 'shipping' ? 'text-primary font-bold' : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Shipping &amp; Processing
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="w-full md:w-3/4 min-h-[300px]">
            {activeTab === 'materials' && (
              <div className="flex flex-col gap-lg animate-in fade-in duration-300">
                <h3 className="font-headline-md text-on-surface">
                  Artisanal Materials &amp; Craftsmanship
                </h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                  Sourced responsibly and assembled by skilled artisans, every component is chosen for its enduring quality and aesthetic harmony. We utilize a blend of premium velvety chenille stems, hand-dyed silks, and bespoke brass fixtures, ensuring each piece tells a unique story of origin and creation.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-md mt-md">
                  <div className="flex flex-col gap-sm">
                    <span className="material-symbols-outlined text-secondary text-[24px]">eco</span>
                    <span className="font-label-sm text-on-surface uppercase">Ethically Sourced</span>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <span className="material-symbols-outlined text-secondary text-[24px]">handyman</span>
                    <span className="font-label-sm text-on-surface uppercase">Hand Assembled</span>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <span className="material-symbols-outlined text-secondary text-[24px]">diamond</span>
                    <span className="font-label-sm text-on-surface uppercase">Premium Grade</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dimensions' && (
              <div className="flex flex-col gap-lg animate-in fade-in duration-300">
                <h3 className="font-headline-md text-on-surface">Specifications</h3>
                <div className="w-full max-w-md border border-border">
                  <div className="flex justify-between border-b border-border p-md">
                    <span className="font-label-sm text-on-surface-muted uppercase">Height</span>
                    <span className="font-body-md text-on-surface">14.5 inches (36.8 cm)</span>
                  </div>
                  <div className="flex justify-between border-b border-border p-md">
                    <span className="font-label-sm text-on-surface-muted uppercase">Width</span>
                    <span className="font-body-md text-on-surface">8.0 inches (20.3 cm)</span>
                  </div>
                  <div className="flex justify-between p-md">
                    <span className="font-label-sm text-on-surface-muted uppercase">Weight</span>
                    <span className="font-body-md text-on-surface">0.4 lbs (0.18 kg)</span>
                  </div>
                </div>
                <p className="font-body-md text-on-surface-muted italic text-sm mt-sm">
                  * Please note that due to the handmade nature of our products, slight variations in dimensions may occur.
                </p>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="flex flex-col gap-lg animate-in fade-in duration-300">
                <h3 className="font-headline-md text-on-surface">Care Instructions</h3>
                <ul className="flex flex-col gap-md font-body-md text-on-surface-variant max-w-2xl list-disc pl-md">
                  <li>Keep away from direct, prolonged sunlight to prevent colors from fading prematurely.</li>
                  <li>Store in a cool, dry place. Avoid high humidity areas such as bathrooms.</li>
                  <li>Dust gently with a soft, dry brush or a feather duster. Do not use water or chemical cleaners.</li>
                  <li>Handle with clean, dry hands to preserve the velvet soft texture of stems.</li>
                </ul>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="flex flex-col gap-lg animate-in fade-in duration-300">
                <h3 className="font-headline-md text-on-surface">Shipping &amp; Processing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl max-w-3xl">
                  <div className="bg-surface-container p-xl flex flex-col gap-md border border-border">
                    <span className="material-symbols-outlined text-primary text-[32px]">schedule</span>
                    <h4 className="font-label-sm text-on-surface uppercase font-bold">Processing Time</h4>
                    <p className="font-body-md text-on-surface-variant">
                      Each arrangement is crafted made-to-order. Please allow 3-5 business days for our studio artisans to assemble and package your piece.
                    </p>
                  </div>
                  <div className="bg-surface-container p-xl flex flex-col gap-md border border-border">
                    <span className="material-symbols-outlined text-primary text-[32px]">local_shipping</span>
                    <h4 className="font-label-sm text-on-surface uppercase font-bold">Standard Delivery</h4>
                    <p className="font-body-md text-on-surface-variant">
                      Tracked standard delivery takes 3-7 business days depending on destination. Express courier options available at checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
