/**
 * ClimaGuard Mapbox Engine
 * Centralized Mapbox GL JS engine for all map features
 * 
 * Based on mauguard/web Map.tsx implementation
 * Uses Mapbox GL JS instead of Leaflet for better performance and features
 * 
 * NOTE: This module is client-side only. Mapbox requires browser APIs.
 */

'use client';

// Only import Mapbox in browser environment - lazy loaded
let mapboxgl: typeof import('mapbox-gl').default | null = null;

// Lazy getter for Mapbox - loads on first use
const getMapbox = (): typeof import('mapbox-gl').default => {
  if (typeof window === 'undefined') {
    throw new Error('Mapbox can only be used in the browser');
  }
  if (!mapboxgl) {
    // Use require for synchronous loading in browser
    mapboxgl = require('mapbox-gl');
    require('mapbox-gl/dist/mapbox-gl.css');
    
    // Set access token from environment
    // Try multiple environment variable names for compatibility
    const token = 
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_APIKEY ||
      process.env.MAPBOX_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_API_KEY ||
      process.env.MAPBOX_API_KEY ||
      '';
    
    if (token) {
      mapboxgl.accessToken = token;
    } else {
      // Try to get from API keys config as fallback
      try {
        const { getAPIKeys } = require('@/lib/config/apiKeys');
        const keys = getAPIKeys();
        if (keys.mapbox) {
          mapboxgl.accessToken = keys.mapbox;
        } else {
          console.warn('⚠️ Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.');
        }
      } catch (e) {
        console.warn('⚠️ Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.');
      }
    }
  }
  return mapboxgl;
};

// Type imports are safe for SSR
import type { Map as MapboxMap, Marker, Popup, NavigationControl } from 'mapbox-gl';

/**
 * Mauritius bounds for consistent map centering
 */
const MAURITIUS_BOUNDS: [[number, number], [number, number]] = [
  [57.3, -20.6], // Southwest
  [57.8, -20.0], // Northeast
];

/**
 * Default map center (Port Louis area)
 */
const DEFAULT_CENTER: [number, number] = [57.55, -20.25];
const DEFAULT_ZOOM = 9.3;

/**
 * Map Engine Options
 */
export interface MapboxEngineOptions {
  container: string | HTMLElement;
  center?: [number, number];
  zoom?: number;
  style?: string;
  bounds?: [[number, number], [number, number]];
  attributionControl?: boolean;
  className?: string;
  containerStyle?: React.CSSProperties;
}

/**
 * Create a base Mapbox map instance
 * 
 * @param containerId - Container element ID or HTMLElement
 * @param options - Map configuration options
 * @returns Mapbox map instance
 */
export function createMapboxMap(
  containerId: string | HTMLElement,
  options: Partial<MapboxEngineOptions> = {}
): MapboxMap {
  const Mapbox = getMapbox();
  
  const {
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    style = 'mapbox://styles/mapbox/dark-v11',
    bounds,
    attributionControl = false,
  } = options;

  // Get the container element
  const container = typeof containerId === 'string' 
    ? document.getElementById(containerId)
    : containerId;

  if (!container) {
    throw new Error(`Map container not found: ${typeof containerId === 'string' ? containerId : 'HTMLElement'}`);
  }

  // Create map instance
  const map = new Mapbox.Map({
    container,
    style,
    center,
    zoom,
    attributionControl,
  });

  // Store map reference on container for cleanup
  (container as any)._mapboxMap = map;

  // Add navigation controls
  map.addControl(new Mapbox.NavigationControl(), 'top-right');

  // Set bounds if provided (always use Mauritius bounds for consistency)
  if (bounds) {
    map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
  } else {
    // Default to Mauritius bounds if not specified
    map.fitBounds(MAURITIUS_BOUNDS, { padding: 20, maxZoom: 15 });
  }

  // Force resize after initial setup
  setTimeout(() => {
    map.resize();
  }, 100);

  return map;
}

/**
 * Add a marker to the map
 * 
 * @param map - Mapbox map instance
 * @param coords - [lng, lat] coordinates
 * @param options - Marker options
 * @param popupContent - Optional popup HTML content
 * @returns Marker instance
 */
