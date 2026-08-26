import React from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/content/products';
import BouquetCard from '@/components/ui/BouquetCard';

export default function BouquetsPage() {
  const bouquetProducts = PRODUCTS.filter((p) => p.category === 'bouquets').slice(0, 4);

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative w-full px-lg lg:px-xxl py-section-desktop border-b border-border flex flex-col lg:flex-row items-center justify-between gap-xl">
        <div className="lg:w-1/2 flex flex-col gap-md z-10">
          <h1 className="font-display-lg text-on-background lowercase max-w-2xl">
            Flowers that don&apos;t have an expiry date.
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-md italic">
            Handmade bouquets created to become keepsakes.
          </p>
        </div>
        <div className="lg:w-1/2 w-full h-[500px] lg:h-[700px] relative border border-border overflow-hidden">
          {/* eslint-disable-next-js/no-img-element */}
          <img
            className="w-full h-full object-cover"
            data-alt="Lavish handmade bouquet made of silk and velvet fabric"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGyLLLuP3yyCCVnco-Q4QikkN1WY6LmR1C191ZtQYuchtfR1cAc6kp8kFuKvnIsFyNGfUQu1hOO6koGIs6yJNyP-T5EjjN56-zqEiTR3TMCJsoMZ_k9ARZ0OvjVp8AklTxPMN4C6SEbtIrXd2KvPb4FNxoduArARd1oLpoem3w0L0tlnys0BBjmKIa25zwi36g2XbIzrOtAVyrljpPSh9pn5n_go4ncr5brXTIcrzi0khyva9q63H6cw"
            alt="Handcrafted bouquet in soft window lighting"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent mix-blend-multiply pointer-events-none" />
        </div>
      </section>

      {/* 2. Collection Grid */}
      <section className="w-full px-lg lg:px-xxl py-section-desktop border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-xxl border-b border-border pb-md">
            <h2 className="font-headline-md text-on-surface lowercase">
              Bouquets Collection
            </h2>
            <span className="font-label-sm text-on-surface-muted uppercase">
              [ 05 Curated Styles ]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-xl gap-x-px bg-border">
            {bouquetProducts.map((product) => (
              <BouquetCard key={product.id} product={product} />
            ))}

            {/* Custom Bouquet Bespoke Card */}
            <Link
              className="group block bg-surface relative hover:bg-surface-container transition-colors duration-500 overflow-hidden h-[600px] flex flex-col p-md border border-border md:col-span-2 lg:col-span-1"
              href="/custom"
            >
              <div className="flex-1 w-full relative overflow-hidden mb-md bg-surface-container flex items-center justify-center border border-border border-dashed p-lg">
                <div className="text-center px-md">
                  <span className="material-symbols-outlined text-4xl text-primary mb-md block">
                    edit_square
                  </span>
                  <p className="font-body-lg text-on-surface">
                    Design a bouquet tailored to your unique palette and occasion.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-xs">
                  <h3 className="font-body-lg text-on-surface">Custom Bouquet</h3>
                  <span className="font-label-sm text-on-surface-muted">Bespoke creation</span>
                </div>
                <span className="font-body-md text-on-surface">From $150</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Craftsmanship Callout */}
      <section className="w-full px-lg lg:px-xxl py-section-desktop border-b border-border bg-surface-container-low flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, #7e1419 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="text-center z-10 max-w-4xl mix-blend-multiply">
          <h2 className="font-display-lg text-primary lowercase tracking-tight leading-tight">
            Made slowly.
            <br />
            Given thoughtfully.
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-xl max-w-xl mx-auto italic">
            Every petal is shaped by hand, taking hours of focused craftsmanship to ensure your gesture lasts a lifetime.
          </p>
          <Link
            href="/our-story"
            className="inline-block mt-xxl bg-primary text-on-primary px-xl py-md font-label-sm uppercase tracking-widest hover:bg-on-primary-fixed-variant transition-colors border border-transparent hover:border-primary"
          >
            Learn about our process
          </Link>
        </div>
      </section>
    </div>
  );
}
