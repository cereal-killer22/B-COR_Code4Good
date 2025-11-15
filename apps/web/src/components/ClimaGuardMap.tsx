'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamically import the map to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Loading Map...</p>
    </div>
  ),
});

export default function ClimaGuardMap() {
  return (
    <div className={`w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden border border-gray-300 ${className}`}>
      {mapComponents[type]}
    </div>
  );
}