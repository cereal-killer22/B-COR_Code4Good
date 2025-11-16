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

  // Always use Mauritius bounds for consistency (WGS84/EPSG:4326)
  // Mapbox automatically handles projection to EPSG:3857 (Web Mercator)
  if (bounds) {
    map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
  } else {
    // Default to Mauritius bounds if not specified
    map.fitBounds(MAURITIUS_BOUNDS, { padding: 20, maxZoom: 15 });
  }
  
  // Ensure map uses WGS84 coordinates (Mapbox default)
  // All coordinates passed to Mapbox should be [lng, lat] in WGS84

  // Force resize after initial setup and on load
  map.on('load', () => {
    setTimeout(() => {
      map.resize();
    }, 100);
  });

  // Also resize immediately
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

  // Ensure map is loaded and has a container
  const mapContainer = map.getContainer();
  if (!map.loaded() || !mapContainer) {
    // Wait for map to be ready - use a flag to prevent duplicate calls
    const markerKey = `_marker_pending_${coords[0]}_${coords[1]}_${color}`;
    if ((map as any)[markerKey]) {
      // Already waiting for this marker
      const dummyEl = document.createElement('div');
      return new Mapbox.Marker({ element: dummyEl }).setLngLat(coords);
    }
    (map as any)[markerKey] = true;
    
    const addMarker = () => {
      if (map.loaded() && map.getContainer()) {
        delete (map as any)[markerKey];
        addMapboxMarker(map, coords, options, popupContent);
      }
    };
    
    if (!map.loaded()) {
      map.once('load', addMarker);
    }
    // Also try after a short delay
    setTimeout(() => {
      if (map.loaded() && map.getContainer()) {
        delete (map as any)[markerKey];
        addMarker();
      }
    }, 100);
    
    // Return a dummy marker for now (will be replaced when map is ready)
    const dummyEl = document.createElement('div');
    return new Mapbox.Marker({ element: dummyEl }).setLngLat(coords);
  }

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
    const popup = new Mapbox.Popup({ 
      offset: 24,
      closeOnClick: false,
      closeButton: true,
      closeOnMove: false,
      autoClose: false,
      anchor: 'bottom',
    });
    if (typeof popupContent === 'string') {
      popup.setHTML(popupContent);
    } else {
      popup.setDOMContent(popupContent);
    }
    marker.setPopup(popup);
  }

  // Handle marker click to open popup
  markerElement.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popupContent) {
      const popup = marker.getPopup();
      if (popup) {
        // Toggle popup on click
        if (popup.isOpen()) {
          popup.remove();
        } else {
          marker.togglePopup();
        }
      }
    }
  });

  // Also handle marker click event (Mapbox's own click handler)
  marker.on('click', (e) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
    }
    // Mapbox will automatically toggle the popup if one is set
    if (popupContent) {
      const popup = marker.getPopup();
      if (popup && !popup.isOpen()) {
        marker.togglePopup();
      }
    }
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

  // Prevent event bubbling for route clicks
  map.on('click', layerId, (e) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
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

  // Ensure map is loaded
  if (!map.loaded() || !map.isStyleLoaded()) {
    // Wait for map to be fully loaded - use a flag to prevent multiple calls
    const mapKey = `_polygon_${layerId}_pending`;
    if ((map as any)[mapKey]) {
      // Already waiting for this polygon
      return layerId;
    }
    (map as any)[mapKey] = true;
    
    const addPolygon = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        delete (map as any)[mapKey];
        addMapboxPolygon(map, coordinates, options);
      }
    };
    
    // Set up listeners
    if (!map.loaded()) {
      map.once('load', addPolygon);
    }
    if (!map.isStyleLoaded()) {
      map.once('style.load', addPolygon);
    }
    // Also check after a short delay in case it loads between checks
    setTimeout(() => {
      if (map.loaded() && map.isStyleLoaded()) {
        delete (map as any)[mapKey];
        addMapboxPolygon(map, coordinates, options);
      }
    }, 100);
    return layerId;
  }

  // Remove existing layer/source if present
  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(layerId)) map.removeSource(layerId);
  } catch (e) {
    // Ignore errors when removing non-existent layers
  }

  // Normalize coordinates format
  const coords = Array.isArray(coordinates[0][0])
    ? coordinates as [number, number][][]
    : [coordinates as [number, number][]];

  // Ensure polygon is closed (first and last point must be the same)
  coords.forEach((ring) => {
    if (ring.length > 0) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }
  });

  // Validate coordinates
  if (coords.length === 0 || coords[0].length < 4) {
    console.error('Invalid polygon coordinates:', coords);
    return layerId;
  }

  try {
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
  } catch (e) {
    console.error('Error adding polygon source:', e, { layerId, coords });
    return layerId;
  }

  try {
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
  } catch (e) {
    console.error('Error adding polygon layers:', e, { layerId });
    // Try to remove source if layer addition failed
    try {
      if (map.getSource(layerId)) map.removeSource(layerId);
    } catch (removeError) {
      // Ignore removal errors
    }
    return layerId;
  }

  // Prevent event bubbling for polygon clicks
  map.on('click', layerId, (e) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
  });

  // Also prevent on stroke layer
  map.on('click', `${layerId}-stroke`, (e) => {
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

/**
 * Layer Management System
 * Tracks and controls map layers for visibility toggling
 */

// Global layer registry per map instance
const layerRegistry = new WeakMap<MapboxMap, Map<string, { layerId: string; visible: boolean }>>();

/**
 * Register a layer with the map engine
 * 
 * @param map - Mapbox map instance
 * @param id - Unique layer identifier
 * @param layerId - Actual Mapbox layer ID
 */
export function registerMapboxLayer(
  map: MapboxMap,
  id: string,
  layerId: string
): void {
  if (!layerRegistry.has(map)) {
    layerRegistry.set(map, new Map());
  }
  const registry = layerRegistry.get(map)!;
  registry.set(id, { layerId, visible: true });
}

/**
 * Show a registered layer
 * 
 * @param map - Mapbox map instance
 * @param id - Layer identifier
 */
export function showMapboxLayer(
  map: MapboxMap,
  id: string
): void {
  const registry = layerRegistry.get(map);
  if (!registry) return;
  
  const layer = registry.get(id);
  if (!layer) return;
  
  const mapLayer = map.getLayer(layer.layerId);
  if (mapLayer) {
    map.setLayoutProperty(layer.layerId, 'visibility', 'visible');
    registry.set(id, { ...layer, visible: true });
  }
}

/**
 * Hide a registered layer
 * 
 * @param map - Mapbox map instance
 * @param id - Layer identifier
 */
export function hideMapboxLayer(
  map: MapboxMap,
  id: string
): void {
  const registry = layerRegistry.get(map);
  if (!registry) return;
  
  const layer = registry.get(id);
  if (!layer) return;
  
  const mapLayer = map.getLayer(layer.layerId);
  if (mapLayer) {
    map.setLayoutProperty(layer.layerId, 'visibility', 'none');
    registry.set(id, { ...layer, visible: false });
  }
}

/**
 * Toggle a registered layer visibility
 * 
 * @param map - Mapbox map instance
 * @param id - Layer identifier
 * @returns New visibility state
 */
export function toggleMapboxLayer(
  map: MapboxMap,
  id: string
): boolean {
  const registry = layerRegistry.get(map);
  if (!registry) return false;
  
  const layer = registry.get(id);
  if (!layer) return false;
  
  const newVisibility = !layer.visible;
  if (newVisibility) {
    showMapboxLayer(map, id);
  } else {
    hideMapboxLayer(map, id);
  }
  
  return newVisibility;
}

/**
 * Check if a layer is visible
 * 
 * @param map - Mapbox map instance
 * @param id - Layer identifier
 * @returns Visibility state
 */
export function isMapboxLayerVisible(
  map: MapboxMap,
  id: string
): boolean {
  const registry = layerRegistry.get(map);
  if (!registry) return false;
  
  const layer = registry.get(id);
  if (!layer) return false;
  
  return layer.visible;
}

/**
 * Unregister a layer
 * 
 * @param map - Mapbox map instance
 * @param id - Layer identifier
 */
export function unregisterMapboxLayer(
  map: MapboxMap,
  id: string
): void {
  const registry = layerRegistry.get(map);
  if (!registry) return;
  
  registry.delete(id);
}

/**
 * Add a heatmap layer to the map
 * Uses circle layers with varying opacity and radius to simulate heatmap
 * 
 * @param map - Mapbox map instance
 * @param points - Array of [lng, lat, intensity] points (intensity 0-1)
 * @param options - Heatmap configuration options
 * @returns Heatmap layer ID
 */
export function addMapboxHeatmap(
  map: MapboxMap,
  points: [number, number, number][],
  options: {
    radius?: number;
    maxIntensity?: number;
    minOpacity?: number;
    maxOpacity?: number;
    colorStops?: Array<[number, string]>;
    layerId?: string;
  } = {}
): string {
  const {
    radius = 25,
    maxIntensity = 1.0,
    minOpacity = 0.1,
    maxOpacity = 0.8,
    colorStops = [
      [0, 'blue'],
      [0.3, 'cyan'],
      [0.5, 'yellow'],
      [0.7, 'orange'],
      [1.0, 'red'],
    ],
    layerId = `heatmap-${Date.now()}`,
  } = options;

  // Remove existing layer/source if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);

  // Normalize intensities
  const normalizedPoints = points.map(([lng, lat, intensity]) => [
    lng,
    lat,
    Math.min(intensity / maxIntensity, 1.0),
  ] as [number, number, number]);

  // Create GeoJSON source with points
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: normalizedPoints.map(([lng, lat, intensity]) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          intensity,
        },
      })),
    },
  });

  // Add circle layer for heatmap effect
  map.addLayer({
    id: layerId,
    type: 'circle',
    source: layerId,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'intensity'],
        0,
        radius * 0.5,
        1,
        radius * 2,
      ],
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'intensity'],
        ...colorStops.flat(),
      ],
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['get', 'intensity'],
        0,
        minOpacity,
        1,
        maxOpacity,
      ],
      'circle-blur': [
        'interpolate',
        ['linear'],
        ['get', 'intensity'],
        0,
        0.5,
        1,
        1.5,
      ],
    },
  });

  return layerId;
}

