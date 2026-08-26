import React from 'react';
import Link from 'next/link';

export default function OurStoryPage() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-js/no-img-element */}
          <img
            className="w-full h-full object-cover opacity-80 mix-blend-multiply"
            data-alt="Sun-drenched artisan studio with wooden workbenches and dried flowers"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8pufBWrj7Vqy5DuMyVRhWKT-QAJWfJF91OpB-V-94Y6dMqGWcMGuzbFP0Vub7bbnkCt7Gkr719nVp4iH5DlMxKlZO3e7kqknfsD8GB6XgmdK-RlowVUG9elOK52MlCWL4gW1e1DFs8HRfAh_HfWXoin4GJ2Bei-cuaBmr8XGv2cmS9tHwaReoYcLs-XBmhISYrWveZWpD5p6rk9ISZO3M9rtqMFxW9Z20RWdzujJ0NBYO52TEvxEoIA"
            alt="Artisan studio"
          />
        </div>
        <div className="absolute inset-0 bg-surface/30 z-10" />
        <div className="relative z-20 text-center px-lg max-w-4xl mx-auto">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md tracking-tight">
            A small idea, made by hand.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-muted italic max-w-2xl mx-auto">
            Crafting moments that linger through artisanal design and slow-living philosophy.
          </p>
        </div>
      </section>

      {/* 2. Origins Section */}
      <section className="py-section-desktop px-lg lg:px-xxl max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
          <div className="col-span-1 md:col-span-5 flex flex-col justify-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-md block">
              Our Origins
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
              Rooted in intention.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-muted mb-lg leading-relaxed">
              What began as a quiet weekend pursuit quickly blossomed into a dedication to tangible, tactile beauty. We believe in the power of objects that hold stories—pieces that are not just made, but felt. Every petal, every charm, is selected with a deliberate slowness that honors the process as much as the final piece.
            </p>
            <p className="font-body-md text-body-md text-on-surface-muted leading-relaxed">
              In a world rushing towards the next fleeting trend, we invite you to pause. To appreciate the subtle variations that reveal the human hand.
            </p>
          </div>
          <div className="col-span-1 md:col-span-6 md:col-start-7 relative">
            <div className="aspect-[4/5] w-full relative group border border-border">
              {/* eslint-disable-next-js/no-img-element */}
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                data-alt="Hands gently arranging dried eucalyptus and wild roses"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFb-9d_1eIIRN9riYpDn8qjqf0Zt27Wz-t4OTdQC0KAlPG-mz6OPzWvZWefdijWJgrnNYsAOh150IEx_CkUu4fRok93G611vXCvsKPNtnXeTwh2WAlPPzlYOgRZvcZBE_q04ZDDw7WszSFMnbIvB5gj4mEt-vHvos6CStdSLrvVmfBQtvQWPcN8HR3_gsVH2iGpxxC1zANWqZzve0BQ658cVdMexeE_U1JgDuGx0M4MdukPm6gU4dWdw"
                alt="Artisan hands arranging florals"
                loading="lazy"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-border pointer-events-none" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-64 bg-surface-container p-4 hidden lg:block shadow-xl border border-border">
              {/* eslint-disable-next-js/no-img-element */}
              <img
                className="w-full h-full object-cover"
                data-alt="Vintage brass keyrings and ceramic charms on parchment"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdW0EWJ2_uLrYZsrNtr_C7It8hPJy0EOolU2dJV_rAMQ_yaYs_GozATSQM9AfTQnzwaW2ojcFSr6lM8woUzRywKKC_ZQ3LuICAq7219ukdnMnyrnTM2GbRFEM0K3QxgcFX3x1EGyioCnNERGAnFWyD04xebFphKkKzMI9hQd5O3eo0tbAwSjZlmQM_r03j5WHkDzX9gHpBUFm1YV7gXrU5vMnElwPqPXPi8zYsYO_HSHQp6ta35p-dNg"
                alt="Materials arranged systematically"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sourced with Reverence (Materials) */}
      <section className="py-section-desktop bg-surface-container-low w-full relative border-y border-border">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl relative z-10">
          <div className="text-center mb-xxl">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-md block">
              Our Materials
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Sourced with reverence.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="flex flex-col group cursor-default">
              <div className="aspect-square w-full mb-lg overflow-hidden relative border border-border">
                {/* eslint-disable-next-js/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYeGNJqkC2oPUmJyq4qyl2g-EA9uNWDRSxTsKx1bj_ZzcNPVAzQS2U9A1Gjs_zftGUP_9Ez2Wb41GJUk0GTYnJuDSaoAXLheuZ-kJvMFAeu9ZOyi-yWQeLKn7Inb4nntY1tMwTHH-k2OqtuHInCyD8Y3ekVX6Nk8XNiABGsO6rZP5smIJArwEHO-7NZGAejdFPpYf8gz47L_3T5MyHgX4CFQrpZXcoMaXPpGQBp4p1fLbYOeLzFZAZQw"
                  alt="Naturally dyed silk ribbons"
                  loading="lazy"
                />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                Organic Textiles
              </h3>
              <p className="font-body-md text-body-md text-on-surface-muted">
                We use only naturally dyed, raw silks and organic cottons, ensuring a soft touch and a gentle footprint on the earth.
              </p>
            </div>
            <div className="flex flex-col group cursor-default lg:mt-xl">
              <div className="aspect-square w-full mb-lg overflow-hidden relative border border-border">
                {/* eslint-disable-next-js/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKfUCTKKYKjkO7dmIUMoKhYhmAZQujEUAYPtctfIcdAl_WbcP_DOjhT3BdXaMJ0wzZbBhGsKprAgWzp3bD7ec-OPzBn11-lmnak7fwpmUZaN84Pfw7TNF1Hldu_nfl-dWVQP9_OsANv-tPUgdZoM38N-i9OlPkLpjSebLb78WfkHVYTR2ScvU83kcvn2Lex7OjpYaDpZ-0-RUSzopK-vohqlHbmnKC2DrM2Xs6Jpz9EmOxgxQa1y_0Ew"
                  alt="Wooden press with dried wildflowers"
                  loading="lazy"
                />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                Preserved Flora
              </h3>
              <p className="font-body-md text-body-md text-on-surface-muted">
                Ethically foraged and carefully pressed by hand, our botanicals capture the fleeting beauty of nature to last for years.
              </p>
            </div>
            <div className="flex flex-col group cursor-default">
              <div className="aspect-square w-full mb-lg overflow-hidden relative border border-border">
                {/* eslint-disable-next-js/no-img-element */}
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFWwLs_JjHNCkK7otkeL_PqwMmoScqg88CiqfozGVPwg0381mk-MUstLFKihphb6ops2j26kJTIdTAk1t5di4XKcQyQdXxVEIOx6nmkhW-1c7sEk_ODUuzHdtEZMTY47CqWBSpIzK3dVIWPHhZTYj5dNfyVZ6SQ8AFbmKWFg8IB6LLaQdaaw8gI82IsyRfuXuG2KHCvqb23Mp4NYdmoASSnSrfRX5Js408pwz9GOj8AbA7R7bwoOcuw"
                  alt="Solid brass hardware"
                  loading="lazy"
                />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                Solid Brass
              </h3>
              <p className="font-body-md text-body-md text-on-surface-muted">
                Our hardware is cast in solid brass, chosen for its weight, durability, and the beautiful patina it develops over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Founder Quote */}
      <section className="py-section-desktop px-lg lg:px-xxl max-w-5xl mx-auto w-full text-center">
        <div className="relative py-xl">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[120px] font-display text-surface-variant opacity-30 leading-none select-none">
            &ldquo;
          </span>
          <blockquote className="relative z-10 font-display-lg text-display-lg text-on-surface italic leading-tight mb-lg">
            To create with one&apos;s hands is to imbue an object with a soul. It is a quiet rebellion against the mass-produced.
          </blockquote>
          <cite className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest not-italic block">
            — The Founder
          </cite>
        </div>
      </section>

      {/* 5. The Rhythm of the Studio */}
      <section className="py-section-desktop bg-surface w-full border-t border-border">
        <div className="max-w-7xl mx-auto px-lg lg:px-xxl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border">
            <div className="p-lg lg:p-xxl flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border bg-surface-container-lowest">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-md block">
                Our Process
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
                The rhythm of the studio.
              </h2>
              <div className="space-y-xl">
                <div className="relative pl-xl">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-primary" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                    01. Foraging &amp; Selection
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-muted">
                    We begin by gathering seasonal blooms and selecting only the finest raw materials, ensuring every component meets our standard of natural beauty.
                  </p>
                </div>
                <div className="relative pl-xl">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-surface-variant ring-1 ring-border" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                    02. Pressing &amp; Preservation
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-muted">
                    Flowers are carefully pressed in traditional wooden presses, a slow process that takes weeks but yields perfectly preserved botanicals.
                  </p>
                </div>
                <div className="relative pl-xl">
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-surface-variant ring-1 ring-border" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                    03. Assembly by Hand
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-muted">
                    Finally, each bouquet and charm is assembled intuitively, bound with silk ribbon or finished with brass hardware, ready to find its home.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] lg:h-auto overflow-hidden group">
              {/* eslint-disable-next-js/no-img-element */}
              <img
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVCorL8h7uSCTlMasGSVNGouMVYS10ZvAISe8HbW4JbfYLWL7UmJtNK-8dggN8D9VSsDL_uYWLf8dPWXLOr3yaw-RQPza38785mWz5Uf5mQ6Ikzqr1nYczzbUk88BH1LKUGMhPLbwDsIomUro3tlMmX9XtMwLNKpyznIsP9HL3CYguY7BB7wPI6A96ddOWy0Y-w6uoPFLMUVO4oHNRrKgCXHY_-hO-2VzgCGnk14SQRF1ZdukcGr_48Q"
                alt="Workspace in mid-project with ribbon and flowers"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Philosophy Section */}
      <section className="py-section-desktop px-lg lg:px-xxl max-w-4xl mx-auto w-full text-center">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-md block">
          Our Philosophy
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
          Embracing the imperfect.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-muted mb-xl leading-relaxed">
          We find beauty in the asymmetry of a dried petal, the slight variance in hand-dyed ribbon, the quiet elegance of things that age gracefully. Our work is an invitation to celebrate the unique, the handmade, and the inherently human touch in everyday objects.
        </p>
        <Link
          className="inline-flex items-center justify-center px-lg py-sm bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
          href="/shop"
        >
          Explore the Collection
        </Link>
      </section>
    </div>
  );
}
