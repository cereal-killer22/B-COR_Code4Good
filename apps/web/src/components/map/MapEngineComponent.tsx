/**
 * Map Engine React Component
 * Wrapper component that uses the centralized Map Engine
 * 
 * Each page should use this component with its own configuration
 * rather than reusing a single generic map instance.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMapEngine } from '@/lib/map';
import type { MapEngineOptions } from '@/lib/map';

interface MapEngineComponentProps {
  containerId: string;
  options?: MapEngineOptions;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: (map: L.Map | null) => void;
  children?: React.ReactNode;
}

/**
 * Map Engine Component
 * 
 * Usage example:
 * ```tsx
 * <MapEngineComponent
 *   containerId="my-map"
 *   options={FLOOD_MAP_CONFIG}
 *   onMapReady={(map) => {
 *     // Add layers, markers, etc.
 *     loadRiskPolygon(map, floodZones, '#ff0000');
 *   }}
 * />
 * ```
 */
export default function MapEngineComponent({
  containerId,
  options = {},
  className = '',
  style = { height: '100%', width: '100%' },
  onMapReady,
  children,
}: MapEngineComponentProps) {
  const { map, isReady } = useMapEngine(containerId, options);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent when map is ready
  useEffect(() => {
    if (isReady && map && onMapReady) {
      onMapReady(map);
    }
  }, [isReady, map, onMapReady]);

  // Ensure map container fills properly
  useEffect(() => {
    if (isReady && map) {
      // Trigger map resize to ensure it fills container
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      // Also invalidate after a short delay to handle any layout shifts
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isReady, map]);

  // Invalidate size when container size changes
  useEffect(() => {
    if (!isReady || !map || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isReady, map]);

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={`${className} w-full h-full`}
      style={{ ...style, minHeight: '100%', minWidth: '100%', position: 'relative', zIndex: 0 }}
    >
      {!isReady && (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <p className="text-gray-600 dark:text-gray-400">Loading Map...</p>
        </div>
      )}
      {children}
    </div>
  );
}