/**
 * Add wind-radius rings to the map
 * 
 * @param map - Mapbox map instance
 * @param center - [lng, lat] center point
 * @param radii - Array of {speed: number, radius: number} in km
 * @param options - Ring style options
 * @returns Array of layer IDs
 */
export function addMapboxWindRings(
  map: MapboxMap,
  center: [number, number],
  radii: Array<{ speed: number; radius: number }>,
  options: {
    layerIdPrefix?: string;
  } = {}
): string[] {
  const { layerIdPrefix = 'wind-ring' } = options;
  const layerIds: string[] = [];

  radii.forEach(({ speed, radius }, index) => {
    const layerId = `${layerIdPrefix}-${speed}kt-${index}`;
    
    // Remove existing layer/source if present
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(layerId)) map.removeSource(layerId);

    // Create circle polygon (approximate with many points)
    const points: [number, number][] = [];
    const numPoints = 64;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      // Convert km to degrees (approximate: 1 degree ≈ 111 km)
      const latOffset = (radius / 111) * Math.cos(angle);
      const lngOffset = (radius / 111) * Math.sin(angle) / Math.cos(center[1] * Math.PI / 180);
      points.push([center[0] + lngOffset, center[1] + latOffset]);
    }
    points.push(points[0]); // Close the polygon

    // Add source
    map.addSource(layerId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [points],
        },
        properties: {
          speed,
          radius,
        },
      },
    });

    // Add fill layer
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': speed >= 64 ? '#dc2626' : speed >= 50 ? '#ea580c' : '#eab308',
        'fill-opacity': 0.15,
      },
    });

    // Add stroke layer
    map.addLayer({
      id: `${layerId}-stroke`,
      type: 'line',
      source: layerId,
      paint: {
        'line-color': speed >= 64 ? '#dc2626' : speed >= 50 ? '#ea580c' : '#eab308',
        'line-width': 2,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2],
      },
    });

    layerIds.push(layerId);
  });

  return layerIds;
}

