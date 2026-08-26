'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchShipmentTracking } from '@/lib/api';

type DemoOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type DemoDeliveryAddress = {
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pinCode: string;
};

type DemoOrder = {
  orderNumber: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  customerName: string;
  items: DemoOrderItem[];
  deliveryAddress: DemoDeliveryAddress;
  total: number;
  courierName?: string;
  awbCode?: string;
  trackingUrl?: string;
};

const DEMO_ORDER: DemoOrder = {
  orderNumber: 'BC-DEMO-1042',
  createdAt: '2026-08-25T00:00:00.000Z',
  status: 'CRAFTING',
  statusLabel: 'Artisans Crafting',
  customerName: 'Bloomncharms Customer',
  items: [
    {
      name: 'Signature Bloom Bouquet',
      quantity: 1,
      price: 1299,
    },
    {
      name: 'Lavender Bloom Keyring',
      quantity: 1,
      price: 299,
    },
  ],
  deliveryAddress: {
    address: '14 Artisans Lane',
    apartment: 'Apt 2B',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560001',
  },
  total: 1598,
  courierName: 'Shiprocket / Blue Dart',
  awbCode: 'SR-DEMO-789012',
  trackingUrl: 'https://shiprocket.co/tracking/SR-DEMO-789012',
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('BC-DEMO-1042');
  const [contactInfo, setContactInfo] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<DemoOrder | null>(null);
  const [liveTracking, setLiveTracking] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    const normalized = orderNumber.trim().toUpperCase();

    try {
      const trackingData = await fetchShipmentTracking(normalized);
      if (trackingData && trackingData.orderNumber) {
        setLiveTracking(trackingData);
        setFoundOrder({
          orderNumber: trackingData.orderNumber,
          createdAt: trackingData.shippedAt || new Date().toISOString(),
          status: trackingData.shippingStatus.toUpperCase(),
          statusLabel:
            trackingData.shippingStatus === 'delivered'
              ? 'Delivered'
              : trackingData.shippingStatus === 'out_for_delivery'
              ? 'Out for Delivery'
              : trackingData.shippingStatus === 'in_transit'
              ? 'In Transit'
              : 'Manifested / Ready for Courier',
          customerName: 'Bloomncharms Customer',
          items: [
            {
              name: 'Artisanal Floral Creation',
              quantity: 1,
              price: 1299,
            },
          ],
          deliveryAddress: {
            address: 'Verified Destination Address',
            city: trackingData.destinationCity || 'Bengaluru',
            state: trackingData.destinationState || 'Karnataka',
            pinCode: '560001',
          },
          total: 1299,
          courierName: trackingData.courierName,
          awbCode: trackingData.awbCode,
          trackingUrl: trackingData.trackingUrl,
        });
        setIsSearching(false);
        return;
      }
    } catch {
      // Fallback to local demo lookup
    }

    setLiveTracking(null);
    setFoundOrder(normalized === DEMO_ORDER.orderNumber ? DEMO_ORDER : null);
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col w-full relative bg-background min-h-screen">
      {/* Decorative Background Overlay */}
      <div className="absolute inset-0 w-full h-[60vh] bg-gradient-to-b from-surface-variant/30 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full px-lg lg:px-xxl pb-section-desktop">
        {/* Header Section */}
        <section className="w-full flex flex-col md:flex-row items-end justify-between gap-xl pt-section-mobile md:pt-section-desktop pb-xxl border-b border-border">
          <div className="max-w-2xl">
            <span className="block font-label-sm text-primary uppercase mb-md tracking-widest">
              Order Tracking &amp; Craft Status
            </span>
            <h1 className="font-display-lg text-on-surface mb-sm text-[36px] sm:text-headline-md tracking-tight">
              Where&apos;s your bloom?
            </h1>
            <p className="font-body-lg text-on-surface-muted max-w-lg text-sm sm:text-base">
              Enter your details below to follow your artisanal piece on its journey to you. We update your status at every delicate step of the process.
            </p>
          </div>

          {/* Quick Search Form */}
          <div className="w-full md:w-auto bg-surface-container-lowest p-lg shadow-xl shadow-border/5 rounded-xl border border-border">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row items-end gap-md">
              <div className="w-full sm:w-48">
                <label className="block font-label-sm text-on-surface-variant uppercase mb-xs text-xs" htmlFor="order-number">
                  Order Number
                </label>
                <input
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-transparent border-b border-border py-2 font-body-md text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="e.g. BC-DEMO-1042"
                  type="text"
                  required
                />
              </div>
              <div className="w-full sm:w-64">
                <label className="block font-label-sm text-on-surface-variant uppercase mb-xs text-xs" htmlFor="contact-info">
                  Email or Phone
                </label>
                <input
                  id="contact-info"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full bg-transparent border-b border-border py-2 font-body-md text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="Enter email or phone"
                  type="text"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto bg-primary text-on-primary px-xl py-3 rounded font-label-sm uppercase hover:bg-primary-container transition-colors whitespace-nowrap mt-4 sm:mt-0 shadow-md shadow-primary/20 text-xs tracking-widest cursor-pointer disabled:opacity-50"
              >
                {isSearching ? 'Tracking...' : 'Track Order'}
              </button>
            </form>
          </div>
        </section>

        {/* Tracking Results Section */}
        {hasSearched && (
          <section className="pt-xxl pb-section-desktop transition-all duration-700" id="tracking-results">
            {/* Order Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-xl gap-lg">
              <div>
                <h2 className="font-headline-md text-on-surface mb-xs text-xl sm:text-2xl">
                  Order #{orderNumber}
                </h2>
                <p className="font-body-md text-on-surface-variant text-sm">
                  {foundOrder
                    ? `Placed on ${new Date(foundOrder.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} via Handcrafted Atelier Delivery`
                    : 'Artisanal Bloom Crafting Status'}
                </p>
              </div>
              <div className="bg-surface-container-low px-lg py-sm rounded-full border border-border flex items-center gap-sm">
                <div className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
                <span className="font-label-sm text-on-surface-variant uppercase text-xs">
                  Current Status: {foundOrder?.statusLabel || 'Making / Crafting'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-xxl items-start">
              {/* Timeline Column */}
              <div className="lg:col-span-7 xl:col-span-8 bg-surface-container-lowest p-xl lg:p-xxl rounded-xl border border-border shadow-lg shadow-border/5 relative overflow-hidden">
                <h3 className="font-headline-sm text-on-surface mb-xxl relative z-10">
                  Journey of Your Order
                </h3>
                <div className="relative z-10 pl-md md:pl-xl">
                  {/* Continuous Line */}
                  <div className="absolute left-md md:left-xl top-6 bottom-12 w-[1px] bg-border origin-top">
                    <div className="w-full bg-primary origin-top transition-all duration-1000 ease-in-out" style={{ height: '50%' }} />
                  </div>

                  <div className="flex flex-col gap-xl">
                    {/* Step 1: Placed */}
                    <div className="relative pl-xl opacity-60">
                      <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-border border-4 border-surface-container-lowest z-10" />
                      <div className="flex justify-between items-start mb-sm">
                        <h4 className="font-label-sm text-on-surface-variant uppercase text-xs font-semibold">Order Placed</h4>
                        <span className="font-label-sm text-on-surface-muted text-xs">Confirmed</span>
                      </div>
                      <p className="font-body-md text-on-surface-muted text-xs">We have received your order details and crafting instructions.</p>
                    </div>

                    {/* Step 2: Confirmed */}
                    <div className="relative pl-xl opacity-60">
                      <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-border border-4 border-surface-container-lowest z-10" />
                      <div className="flex justify-between items-start mb-sm">
                        <h4 className="font-label-sm text-on-surface-variant uppercase text-xs font-semibold">Order Confirmed</h4>
                        <span className="font-label-sm text-on-surface-muted text-xs">Materials Selected</span>
                      </div>
                      <p className="font-body-md text-on-surface-muted text-xs">Chenille stems and brass fixtures prepared in studio.</p>
                    </div>

                    {/* Step 3: Making (Active) */}
                    <div className="relative pl-xl transform scale-[1.02] origin-left transition-transform">
                      <div className="absolute left-[-8px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest z-10 shadow-[0_0_12px_rgba(126,20,25,0.4)]" />
                      <div className="flex justify-between items-start mb-sm">
                        <h4 className="font-label-sm text-primary uppercase font-bold text-xs">Handcrafting in Studio</h4>
                        <span className="font-label-sm text-on-surface-variant font-bold text-xs">Active</span>
                      </div>
                      <p className="font-body-md text-on-surface text-xs">
                        Your arrangement is currently being handcrafted with care by our lead artisan, Elena. Delicate details take time.
                      </p>

                      <div className="mt-md flex items-center gap-md bg-surface p-md rounded border border-border w-fit">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border relative">
                          <Image
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
                            alt="Lead Artisan Elena"
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="block font-label-sm text-on-surface uppercase font-medium text-xs">Artisan: Elena</span>
                          <span className="block text-[11px] font-body-md text-on-surface-muted italic">Handcrafting with chenille stems in Mumbai studio</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Packed */}
                    <div className="relative pl-xl opacity-40 grayscale">
                      <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-border border-4 border-surface-container-lowest z-10" />
                      <h4 className="font-label-sm text-on-surface-variant uppercase mb-sm text-xs font-semibold">Packed</h4>
                      <p className="font-body-md text-on-surface-muted text-xs">Carefully wrapped and boxed in bespoke packaging to ensure safe transit.</p>
                    </div>

                    {/* Step 5: Shipped */}
                    <div className="relative pl-xl opacity-40 grayscale">
                      <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-border border-4 border-surface-container-lowest z-10" />
                      <h4 className="font-label-sm text-on-surface-variant uppercase mb-sm text-xs font-semibold">Dispatched</h4>
                      <p className="font-body-md text-on-surface-muted text-xs">Handed over to our reliable courier partner.</p>
                    </div>

                    {/* Step 6: Delivered */}
                    <div className="relative pl-xl opacity-40 grayscale">
                      <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-border border-4 border-surface-container-lowest z-10" />
                      <h4 className="font-label-sm text-on-surface-variant uppercase mb-sm text-xs font-semibold">Delivered</h4>
                      <p className="font-body-md text-on-surface-muted text-xs">Arrived at destination.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details Column */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-lg">
                {/* Details Card */}
                <div className="bg-surface-container-lowest p-lg rounded-xl border border-border flex flex-col gap-lg shadow-sm">
                  {foundOrder ? (
                    <>
                      <div>
                        <h4 className="font-label-sm text-on-surface-muted uppercase border-b border-border pb-xs mb-md text-xs">
                          Order Breakdown ({foundOrder.items.length} {foundOrder.items.length === 1 ? 'Item' : 'Items'})
                        </h4>
                        <div className="flex flex-col gap-sm">
                          {foundOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-body-md">
                              <span className="text-on-surface">{item.name} × {item.quantity}</span>
                              <span className="font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-label-sm text-on-surface-muted uppercase border-b border-border pb-xs mb-md text-xs">
                          Delivery Destination
                        </h4>
                        <p className="font-body-md text-on-surface mb-xs font-medium text-xs">{foundOrder.customerName}</p>
                        <p className="font-body-md text-on-surface-variant text-xs">
                          {foundOrder.deliveryAddress.address}
                          {foundOrder.deliveryAddress.apartment ? `, ${foundOrder.deliveryAddress.apartment}` : ''}<br />
                          {foundOrder.deliveryAddress.city}, {foundOrder.deliveryAddress.state} — {foundOrder.deliveryAddress.pinCode}
                        </p>
                      </div>

                      {foundOrder.courierName && (
                        <div className="bg-surface-container-low p-sm rounded border border-border">
                          <h4 className="font-label-sm text-on-surface-muted uppercase text-[10px] mb-1">
                            Courier Partner &amp; Tracking
                          </h4>
                          <p className="font-body-md text-on-surface font-medium text-xs">
                            {foundOrder.courierName}
                          </p>
                          {foundOrder.awbCode && (
                            <p className="font-mono text-xs text-on-surface-variant mt-0.5">
                              AWB: {foundOrder.awbCode}
                            </p>
                          )}
                          {foundOrder.trackingUrl && (
                            <a
                              href={foundOrder.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 font-label-sm text-[11px] text-primary underline uppercase tracking-wider"
                            >
                              Live Courier Tracking &rarr;
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-baseline pt-sm border-t border-border">
                        <span className="font-label-sm text-xs uppercase text-on-surface">Total</span>
                        <span className="font-headline-md text-base text-primary">₹{foundOrder.total.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-label-sm text-on-surface-muted uppercase border-b border-border pb-xs mb-md text-xs">
                          Handcrafted Delivery
                        </h4>
                        <p className="font-body-md text-on-surface mb-xs font-medium text-xs">Artisanal Packaging</p>
                        <p className="font-body-md text-on-surface-variant text-xs">
                          Handmade pipe-cleaner flowers carefully boxed with protective tissue and ribbons.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-label-sm text-on-surface-muted uppercase border-b border-border pb-xs mb-md text-xs">
                          Estimated Arrival
                        </h4>
                        <p className="font-headline-sm text-primary text-base">3 - 5 Business Days</p>
                        <p className="font-body-md text-on-surface-variant text-xs mt-xs">Active crafting queue</p>
                      </div>
                    </>
                  )}

                  <div className="pt-md mt-sm border-t border-border flex justify-between items-center">
                    <Link
                      href="/account"
                      className="font-label-sm text-xs text-primary uppercase tracking-wider hover:underline"
                    >
                      Account Dashboard
                    </Link>
                    <Link
                      href="/shop"
                      className="font-label-sm text-xs uppercase border border-primary px-3 py-1.5 rounded text-primary hover:bg-primary/5 transition-colors"
                    >
                      Shop More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
