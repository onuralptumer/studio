import { Logo } from '@/components/icons';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: 'hsl(240, 11%, 95%)',
        }}
      >
        <Logo width={24} height={24} style={{color: 'hsl(255 70% 60%)'}} />
      </div>
    ),
    {
      ...size,
    }
  );
}
