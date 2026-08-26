import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), 'public', 'brand', 'bloomncharms-logo.jpeg');
  const logoData = fs.readFileSync(logoPath);
  const base64Logo = `data:image/jpeg;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF8F7',
          backgroundImage: 'radial-gradient(circle at center, #FFFFFF 0%, #FFF8F7 70%, #F5F3EE 100%)',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative border */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '1px solid rgba(23, 23, 23, 0.15)',
            display: 'flex',
          }}
        />

        {/* Circular official logo */}
        <div
          style={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            border: '2px solid rgba(23, 23, 23, 0.12)',
            display: 'flex',
            marginBottom: '28px',
          }}
        >
          {/* eslint-disable-next-js/no-img-element */}
          <img
            src={base64Logo}
            alt="Bloomncharms"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: '400',
            color: '#171717',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          Bloomncharms
        </div>

        {/* Subtitle / Tagline */}
        <div
          style={{
            fontSize: '20px',
            fontFamily: 'sans-serif',
            color: '#5F5D58',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            maxWidth: '680px',
            textAlign: 'center',
          }}
        >
          Handmade flowers, keyrings, charms and thoughtful gifts — made to mean more.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
