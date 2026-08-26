import React from 'react';
import Link from 'next/link';

export default function CustomOrdersPage() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* 1. Hero Section */}
      <section className="w-full relative min-h-[80vh] flex items-center bg-surface pt-section-desktop pb-section-desktop lg:pb-128 overflow-hidden">
        <div className="absolute right-0 top-0 w-2/3 h-full mix-blend-multiply opacity-60">
          <div
            className="bg-cover bg-left w-full h-full"
            data-alt="Delicate dried and preserved flowers in dusty pinks and sage greens"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAh1_DtUCzLTr0VTWiX-doaFVwJOhSkM4T8tXHUDwPFbbP5h3B4ELjWVmIgArICx1JRV_hCL3SjH1bc-y9AjinbzQ3sHYKNgxK_xFYJm4wFEdgGRPQbyW8ePmq7ylWYngVyJTAYAPSmAhb5Rmsi2vzX0Q6gE2_T_a5jYsvyBZAmR7WpanA0PCxnHgOksi1xuGIT2NjNWPhFLlELOwO1wOA9_tRpseAzzteV4R3PoLJY3-Tb_X7n0MEx6Q')`,
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent w-full lg:w-3/4" />
        <div className="max-w-7xl mx-auto w-full px-lg lg:px-xxl relative z-10">
          <div className="flex flex-col lg:w-1/2">
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase mb-lg">
              Bespoke Creations
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
              Made especially
              <br />
              for them.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-xl">
              Choose your colours, flowers, charms and details. Tell us what you&apos;re imagining and we&apos;ll create something intimately personal.
            </p>
            <div>
              <a
                href="#process"
                className="inline-block bg-primary text-on-primary font-label-sm text-label-sm py-4 px-8 uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors shadow-sm hover:shadow-md"
              >
                Start a custom order
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Journey Divider */}
      <section id="process" className="w-full bg-surface-container-low py-xxl relative border-y border-border">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl flex flex-col md:flex-row items-center justify-between gap-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface italic">
            The bespoke process
          </h2>
          <div className="hidden md:block h-[1px] flex-1 bg-border mx-lg" />
          <p className="font-body-md text-body-md text-on-surface-muted max-w-sm text-right">
            A collaborative journey from concept to a tangible, artisanal piece.
          </p>
        </div>
      </section>

      {/* 3. Steps 01 & 02 */}
      <section className="w-full bg-surface py-section-desktop">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl">
          {/* Step 01 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
            <div className="col-span-1 lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 lg:pr-xl">
              <span className="font-display-lg text-display-lg text-surface-tint opacity-30 mb-sm block leading-none">
                01
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">
                Choose your base
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Select from our signature arrangements. Whether a cascading bouquet, an intimate posy, or a structural keyring, the foundation sets the intention.
              </p>
            </div>
            <div className="col-span-1 lg:col-span-7 relative order-1 lg:order-2 h-[50vh] lg:h-[70vh]">
              <div className="absolute inset-0 shadow-xl overflow-hidden rounded-sm border border-border">
                <div
                  className="bg-cover bg-center w-full h-full hover:scale-105 transition-transform duration-1000"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3ohGqTcShNqxX7vb30KPzXRj-0OLzgfERE4RU3onmy1iTYnlOqrvhovrI47lW-qBrwIv4lAPeWgev7gHZJtBCZl33PV6Rz2tMcpklVO1m0oTuKklAahmkNrS7NzvAmBX3myrJFibjQzcq1ZJbKwr0FQXhOn_9bDgS-Wj-KJDmgZpjyPP2qiRro2ZWJlkgqnctCDZ_Kk-sh_hVRjOc1rkB3jcCp0JqAn7tepqtPXpvQiTijeyeH92IoQ')`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl mt-section-desktop lg:mt-[160px] items-center">
            <div className="col-span-1 lg:col-span-6 relative h-[60vh] lg:h-[80vh]">
              <div className="w-full h-full shadow-lg overflow-hidden rounded-sm border border-border">
                <div
                  className="bg-cover bg-center w-full h-full hover:scale-105 transition-transform duration-1000"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxlkohPqjPioFsjtuuWO0Fg6YzQ3thos5IBl2T0bgRggoJCCXLlA6eZUZ_Bsm-dJuVQt-vIVemYqteWNTCXqhfzcdCalsskt_e6oaVCiHg0LsJlxS5YJnLWP-rxPR4HfOZGWUMmy3OE38RRtqnHm4C1M7azYOvvZ0Ta5yYo96utaeYAyyr7mXX-lyG_V3_iOYXsGWFlelyWJdrX0ZB8uYEKJ7NDRgGjWTXFp0kysB4WdsWQTsx5XcgUg')`,
                  }}
                />
              </div>
            </div>
            <div className="col-span-1 lg:col-span-5 lg:col-start-8 flex flex-col justify-center lg:pl-lg">
              <span className="font-display-lg text-display-lg text-surface-tint opacity-30 mb-sm block leading-none">
                02
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">
                Select your palette
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Earth tones, vibrant accents, or monochromatic elegance. Guide us through the hues that speak to the recipient&apos;s essence.
              </p>
              <div className="flex flex-wrap gap-sm mt-md">
                <span className="px-3 py-1 bg-primary-fixed/20 text-on-primary-fixed font-label-sm text-label-sm rounded-full">
                  Primary Reds
                </span>
                <span className="px-3 py-1 bg-secondary-fixed/20 text-on-secondary-fixed font-label-sm text-label-sm rounded-full">
                  Sage Greens
                </span>
                <span className="px-3 py-1 bg-accent-lavender/20 text-on-surface font-label-sm text-label-sm rounded-full">
                  Dusty Lavender
                </span>
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm rounded-full">
                  Earthy Neutrals
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Subtleties of Choice Quote */}
      <section className="w-full bg-surface-container-highest py-xl lg:py-xxl relative overflow-hidden border-y border-border">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl relative z-10 flex flex-col items-center text-center">
          <p className="font-headline-sm text-headline-sm text-on-surface-variant max-w-2xl italic leading-relaxed">
            &ldquo;It is in the subtleties of choice that a gift transcends an object and becomes a memory.&rdquo;
          </p>
        </div>
      </section>

      {/* 5. Steps 03 & 04 */}
      <section className="w-full bg-surface py-section-desktop">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl">
          {/* Step 03 */}
          <div className="flex flex-col lg:flex-row items-stretch gap-0 relative">
            <div className="lg:w-1/2 bg-surface-container p-xl lg:p-section-desktop flex flex-col justify-center relative z-10 shadow-sm lg:-mr-8 mt-lg lg:mt-0 border border-border">
              <span className="font-display-lg text-display-lg text-surface-tint opacity-30 mb-sm block leading-none">
                03
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">
                Curate the details
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Incorporate specific charms, ribbons, or structural elements. These small adornments carry significant weight in the final composition.
              </p>
            </div>
            <div className="lg:w-[55%] h-[50vh] lg:h-[70vh] relative z-0">
              <div
                className="bg-cover bg-center w-full h-full shadow-lg rounded-sm border border-border"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB1ZaukXIbRWckRzo6Dt2jsqSmGe511VKNUQXfpDtHiW2Vheh5Nsw07OTgf4uEmmVlcqoreDMENvupQLzz8853eZTUJLmpbqgjg-K7drTUQrcRtAF3RriuLKAR0l8Pd5-0brCpHtmyLILKaNTg-QZnydgY8a_Opod08PHp7fzJli5mzFx9nbaZuWBn-wtIE2QOJs_SaJZYuTxZy9ZR52l_ljOANFz74DPUXtT6RtaSezV-AOeI5mOzT6Q')`,
                }}
              />
            </div>
          </div>

          {/* Step 04 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mt-section-desktop lg:mt-[160px] items-center">
            <div className="order-2 md:order-1 relative h-[40vh] md:h-[60vh] md:-ml-8 border border-border">
              <div
                className="bg-cover bg-center w-full h-full shadow-md"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDN3PXJ-gF-Ml_RKqQ2G-kjP61i9FXkBDl7_YlBjn0Xq1jFoMeWa98It9tBdwXsdZMnjEZv3Gu8uuSnYiDRAEedZU-WyDGtDDi5S1YC12D0h8bv3H7ic3rpUKK1nifFhb4MQ2kkO3VGQ0zYM2xq10FMXHoo7z-U5vyBFx4hQibMz8Auh2c41_Cf1IKWl-8MyFfzVJvfr60ZfWCOnsHmqA_do2sxsOmZtoy-fYvfF_0f-c7y5Jb0jyJ5qg')`,
                }}
              />
            </div>
            <div className="order-1 md:order-2 md:pl-xl flex flex-col justify-center">
              <span className="font-display-lg text-display-lg text-surface-tint opacity-30 mb-sm block leading-none">
                04
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">
                Tell us the occasion
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                A milestone birthday, a quiet apology, a celebration of life. Understanding the context allows us to imbue the piece with the appropriate tone and energy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Step 05 / Final CTA */}
      <section className="w-full bg-surface-container-low py-section-desktop relative overflow-hidden border-t border-border">
        <div className="max-w-4xl mx-auto px-lg relative z-10 text-center flex flex-col items-center">
          <span className="font-display-lg text-display-lg text-surface-tint opacity-40 mb-md block leading-none">
            05
          </span>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-md">
            We create it.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-muted max-w-2xl mx-auto mb-xl">
            Every custom order is meticulously handcrafted in our studio. We take your vision and translate it into a lasting artifact of beauty.
          </p>
          <Link
            href="/shop"
            className="group relative px-8 py-4 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          >
            <span className="relative z-10 group-hover:text-surface transition-colors">
              Begin Your Commission
            </span>
            <div className="absolute inset-0 h-full w-full bg-on-primary-fixed-variant transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
