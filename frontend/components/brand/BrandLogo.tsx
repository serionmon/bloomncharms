import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  /** Size variant or custom dimension */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header' | 'footer';
  /** Optional custom className applied to container */
  className?: string;
  /** Whether to wrap in a Next.js Link to homepage (default: true) */
  link?: boolean;
  /** Custom destination if link is true (default: '/') */
  href?: string;
  /** Optional custom alt text */
  alt?: string;
  /** Show the textual wordmark alongside the circular logo */
  showWordmark?: boolean;
  /** Wordmark class override */
  wordmarkClassName?: string;
  /** Priority loading for above-the-fold header */
  priority?: boolean;
}

const SIZE_MAP = {
  sm: { width: 32, height: 32, className: 'w-8 h-8' },
  md: { width: 44, height: 44, className: 'w-11 h-11' },
  lg: { width: 56, height: 56, className: 'w-14 h-14' },
  xl: { width: 80, height: 80, className: 'w-20 h-20' },
  header: { width: 44, height: 44, className: 'w-10 h-10 md:w-11 md:h-11' },
  footer: { width: 52, height: 52, className: 'w-13 h-13' },
};

export default function BrandLogo({
  size = 'header',
  className = '',
  link = true,
  href = '/',
  alt = 'Bloomncharms — Handmade Pipe Cleaner Flowers & Charms',
  showWordmark = true,
  wordmarkClassName = '',
  priority = false,
}: BrandLogoProps) {
  const config = SIZE_MAP[size] || SIZE_MAP.header;

  const content = (
    <span className={`inline-flex items-center gap-3 group select-none ${className}`}>
      <span className={`relative rounded-full overflow-hidden shrink-0 shadow-sm border border-border/40 ${config.className}`}>
        <Image
          src="/brand/bloomncharms-logo.jpeg"
          alt={alt}
          width={config.width * 2}
          height={config.height * 2}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
      </span>
      {showWordmark && (
        <span
          className={`font-display text-[22px] md:text-[24px] font-normal tracking-tight text-on-surface transition-colors group-hover:text-primary ${wordmarkClassName}`}
          style={{ fontFamily: 'var(--font-garamond)' }}
        >
          Bloomncharms
        </span>
      )}
    </span>
  );

  if (link) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        aria-label="Bloomncharms Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
