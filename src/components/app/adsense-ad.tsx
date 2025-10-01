
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: { [key: string]: unknown }[];
  }
}

export const AdsenseAd = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // The error is often benign, resulting from fast re-renders or ad blockers.
      // console.error(err);
    }
  }, []);

  return (
    <div className="w-full text-center">
        <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-3214648130219185"
            data-ad-slot="2636472169"
            data-ad-format="auto"
            data-full-width-responsive="true"
        ></ins>
    </div>
  );
};