export function addMapboxMarker(
  map: MapboxMap,
  coords: [number, number],
  options: {
    color?: string;
    size?: number;
    element?: HTMLElement;
    popup?: string | HTMLElement;
  } = {},
  popupContent?: string | HTMLElement
): Marker {
  const Mapbox = getMapbox();
  
  const { color = '#3b82f6', size = 22, element } = options;

  // Create marker element if not provided
  const markerElement = element || (() => {
    const el = document.createElement('div');
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px ${color}90;
      cursor: pointer;
    `;
    return el;
  })();

  const marker = new Mapbox.Marker({ element: markerElement })
    .setLngLat(coords)
    .addTo(map);

  // Add popup if provided
  if (popupContent) {
    const popup = new Mapbox.Popup({ offset: 24 });
    if (typeof popupContent === 'string') {
      popup.setHTML(popupContent);
    } else {
      popup.setDOMContent(popupContent);
    }
    marker.setPopup(popup);
  }

  // Prevent event bubbling to prevent cards from hiding
  markerElement.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return marker;
}

/**
 * Add a route/path to the map
 * 
 * @param map - Mapbox map instance
 * @param coordinates - Array of [lng, lat] coordinates
 * @param options - Route style options
 * @returns Route layer ID
 */
export function addMapboxRoute(
  map: MapboxMap,
  coordinates: [number, number][],
  options: {
    color?: string;
    width?: number;
    opacity?: number;
    layerId?: string;
  } = {}
): string {
  const {
    color = '#3b82f6',
    width = 5,
    opacity = 0.7,
    layerId = `route-${Date.now()}`,
  } = options;

  // Remove existing layer/source if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);

  // Add source
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {},
    },
  });

  // Add layer
  map.addLayer({
    id: layerId,
    type: 'line',
    source: layerId,
    paint: {
      'line-color': color,
      'line-width': width,
      'line-blur': 1.5,
      'line-opacity': opacity,
    },
  });

  return layerId;
}

/**
 * Add a polygon to the map
 * 
 * @param map - Mapbox map instance
 * @param coordinates - Array of [lng, lat] coordinates forming the polygon
 * @param options - Polygon style options
 * @returns Polygon layer ID
 */
export function addMapboxPolygon(
  map: MapboxMap,
  coordinates: [number, number][] | [number, number][][],
  options: {
    color?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    layerId?: string;
  } = {}
): string {
  const {
    color = '#ff0000',
    fillOpacity = 0.3,
    strokeColor = '#ff0000',
    strokeWidth = 3,
    layerId = `polygon-${Date.now()}`,
  } = options;

  // Remove existing layer/source if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);

  // Normalize coordinates format
  const coords = Array.isArray(coordinates[0][0])
    ? coordinates as [number, number][][]
    : [coordinates as [number, number][]];

  // Add source
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: coords,
      },
      properties: {},
    },
  });

  // Add fill layer
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: layerId,
    paint: {
      'fill-color': color,
      'fill-opacity': fillOpacity,
    },
  });

  // Add stroke layer
  map.addLayer({
    id: `${layerId}-stroke`,
    type: 'line',
    source: layerId,
    paint: {
      'line-color': strokeColor,
      'line-width': strokeWidth,
      'line-opacity': 0.8,
    },
  });

  // Prevent event bubbling
  map.on('click', layerId, (e) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
  });

  return layerId;
}

/**
 * Clear all layers from the map
 * 
 * @param map - Mapbox map instance
 * @param layerPrefix - Optional prefix to filter layers (e.g., 'route-', 'polygon-')
 */
export function clearMapboxLayers(
  map: MapboxMap,
  layerPrefix?: string
): void {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  style.layers.forEach((layer) => {
    if (!layerPrefix || layer.id.startsWith(layerPrefix)) {
      if (map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
      if (map.getSource(layer.id)) {
        map.removeSource(layer.id);
      }
    }
  });
}

/**
 * Fit map to bounds
 * 
 * @param map - Mapbox map instance
 * @param bounds - Bounding box [[sw_lng, sw_lat], [ne_lng, ne_lat]]
 * @param options - Fit options
 */
export function fitMapboxBounds(
  map: MapboxMap,
  bounds: [[number, number], [number, number]],
  options: { padding?: number; maxZoom?: number } = {}
): void {
  const { padding = 20, maxZoom = 15 } = options;
  map.fitBounds(bounds, { padding, maxZoom });
}

/**
 * Get map center
 * 
 * @param map - Mapbox map instance
 * @returns [lng, lat] coordinates
 */
export function getMapboxCenter(map: MapboxMap): [number, number] {
  return map.getCenter().toArray() as [number, number];
}

/**
 * Get map zoom level
 * 
 * @param map - Mapbox map instance
 * @returns Zoom level
 */
export function getMapboxZoom(map: MapboxMap): number {
  return map.getZoom();
}