/**
 * Add cone of uncertainty polygon
 * 
 * @param map - Mapbox map instance
 * @param trackPoints - Array of [lng, lat] points along the track
 * @param widthAtPoints - Array of widths (in km) at each track point
 * @param options - Cone style options
 * @returns Cone layer ID
 */
export function addMapboxConeOfUncertainty(
  map: MapboxMap,
  trackPoints: [number, number][],
  widthAtPoints: number[],
  options: {
    color?: string;
    opacity?: number;
    layerId?: string;
  } = {}
): string {
  const {
    color = '#FF3B30',
    opacity = 0.2,
    layerId = `cone-uncertainty-${Date.now()}`,
  } = options;

  // Remove existing layer/source if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);

  if (trackPoints.length < 2 || trackPoints.length !== widthAtPoints.length) {
    console.warn('Invalid cone of uncertainty data');
    return layerId;
  }

  // Build polygon by creating perpendicular points at each track point
  const leftPoints: [number, number][] = [];
  const rightPoints: [number, number][] = [];

  for (let i = 0; i < trackPoints.length; i++) {
    const [lng, lat] = trackPoints[i];
    const width = widthAtPoints[i];

    // Calculate bearing (direction of track)
    let bearing = 0;
    if (i < trackPoints.length - 1) {
      const [nextLng, nextLat] = trackPoints[i + 1];
      const dLng = (nextLng - lng) * Math.PI / 180;
      const dLat = (nextLat - lat) * Math.PI / 180;
      bearing = Math.atan2(dLng, dLat);
    } else if (i > 0) {
      const [prevLng, prevLat] = trackPoints[i - 1];
      const dLng = (lng - prevLng) * Math.PI / 180;
      const dLat = (lat - prevLat) * Math.PI / 180;
      bearing = Math.atan2(dLng, dLat);
    }

    // Perpendicular angle
    const perpAngle = bearing + Math.PI / 2;

    // Convert width (km) to degrees
    const widthDeg = width / 111;
    const lngOffset = widthDeg * Math.sin(perpAngle) / Math.cos(lat * Math.PI / 180);
    const latOffset = widthDeg * Math.cos(perpAngle);

    leftPoints.push([lng - lngOffset, lat - latOffset]);
    rightPoints.unshift([lng + lngOffset, lat + latOffset]);
  }

  // Combine points to form polygon
  const polygonPoints = [...leftPoints, ...rightPoints, leftPoints[0]];

  // Add source
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygonPoints],
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
      'fill-opacity': opacity,
    },
  });

  // Add stroke layer
  map.addLayer({
    id: `${layerId}-stroke`,
    type: 'line',
    source: layerId,
    paint: {
      'line-color': color,
      'line-width': 2,
      'line-opacity': 0.6,
      'line-dasharray': [4, 2],
    },
  });

  return layerId;
}

