import React from 'react';
import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';

export default async function KeyringsPage() {
  const { products } = await fetchProducts({ category: 'keyrings' });
  const mainCollection = products.slice(0, 8);
  const moreProducts = products.slice(8, 12);

  const addOnItems = [
    {
      name: 'Silk Ribbon Attachment',
      price: '$12',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCL_IbJJSjVi5XsOV7ycJx-BZ3BTgeBlqNMGULJ1FB_3GZi4NrcDwwa3c25jaa04hJJ_PFk8Ks3CJ13z3d6ZHg8cBaMB_HbaUu7Wz1rPqGHK5W-2FdCtwLOgUlKYgpebDcNQd4cceWiz0qs26a2n8Zfxh8TuV7QWMo6ejWJgyEeki0AcVcAgqar3BDCsFzIhPeQ6IgQ_x6AfC4TLVbIrY76C4ohTtdt5VpPonDycFMmUK3EU0oqTUAnQg',
    },
    {
      name: 'Gold Initial Charm',
      price: '$15',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0R29j_PtTkOkVH-qV_rP_RV-5um4zVJLPHAS37jCuJ8T7VRBKCRGk6sbxD298s6Q2m0qFEShW32jBfqOlkV5GtKnyDwqu85m6YUQhehvrPlW1F_FSHZG9fBMbYoec1Kk_jEFUyhISGaTTbnMrVnrgGNH5-YEzS3_28MQsXQGo36cMNAX0uP_BFvmv8WXykWXOvBKj81GAbkEpd9oy3Mxj3xWu9fXihcHGrFt74nTssNvLK0if2GTg',
    },
    {
      name: 'Leather Tassel',
      price: '$18',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBoXI2VDg9ZxSUCdPEssVZYiojmRQOj7zh3YaowT2JtSJ3RBaK8XCdiZmW_wfyL4_6k5WT8Fc670u7u550cG_fuPVcIAgMBwZuH-3ktWAl8ZcUbOKWCYjg4wmXczzLJ3HILYMkdBymJPQ5_ajwVQbNiH6Z7gnZQK-ADBEFbrLR1rWZp5Rx0AiRy6D-fZCbpvKoTnIWTzRL2i3WJuIO7nptd3p2u_xmU7yOPZA8Jqxd4DcBClZwJCgqrmw',
    },
    {
      name: 'Premium Gift Box',
      price: '$8',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNP5-4nauFjMjTobPqe0-ouHPjpXDkPVWedkPR-Ww6YdCLq9QojoaKFJDflSOEBeHjxMwAKbLh5cOVIERrEy1CIJRODNBOqYWjWvktM0wcv9L8lLE4zS8OOTUP0sPaTgZZALlJZ6CkaDxrjNGTuPleMIZ_6stbLazT7Znq3DlGP27jhjkcdmnk7GaLZ2r9UB74cr-EywBqeuQQF66Rtl0zipr7K98rxfuSbxu1oUzcJFt1fPHRjDUDQ',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* 1. HERO */}
      <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center bg-surface-container overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-multiply"
          data-alt="Editorial floral keyring on linen"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBcazdjQS4mbsy5IwY37YVNSHSo3OXdPnjZMFWDG559Jx7bQ4DvKi6oMwtHQJC_tAe3wevbs5BvXmKJvIaldyNDY6Bsc7sSzOkbegeUGiEYOsILTTBT5ikdvciWoFALZ2Q6BMpv-qcjuwcPky_JqzCkpMnIjS30KBN6GOlpcmEH4sofyLEAg-MT6IoGB93RYl2LYTanJexa8fi-xLZ8Hbbz2WqmvB8EcC3IZBXFjH-Gfb46iAHgtmhVQg')`,
          }}
        />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-lg lg:px-xxl grid grid-cols-1 md:grid-cols-2 gap-xl">
          <div className="flex flex-col justify-center items-start">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-md max-w-lg leading-tight">
              Carry a little bloom.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-xl">
              Handmade keyrings made for bags, keys, and everyday little moments. Small things, crafted to stay.
            </p>
            <a
              className="inline-flex items-center justify-center px-lg py-md bg-on-surface text-surface font-label-sm uppercase hover:bg-primary transition-colors"
              href="#collection"
            >
              Shop Collection
            </a>
          </div>
        </div>
      </section>

      {/* 2. COLLECTION */}
      <section id="collection" className="w-full px-lg lg:px-xxl py-section-mobile md:py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center border-b border-border pb-lg mb-xxl">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
              Small things. Made to stay.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-muted max-w-2xl mx-auto">
              Discover our collection of handcrafted floral keyrings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-lg gap-y-xxl">
            {mainCollection.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED */}
      <section className="w-full bg-surface-container-low py-section-desktop border-y border-border">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl lg:gap-xxl items-center">
            <div className="relative w-full aspect-[4/5] lg:aspect-square bg-surface-container border border-border overflow-hidden">
              {/* eslint-disable-next-js/no-img-element */}
              <img
                className="absolute inset-0 w-full h-full object-cover"
                data-alt="Close up of featured keyring"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMvxKeclS0ycXYkkudScJzy_v7uarqntdvkcyQadUx5BcOAEa2Ph2aKO5-5QqdSV_rsMVfo41_hXnTmn63A-75o-mOgZxNIk5ZDwnn0IPiBt1Hb-2NZVgacmvd9iESlXRp6PfvYLi8WyiJUIasNor0Y0gn5RGKC9N5WR22FBLpg4cNZ-hmU-oxVNawSIbGPWxbJ720A1fOtLYrorm9houy0dvc0c5w0DyOV4fyB_Venm85YODKTaOjiw"
                alt="Heirloom collection keyring"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col gap-md md:gap-lg px-md lg:px-0">
              <span className="font-label-sm text-label-sm text-on-surface-muted uppercase tracking-widest">
                Editor&apos;s Pick
              </span>
              <h2 className="font-display-lg text-headline-md md:text-display-lg text-on-surface leading-tight">
                The Heirloom Collection
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Our most intricate designs, crafted to resemble delicate botanical illustrations. Each piece is assembled with meticulous care, designed to be passed down like a tiny treasure.
              </p>
              <div className="pt-sm">
                <Link
                  className="inline-flex items-center justify-center px-lg py-md border border-border text-on-surface font-label-sm uppercase hover:bg-surface-container transition-colors"
                  href="/shop"
                >
                  Shop Heirloom
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETAILS */}
      <section className="w-full px-lg lg:px-xxl py-section-mobile md:py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl lg:gap-xxl divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">01</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Handmade</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Every flower, petal, and leaf is carefully shaped and assembled by hand in our studio.
              </p>
            </div>
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">02</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Lightweight</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Designed to be beautiful without weighing down your keys or favorite bag.
              </p>
            </div>
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">03</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Personal</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Choose the bloom that speaks to you, or request a custom colorway to match your style.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOM BANNER */}
      <section className="w-full bg-surface-container-high py-section-desktop border-y border-border">
        <div className="max-w-4xl mx-auto px-lg text-center flex flex-col items-center gap-md">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            Made to look like yours.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-md">
            Want a specific flower or a color palette to match your favorite bag? We create custom keyrings designed entirely for you.
          </p>
          <Link
            className="inline-flex items-center justify-center px-lg py-md bg-primary text-on-primary font-label-sm uppercase hover:bg-on-primary-fixed-variant transition-colors"
            href="/custom"
          >
            Request Custom Order
          </Link>
        </div>
      </section>

      {/* 6. CATEGORIES */}
      <section className="w-full px-lg lg:px-xxl py-section-mobile md:py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            <Link
              className="group relative w-full aspect-square border border-border overflow-hidden bg-surface-container"
              href="/shop?category=flowers"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBcazdjQS4mbsy5IwY37YVNSHSo3OXdPnjZMFWDG559Jx7bQ4DvKi6oMwtHQJC_tAe3wevbs5BvXmKJvIaldyNDY6Bsc7sSzOkbegeUGiEYOsILTTBT5ikdvciWoFALZ2Q6BMpv-qcjuwcPky_JqzCkpMnIjS30KBN6GOlpcmEH4sofyLEAg-MT6IoGB93RYl2LYTanJexa8fi-xLZ8Hbbz2WqmvB8EcC3IZBXFjH-Gfb46iAHgtmhVQg')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent" />
              <div className="absolute bottom-lg left-lg right-lg flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Floral</h3>
                <span className="font-label-sm text-label-sm text-on-surface-muted uppercase mt-xs">
                  Shop Now
                </span>
              </div>
            </Link>

            <Link
              className="group relative w-full aspect-square border border-border overflow-hidden bg-surface-container"
              href="/bouquets"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCL_IbJJSjVi5XsOV7ycJx-BZ3BTgeBlqNMGULJ1FB_3GZi4NrcDwwa3c25jaa04hJJ_PFk8Ks3CJ13z3d6ZHg8cBaMB_HbaUu7Wz1rPqGHK5W-2FdCtwLOgUlKYgpebDcNQd4cceWiz0qs26a2n8Zfxh8TuV7QWMo6ejWJgyEeki0AcVcAgqar3BDCsFzIhPeQ6IgQ_x6AfC4TLVbIrY76C4ohTtdt5VpPonDycFMmUK3EU0oqTUAnQg')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent" />
              <div className="absolute bottom-lg left-lg right-lg flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Mini Bouquets</h3>
                <span className="font-label-sm text-label-sm text-on-surface-muted uppercase mt-xs">
                  Shop Now
                </span>
              </div>
            </Link>

            <Link
              className="group relative w-full aspect-square border border-border overflow-hidden bg-surface-container"
              href="/shop?category=charms"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0R29j_PtTkOkVH-qV_rP_RV-5um4zVJLPHAS37jCuJ8T7VRBKCRGk6sbxD298s6Q2m0qFEShW32jBfqOlkV5GtKnyDwqu85m6YUQhehvrPlW1F_FSHZG9fBMbYoec1Kk_jEFUyhISGaTTbnMrVnrgGNH5-YEzS3_28MQsXQGo36cMNAX0uP_BFvmv8WXykWXOvBKj81GAbkEpd9oy3Mxj3xWu9fXihcHGrFt74nTssNvLK0if2GTg')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent" />
              <div className="absolute bottom-lg left-lg right-lg flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Charms</h3>
                <span className="font-label-sm text-label-sm text-on-surface-muted uppercase mt-xs">
                  Shop Now
                </span>
              </div>
            </Link>

            <Link
              className="group relative w-full aspect-square border border-border overflow-hidden bg-surface-container"
              href="/custom"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBoXI2VDg9ZxSUCdPEssVZYiojmRQOj7zh3YaowT2JtSJ3RBaK8XCdiZmW_wfyL4_6k5WT8Fc670u7u550cG_fuPVcIAgMBwZuH-3ktWAl8ZcUbOKWCYjg4wmXczzLJ3HILYMkdBymJPQ5_ajwVQbNiH6Z7gnZQK-ADBEFbrLR1rWZp5Rx0AiRy6D-fZCbpvKoTnIWTzRL2i3WJuIO7nptd3p2u_xmU7yOPZA8Jqxd4DcBClZwJCgqrmw')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 via-transparent to-transparent" />
              <div className="absolute bottom-lg left-lg right-lg flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Custom</h3>
                <span className="font-label-sm text-label-sm text-on-surface-muted uppercase mt-xs">
                  Request Now
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. MORE PRODUCTS */}
      <section className="w-full px-lg lg:px-xxl pb-section-mobile md:pb-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-lg gap-y-xxl">
            {moreProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. GIFTING BANNER */}
      <section className="w-full bg-surface-container py-section-desktop border-y border-border">
        <div className="max-w-4xl mx-auto px-lg text-center flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-4xl text-primary/60 mb-sm">
            featured_seasonal_and_gifts
          </span>
          <h2 className="font-display-lg text-headline-md md:text-display-lg text-on-surface">
            A little gift that goes everywhere.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-md">
            Our keyrings make the perfect thoughtful present. Beautifully packaged and ready to bring a smile to someone&apos;s day.
          </p>
          <Link
            className="inline-flex items-center justify-center px-lg py-md border border-border text-on-surface font-label-sm uppercase hover:bg-surface transition-colors"
            href="/shop?category=gift-sets"
          >
            View Gift Sets
          </Link>
        </div>
      </section>

      {/* 9. YOU MAY ALSO LIKE */}
      <section className="w-full px-lg lg:px-xxl py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-lg text-center uppercase tracking-widest">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
            {addOnItems.map((item) => (
              <div key={item.name} className="group flex flex-col gap-sm">
                <div className="relative w-full aspect-square bg-surface-container border border-border overflow-hidden">
                  {/* eslint-disable-next-js/no-img-element */}
                  <img
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <span className="font-body-md text-body-md text-on-surface-muted">
                    {item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
