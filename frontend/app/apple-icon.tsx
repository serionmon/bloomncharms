import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%',
          overflow: 'hidden',
          backgroundColor: '#FFF8F7',
          padding: '12px',
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
            borderRadius: '50%',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
