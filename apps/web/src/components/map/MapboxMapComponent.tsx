/**
 * Mapbox Map Component
 * React wrapper for Mapbox GL JS map
 * Based on mauguard/web Map.tsx implementation
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapboxEngine } from '@/lib/map/useMapboxEngine';
import type { Map as MapboxMap } from 'mapbox-gl';

interface MapboxMapComponentProps {
  containerId: string;
  center?: [number, number];
  zoom?: number;
  mapStyle?: string;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: (map: MapboxMap | null) => void;
  children?: React.ReactNode;
}

export default function MapboxMapComponent({
  containerId,
  center = [57.55, -20.25],
  zoom = 9.3,
  mapStyle = 'mapbox://styles/mapbox/dark-v11',
  className = '',
  style: containerStyle = { height: '100%', width: '100%' },
  onMapReady,
  children,
}: MapboxMapComponentProps) {
  const { map, isReady, error } = useMapboxEngine({
    containerId,
    center,
    zoom,
    style: mapStyle,
    onMapReady,
  });

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={containerStyle}>
        <div className="text-red-500">Error loading map: {error.message}</div>
      </div>
    );
  }

  return (
    <div
      id={containerId}
      className={className}
      style={containerStyle}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
      {children}
    </div>
  );
}

