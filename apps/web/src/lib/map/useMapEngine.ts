/**
 * React Hook for Map Engine
 * Provides React integration for the Map Engine
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import {
  createBaseMap,
  type MapEngineOptions,
  clearLayers,
  setZoomAndCenter,
  setBounds,
  getMapBounds,
  getMapCenter,
  getMapZoom,
  registerLayer,
  showLayer,
  hideLayer,
  toggleLayer,
  isLayerVisible,
} from './MapEngine';

/**
 * Hook to create and manage a map instance
 * 
 * @param containerId - HTML element ID where map will be rendered
 * @param options - Map configuration options
 * @returns Map instance and utility functions
 */
export function useMapEngine(
  containerId: string,
  options: MapEngineOptions = {}
) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Map container with id "${containerId}" not found`);
      return;
    }

    // Check if map already exists for this container
    if (mapRef.current && mapRef.current.getContainer() === container) {
      // Map already exists for this container, just update options
      return;
    }

    // Clean up any existing map on this container
    if ((container as any)._leaflet_id) {
      const existingMap = (container as any)._leaflet;
      if (existingMap && existingMap.remove) {
        existingMap.remove();
      }
      delete (container as any)._leaflet_id;
      delete (container as any)._leaflet;
    }

    // Create map instance
    try {
      const map = createBaseMap(container, options);
      mapRef.current = map;

      // Wait for map to be ready
      map.whenReady(() => {
        setIsReady(true);
      });
    } catch (error) {
      console.error('Error creating map:', error);
      setIsReady(false);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          // Map might already be removed
          console.warn('Error removing map:', error);
        }
        mapRef.current = null;
      }
      setIsReady(false);
    };
  }, [containerId]); // Only recreate if containerId changes

  // Update map options when they change
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    const map = mapRef.current;

    // Update center and zoom if provided
    if (options.center) {
      if (options.zoom !== undefined) {
        setZoomAndCenter(map, options.center, options.zoom);
      } else {
        setZoomAndCenter(map, options.center);
      }
    }

    // Update bounds if provided
    if (options.bounds) {
      setBounds(map, options.bounds);
    }
  }, [options.center, options.zoom, options.bounds, isReady]);

  const updateCenter = useCallback((coords: [number, number], zoom?: number) => {
    if (mapRef.current) {
      setZoomAndCenter(mapRef.current, coords, zoom);
    }
  }, []);

  const updateBounds = useCallback((bounds: L.LatLngBoundsExpression) => {
    if (mapRef.current) {
      setBounds(mapRef.current, bounds);
    }
  }, []);

  const clearAllLayers = useCallback(() => {
    if (mapRef.current) {
      clearLayers(mapRef.current);
    }
  }, []);

  const getCurrentBounds = useCallback(() => {
    if (mapRef.current) {
      return getMapBounds(mapRef.current);
    }
    return null;
  }, []);

  const getCurrentCenter = useCallback((): [number, number] | null => {
    if (mapRef.current) {
      return getMapCenter(mapRef.current);
    }
    return null;
  }, []);

  const getCurrentZoom = useCallback((): number | null => {
    if (mapRef.current) {
      return getMapZoom(mapRef.current);
    }
    return null;
  }, []);

  const registerMapLayer = useCallback((id: string, layer: L.Layer) => {
    if (mapRef.current) {
      registerLayer(id, layer, mapRef.current);
    }
  }, []);

  const showMapLayer = useCallback((id: string) => {
    if (mapRef.current) {
      showLayer(id, mapRef.current);
    }
  }, []);

  const hideMapLayer = useCallback((id: string) => {
    if (mapRef.current) {
      hideLayer(id, mapRef.current);
    }
  }, []);

  const toggleMapLayer = useCallback((id: string) => {
    if (mapRef.current) {
      toggleLayer(id, mapRef.current);
    }
  }, []);

  const checkLayerVisible = useCallback((id: string): boolean => {
    if (mapRef.current) {
      return isLayerVisible(id, mapRef.current);
    }
    return false;
  }, []);

  return {
    map: mapRef.current,
    isReady,
    updateCenter,
    updateBounds,
    clearAllLayers,
    getCurrentBounds,
    getCurrentCenter,
    getCurrentZoom,
    registerLayer: registerMapLayer,
    showLayer: showMapLayer,
    hideLayer: hideMapLayer,
    toggleLayer: toggleMapLayer,
    isLayerVisible: checkLayerVisible,
  };
}

