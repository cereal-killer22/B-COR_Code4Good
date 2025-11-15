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

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={style}
    >
      {!isReady && (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">Loading Map...</p>
        </div>
      )}
      {children}
    </div>
  );
}

