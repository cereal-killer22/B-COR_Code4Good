/**
 * React Hook for Mapbox Map Engine
 * Provides a React-friendly interface to the Mapbox engine
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { createMapboxMap, type MapboxEngineOptions } from './MapboxEngine';
import type { Map as MapboxMap } from 'mapbox-gl';

export interface UseMapboxEngineOptions extends Partial<MapboxEngineOptions> {
  containerId: string;
  onMapReady?: (map: MapboxMap | null) => void;
}

export function useMapboxEngine(options: UseMapboxEngineOptions) {
  const { containerId, onMapReady, ...mapOptions } = options;
  const mapRef = useRef<MapboxMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (mapRef.current || typeof window === 'undefined') return; // Map already initialized or SSR

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Ensure container exists
      const container = typeof containerId === 'string'
        ? document.getElementById(containerId)
        : containerId;

      if (!container) {
        console.error(`Map container with id "${containerId}" not found`);
        setError(new Error(`Container "${containerId}" not found`));
        if (onMapReady) {
          onMapReady(null);
        }
        return;
      }

      try {
        const map = createMapboxMap(container, mapOptions);
        mapRef.current = map;

        // Wait for map to load
        map.on('load', () => {
          setIsReady(true);
          if (onMapReady) {
            onMapReady(map);
          }
        });

        // Handle errors
        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          setError(e.error || new Error('Unknown map error'));
        });

        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          map.resize();
        }, 100);

      } catch (err) {
        console.error('Failed to create map:', err);
        setError(err instanceof Error ? err : new Error('Failed to create map'));
        if (onMapReady) {
          onMapReady(null);
        }
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId]); // Only re-run if containerId changes

  // Resize observer to handle container size changes
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    const container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;

    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
        }, 100);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerId, isReady]);

  return {
    map: mapRef.current,
    isReady,
    error,
  };
}
