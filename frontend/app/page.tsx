import React from 'react';
import Link from 'next/link';
import ProductCatalog from '@/components/catalog/ProductCatalog';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-lg lg:px-xxl py-section-desktop overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 to-surface-container-highest/20 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-xl mt-xxl">
          <h1 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight uppercase max-w-3xl">
            Little things, made to mean more.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl italic">
            Handcrafted flowers, bespoke keyrings, and delicate charms designed to capture moments and hold memories. Slow-made for those you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-lg mt-md">
            <Link
              className="bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest py-4 px-8 rounded hover:bg-primary-container transition-colors shadow-sm text-center"
              href="/shop"
            >
              Shop the collection
            </Link>
            <Link
              className="bg-transparent text-secondary border border-outline font-label-sm text-label-sm uppercase tracking-widest py-4 px-8 rounded hover:bg-secondary-container/10 transition-colors text-center"
              href="/custom"
            >
              Explore custom gifts
            </Link>
          </div>
        </div>

        {/* Hero Imagery Mosaic */}
        <div className="relative z-10 w-full max-w-7xl mx-auto mt-section-mobile grid grid-cols-2 md:grid-cols-4 gap-sm lg:gap-md h-[40vh] lg:h-[50vh]">
          <div
            className="bg-cover bg-center w-full h-full rounded shadow-md transform -translate-y-4 hover:-translate-y-6 transition-transform duration-500"
            data-alt="Delicate handcrafted pastel pink flower bouquet"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDgnDTHOT5h4jCHCoIkG3_JTCwg5bzQL6-mg4ziyoBvA7DIjgrKr7S6c_Rincfd0DItpMjxXJYEwgSNqa1mfuHxSZ6vzZVNE8wBpM1t-sNWDSGjssNkk5qmbzElJ0zYT3tq40rZiOV2pEYqX276xXo502NAfyiVE6xVsjycXtOxtj1eZ30V7A3cLE6c1WxixMMRnfRB2WU6qvPk-wo3vuHmqJ95IpmmyJLqnvrt_4roNjCZuy1oZUbCZA')`,
            }}
          />
          <div
            className="bg-cover bg-center w-full h-full rounded shadow-lg transform translate-y-8 hover:translate-y-4 transition-transform duration-500"
            data-alt="Close up of a bespoke silver keyring with floral charm"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWH6aCSNEyYds3UZso4MWUbvGqYh8pZxECsJQMb-WZaP4rC2A7SBDuJKWPttRpFcKO3k0VKKengUUE0D-wJ5_EW3B6BI7HuUgwGIV2dLe-mEV9R9HJgXncUa29jSio-Nrde8f20NNJeNkP3cwtCO-fE3qLYfsLkzgHoRDw1R6L7qI5F63B3A64bzXcxOjpwRsaY3780B-pGtru5j3clFQBEzvxjyIBYKxaE2-D9MH4kbgsYemaYq-ggg')`,
            }}
          />
          <div
            className="bg-cover bg-center w-full h-full rounded shadow-md transform -translate-y-2 hover:-translate-y-4 transition-transform duration-500 hidden md:block"
            data-alt="Tiny colorful enamel charms scattered on dark stone slate"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA99htNirrRLZUZf3ahs9gDHRwghitLGYwLHW-JLhKoGTICZZBsQr78SfpwsjGRBSJzmFf6ZveO4GwaO_Lof9ty9drTrqqJi8XOlnZtm8-1mV9wPiaTeS9D1jIz2eb68YWmuUDoMW823do6DU0MJmYk4jy-Cfcpu0VjxgGfCBNvgd0oKuPVhnHfebNC9CR7DfWVdS04R63ucYcxxVoeEUA7i4P7fkVItd1SRwqaHsNHLSLC6Y9hVZ61Ww')`,
            }}
          />
          <div
            className="bg-cover bg-center w-full h-full rounded shadow-lg transform translate-y-12 hover:translate-y-8 transition-transform duration-500 hidden md:block"
            data-alt="Handcrafted white rose standing in minimalist vase"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5MA5UODFptjPeNEO1kAkDjyIBL7V7MXvIy5rn1SNxIiqyiMsFnM3H-7DBfYppgLCAkn01z7dCrtg4K4Tr2sFeit2VDqSIzByZtHogPcj_dN9v164Zv_mRvrK0yA2DNo_Xn0pkPz0-Um4KpohOT1b46lUWqpOw7vYN3INDb_RXqN_2G10saXHFB01vqAa_0LPpDixHl0dBWp-hnusqE5QL3H4P3YS31q9H1M55TqQXB6Q9HyW2xGRbdA')`,
            }}
          />
        </div>
      </section>

      {/* 2. The Collection Product Catalog */}
      <ProductCatalog />

      {/* 3. 01 EXPLORE Grid */}
      <section className="w-full px-lg lg:px-xxl py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-md mb-xl">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
              [01]
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wider">
              Explore
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border p-px">
            {/* Bouquets */}
            <Link
              className="group relative block aspect-square bg-surface overflow-hidden"
              href="/bouquets"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtSCNHRmO3nCuhEOOlGxSTqogTJGDYChaiEKVbn-tA4CBqiyZz0vD0Ikj6sLhqWkH9eJ9N4Q4OoqVzD_Frf7-R8Lqi_Hw0tnqYG0O7xtIKYtmsRFa_hjW_02YlA0tbFHd6dVO7uRgtKTlzidhwO5Fb5mqVpG7Ma_zHxUelMTW4pCrXsotFdQ7_hETzDsF7vaM4fi9ecy5DlTOp8ARroF8wtQvLHM-myLILQtn33CLBXbpObRkEchzmog')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-xl w-full flex justify-between items-end">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-tertiary mb-sm uppercase tracking-wide">
                    Bouquets
                  </h3>
                  <p className="font-body-md text-body-md text-on-tertiary/80 italic">
                    Flowers that stay.
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary transform group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>

            {/* Keyrings */}
            <Link
              className="group relative block aspect-square bg-surface overflow-hidden"
              href="/keyrings"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzmPeyh2r7RHtBXC_WYV3K6yyh8rNb5KjtUQz46AupD5LnVU82U_yk-6wcq2kDaRvaYCpJY5paxbhAZhC0HqVnTZ9Y4CIWQCKv2wU39nbr9jDNvYuArjMAJk2jCGQDL9pKvcMlzLwwPuqoxFmsXcYmejHncWDrPGM5qOZDC3BZQsR1hnKk3PpmnzMQcfYuVWVyNuFhB67-zslim07J74zxCi4y4YBZMci2wIREowWLQYe5c4LOY0U_lQ')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-xl w-full flex justify-between items-end">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-tertiary mb-sm uppercase tracking-wide">
                    Keyrings
                  </h3>
                  <p className="font-body-md text-body-md text-on-tertiary/80 italic">
                    Little things to carry with you.
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary transform group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>

            {/* Charms */}
            <Link
              className="group relative block aspect-square bg-surface overflow-hidden"
              href="/shop?category=charms"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA99htNirrRLZUZf3ahs9gDHRwghitLGYwLHW-JLhKoGTICZZBsQr78SfpwsjGRBSJzmFf6ZveO4GwaO_Lof9ty9drTrqqJi8XOlnZtm8-1mV9wPiaTeS9D1jIz2eb68YWmuUDoMW823do6DU0MJmYk4jy-Cfcpu0VjxgGfCBNvgd0oKuPVhnHfebNC9CR7DfWVdS04R63ucYcxxVoeEUA7i4P7fkVItd1SRwqaHsNHLSLC6Y9hVZ61Ww')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-xl w-full flex justify-between items-end">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-tertiary mb-sm uppercase tracking-wide">
                    Charms
                  </h3>
                  <p className="font-body-md text-body-md text-on-tertiary/80 italic">
                    Delicate details that linger.
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary transform group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>

            {/* Custom Orders */}
            <Link
              className="group relative block aspect-square bg-surface overflow-hidden"
              href="/custom"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAh1_DtUCzLTr0VTWiX-doaFVwJOhSkM4T8tXHUDwPFbbP5h3B4ELjWVmIgArICx1JRV_hCL3SjH1bc-y9AjinbzQ3sHYKNgxK_xFYJm4wFEdgGRPQbyW8ePmq7ylWYngVyJTAYAPSmAhb5Rmsi2vzX0Q6gE2_T_a5jYsvyBZAmR7WpanA0PCxnHgOksi1xuGIT2NjNWPhFLlELOwO1wOA9_tRpseAzzteV4R3PoLJY3-Tb_X7n0MEx6Q')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-xl w-full flex justify-between items-end">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-tertiary mb-sm uppercase tracking-wide">
                    Custom Orders
                  </h3>
                  <p className="font-body-md text-body-md text-on-tertiary/80 italic">
                    Made especially for your moments.
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary transform group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 02 THE ATELIER NOTE */}
      <section className="w-full py-section-desktop px-lg lg:px-xxl bg-surface-container-low border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl items-center">
          <div className="lg:col-span-6 flex flex-col gap-md lg:gap-lg">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
              [02] The Atelier
            </span>
            <blockquote className="font-display-lg text-headline-md lg:text-display-lg text-on-surface leading-tight">
              &ldquo;We believe in the quiet luxury of things made by hand—imperfections that tell stories, objects that hold time.&rdquo;
            </blockquote>
            <p className="font-body-md text-on-surface-variant max-w-md">
              Every petal, charm, and ribbon is hand-selected and crafted with deliberate slowness in our atelier, honoring the artisanal tradition.
            </p>
            <div className="pt-sm">
              <Link
                href="/our-story"
                className="inline-flex items-center gap-xs font-label-sm uppercase tracking-widest text-primary border-b border-primary pb-1 hover:text-primary-container transition-colors"
              >
                Read Our Story
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="aspect-[4/3] w-full border border-border overflow-hidden rounded shadow-sm bg-surface-container">
              {/* eslint-disable-next-js/no-img-element */}
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8pufBWrj7Vqy5DuMyVRhWKT-QAJWfJF91OpB-V-94Y6dMqGWcMGuzbFP0Vub7bbnkCt7Gkr719nVp4iH5DlMxKlZO3e7kqknfsD8GB6XgmdK-RlowVUG9elOK52MlCWL4gW1e1DFs8HRfAh_HfWXoin4GJ2Bei-cuaBmr8XGv2cmS9tHwaReoYcLs-XBmhISYrWveZWpD5p6rk9ISZO3M9rtqMFxW9Z20RWdzujJ0NBYO52TEvxEoIA"
                alt="Artisan workbench with natural light and florals"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUES SECTION */}
      <section className="w-full px-lg lg:px-xxl py-section-desktop bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl lg:gap-xxl divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">01</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Slow Craft</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Every petal and charm is hand-assembled by artisans with meticulous devotion.
              </p>
            </div>
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">02</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Thoughtful Details</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Natural dyed silks, hand-pressed florals, and solid brass hardware designed to endure.
              </p>
            </div>
            <div className="flex flex-col gap-sm pt-lg md:pt-0 md:px-lg first:pt-0 first:pl-0 last:pr-0">
              <span className="font-display-lg text-4xl text-primary/40">03</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Made to Last</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Everlasting blooms that capture sentiment without an expiry date.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
