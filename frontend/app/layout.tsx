import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/components/commerce/CartProvider';
import CartDrawer from '@/components/commerce/CartDrawer';
import CartToast from '@/components/commerce/CartToast';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://bloomncharms.com'),
  title: {
    default: 'Bloomncharms — Handmade Flowers, Keyrings & Charms',
    template: '%s | Bloomncharms',
  },
  description:
    'Handmade pipe-cleaner flowers, bouquets, keyrings and charms, thoughtfully created for gifting and keeping.',
  keywords: [
    'Bloomncharms',
    'handmade flowers',
    'pipe cleaner flowers',
    'handmade keyrings',
    'floral charms',
    'bespoke gifts',
    'artisanal bouquet',
  ],
  authors: [{ name: 'Bloomncharms' }],
  creator: 'Bloomncharms',
  publisher: 'Bloomncharms',
  icons: {
    icon: '/brand/bloomncharms-logo.jpeg',
    shortcut: '/brand/bloomncharms-logo.jpeg',
    apple: '/brand/bloomncharms-logo.jpeg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bloomncharms.com',
    siteName: 'Bloomncharms',
    title: 'Bloomncharms — Handmade Flowers, Keyrings & Charms',
    description:
      'Handmade pipe-cleaner flowers, bouquets, keyrings and charms, thoughtfully created for gifting and keeping.',
    images: [
      {
        url: '/brand/bloomncharms-logo.jpeg',
        width: 1200,
        height: 1200,
        alt: 'Bloomncharms — Handmade Pipe Cleaner Flowers & Charms',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bloomncharms — Handmade Flowers, Keyrings & Charms',
    description:
      'Handmade pipe-cleaner flowers, bouquets, keyrings and charms, thoughtfully created for gifting and keeping.',
    images: ['/brand/bloomncharms-logo.jpeg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bloomncharms',
  url: 'https://bloomncharms.com',
  logo: 'https://bloomncharms.com/brand/bloomncharms-logo.jpeg',
  description:
    'Handmade pipe-cleaner flowers, bouquets, keyrings and charms, thoughtfully created for gifting and keeping.',
  sameAs: ['https://instagram.com/bloomncharms'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background font-body text-on-background antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="w-full pt-16 min-h-screen flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <CartToast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

