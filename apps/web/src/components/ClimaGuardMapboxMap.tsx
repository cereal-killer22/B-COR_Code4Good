/**
 * ClimaGuard Mapbox Map Component
 * Unified Mapbox GL JS map component for all ClimaGuard features
 * Based on mauguard/web Map.tsx implementation
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapboxEngine } from '@/lib/map/useMapboxEngine';
import { addMapboxMarker, addMapboxRoute, addMapboxPolygon, clearMapboxLayers } from '@/lib/map/MapboxEngine';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';

interface ClimaGuardMapboxMapProps {
  containerId?: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: (map: MapboxMap | null) => void;
  children?: React.ReactNode;
}

export default function ClimaGuardMapboxMap({
  containerId = 'climaguard-map',
  center = [57.55, -20.25],
  zoom = 9.3,
  className = '',
  style = { height: '100%', width: '100%' },
  onMapReady,
  children,
}: ClimaGuardMapboxMapProps) {
  const [mounted, setMounted] = useState(false);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { map, isReady, error } = useMapboxEngine({
    containerId,
    center,
    zoom,
    onMapReady: (mapInstance) => {
      if (onMapReady) {
        onMapReady(mapInstance);
      }
    },
  });

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, []);

  if (!mounted) {
    return <div id={containerId} className={className} style={style} />;
  }

  if (error) {
    return (
      <div id={containerId} className={`flex items-center justify-center ${className}`} style={style}>
        <div className="text-red-500 p-4">
          <p className="font-semibold">Error loading map</p>
          <p className="text-sm">{error.message}</p>
          <p className="text-xs mt-2 text-gray-500">
            Make sure NEXT_PUBLIC_MAPBOX_TOKEN is set in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id={containerId}
        className={className}
        style={style}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
      {children}
      <style jsx global>{`
        .mapboxgl-popup-content {
          padding: 0 !important;
          border: none !important;
          border-radius: 10px !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
        #${containerId} {
          position: relative;
        }
      `}</style>
    </>
  );
}

// Export utility functions for use in parent components
export { addMapboxMarker, addMapboxRoute, addMapboxPolygon, clearMapboxLayers };

