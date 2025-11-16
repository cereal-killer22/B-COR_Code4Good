/**
 * Data Map Components
 * Map components that fetch and plot data from API calls
 * Wrappers for existing map components with consistent interfaces
 */

'use client';

import OceanHealthMap from '@/components/OceanHealthMap';
import FloodMap from '@/components/FloodMap';
import CycloneMap from '@/components/CycloneMap';
import PollutionMap from '@/components/PollutionMap';
import dynamic from 'next/dynamic';

interface DataMapProps {
  lat?: number;
  lng?: number;
}

// OceanHealthDataMap - wrapper for OceanHealthMap
export function OceanHealthDataMap({ lat = -20.2, lng = 57.5 }: DataMapProps) {
  return <OceanHealthMap lat={lat} lng={lng} />;
}

// FloodDataMap - wrapper for FloodMap
export function FloodDataMap({ lat = -20.2, lng = 57.5 }: DataMapProps) {
  return <FloodMap lat={lat} lng={lng} />;
}

// CycloneDataMap - wrapper for CycloneMap
export function CycloneDataMap({ lat = -20.2, lng = 57.5 }: DataMapProps) {
  return <CycloneMap lat={lat} lng={lng} />;
}

// PollutionDataMap - wrapper for PollutionMap (converts lat/lng to location array)
export function PollutionDataMap({ lat = -20.2, lng = 57.5 }: DataMapProps) {
  return <PollutionMap location={[lat, lng]} />;
}

// FishingActivityDataMap - placeholder using OceanHealthMap for now
export const FishingActivityDataMap = dynamic(
  () => Promise.resolve(OceanHealthDataMap),
  { ssr: false }
);

