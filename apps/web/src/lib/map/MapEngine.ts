/**
 * ClimaGuard Map Engine
 * Centralized map engine for all map features with proper coordinate handling
 * 
 * Handles:
 * - WGS84 → Web Mercator projections (Leaflet handles this automatically)
 * - Accurate centering and zoom levels
 * - GeoJSON overlays, heatmaps, polygons, tracks, and markers
 * - Consistent tile sources
 * - Proper CRS and bounding boxes for Mauritius
 */

import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Mauritius default coordinates and bounds
export const MAURITIUS_CENTER: [number, number] = [-20.2, 57.5];
export const MAURITIUS_BOUNDS: L.LatLngBoundsExpression = [
  [-20.6, 57.2], // Southwest
  [-19.8, 57.9]  // Northeast
];

// Default tile source (OpenStreetMap)
export const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Map Configuration Options
 */
export interface MapEngineOptions {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  tileUrl?: string;
  tileAttribution?: string;
  bounds?: L.LatLngBoundsExpression;
  maxBounds?: L.LatLngBoundsExpression;
  scrollWheelZoom?: boolean;
  doubleClickZoom?: boolean;
  dragging?: boolean;
  touchZoom?: boolean;
  boxZoom?: boolean;
  keyboard?: boolean;
  zoomControl?: boolean;
  attributionControl?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * GeoJSON Layer Style Options
 */
export interface GeoJSONStyleOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
}

/**
 * Heatmap Options
 */
export interface HeatmapOptions {
  radius?: number;
  blur?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<number, string>;
}

/**
 * Polygon Style Options
 */
export interface PolygonStyleOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
}

/**
 * Marker Options
 */
export interface MarkerOptions {
  icon?: L.Icon | L.DivIcon;
  title?: string;
  alt?: string;
  opacity?: number;
  zIndexOffset?: number;
  riseOnHover?: boolean;
  riseOffset?: number;
}

/**
 * Track/Polyline Options
 */
export interface TrackOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
  smoothFactor?: number;
}

/**
 * Create a base map instance
 * 
 * @param containerId - HTML element ID or HTMLElement where map will be rendered
 * @param options - Map configuration options
 * @returns Leaflet map instance
 */
export function createBaseMap(
  containerId: string | HTMLElement,
  options: MapEngineOptions = {}
): LeafletMap {
  const {
    center = MAURITIUS_CENTER,
    zoom = 10,
    minZoom = 8,
    maxZoom = 18,
    tileUrl = DEFAULT_TILE_URL,
    tileAttribution = DEFAULT_TILE_ATTRIBUTION,
    bounds,
    maxBounds = MAURITIUS_BOUNDS,
    scrollWheelZoom = true,
    doubleClickZoom = true,
    dragging = true,
    touchZoom = true,
    boxZoom = true,
    keyboard = true,
    zoomControl = true,
    attributionControl = true,
    className,
    style,
  } = options;

  // Create map instance with proper CRS (WGS84 - EPSG:4326)
  // Leaflet automatically handles WGS84 → Web Mercator (EPSG:3857) projection
  const map = L.map(containerId, {
    center,
    zoom,
    minZoom,
    maxZoom,
    maxBounds,
    scrollWheelZoom,
    doubleClickZoom,
    dragging,
    touchZoom,
    boxZoom,
    keyboard,
    zoomControl,
    attributionControl,
    crs: L.CRS.EPSG3857, // Web Mercator (default, ensures proper tile alignment)
    worldCopyJump: false, // Prevent map from wrapping
  });

  // Add tile layer with proper attribution
  L.tileLayer(tileUrl, {
    attribution: tileAttribution,
    maxZoom,
    minZoom,
  }).addTo(map);

  // Set bounds if provided
  if (bounds) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  // Apply custom styling if provided
  if (className && typeof containerId === 'string') {
    const container = document.getElementById(containerId);
    if (container) {
      container.className = `${container.className} ${className}`;
    }
  }

  if (style && typeof containerId === 'string') {
    const container = document.getElementById(containerId);
    if (container) {
      Object.assign(container.style, style);
    }
  }

  return map;
}

/**
 * Load GeoJSON layer on map
 * 
 * @param map - Leaflet map instance
 * @param data - GeoJSON data (object or URL string)
 * @param style - Style options for the GeoJSON layer
 * @returns GeoJSON layer instance
 */
export function loadGeoJSONLayer(
  map: LeafletMap,
  data: GeoJSON.FeatureCollection | GeoJSON.Feature | string,
  style: GeoJSONStyleOptions | ((feature?: GeoJSON.Feature) => GeoJSONStyleOptions) = {}
): L.GeoJSON {
  const defaultStyle: GeoJSONStyleOptions = {
    color: '#3388ff',
    weight: 2,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    ...(typeof style === 'function' ? {} : style),
  };

  const styleFunction = typeof style === 'function' 
    ? style 
    : () => defaultStyle;

  const geoJSONLayer = L.geoJSON(data as any, {
    style: (feature) => {
      const featureStyle = typeof style === 'function' 
        ? style(feature) 
        : defaultStyle;
      
      return {
        color: featureStyle.color || defaultStyle.color,
        weight: featureStyle.weight || defaultStyle.weight,
        opacity: featureStyle.opacity || defaultStyle.opacity,
        fillColor: featureStyle.fillColor || defaultStyle.fillColor,
        fillOpacity: featureStyle.fillOpacity || defaultStyle.fillOpacity,
        dashArray: featureStyle.dashArray || defaultStyle.dashArray,
      };
    },
  });

  geoJSONLayer.addTo(map);
  return geoJSONLayer;
}

/**
 * Load heatmap layer on map
 * Note: Requires leaflet.heat plugin or custom implementation
 * 
 * @param map - Leaflet map instance
 * @param data - Array of [lat, lng, intensity] points
 * @param options - Heatmap configuration options
 * @returns Heatmap layer instance (or null if plugin not available)
 */
export function loadHeatmap(
  map: LeafletMap,
  data: Array<[number, number, number]>,
  options: HeatmapOptions = {}
): L.Layer | null {
  // Check if leaflet.heat is available
  if (typeof (window as any).L?.heatLayer === 'function') {
    const heatLayer = (window as any).L.heatLayer(data, {
      radius: options.radius || 25,
      blur: options.blur || 15,
      max: options.max || 1.0,
      minOpacity: options.minOpacity || 0.05,
      gradient: options.gradient || {
        0.0: 'blue',
        0.5: 'yellow',
        1.0: 'red',
      },
    });
    
    heatLayer.addTo(map);
    return heatLayer;
  }

  // Fallback: Use circle markers as heatmap visualization
  console.warn('leaflet.heat plugin not available, using circle markers as fallback');
  
  const markerGroup = L.layerGroup();
  data.forEach(([lat, lng, intensity]) => {
    const radius = (options.radius || 25) * intensity;
    const color = intensity > 0.7 ? 'red' : intensity > 0.4 ? 'orange' : 'yellow';
    
    L.circleMarker([lat, lng], {
      radius,
      fillColor: color,
      color: color,
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.6,
    }).addTo(markerGroup);
  });
  
  markerGroup.addTo(map);
  return markerGroup;
}

/**
 * Load risk polygon on map
 * 
 * @param map - Leaflet map instance
 * @param polygonData - Array of [lat, lng] coordinates forming the polygon
 * @param color - Polygon color
 * @param options - Additional polygon style options
 * @returns Polygon layer instance
 */
export function loadRiskPolygon(
  map: LeafletMap,
  polygonData: Array<[number, number]> | Array<Array<[number, number]>>,
  color: string = '#ff0000',
  options: PolygonStyleOptions = {}
): L.Polygon {
  const polygon = L.polygon(polygonData as any, {
    color: options.color || color,
    weight: options.weight || 3,
    opacity: options.opacity || 0.8,
    fillColor: options.fillColor || color,
    fillOpacity: options.fillOpacity || 0.3,
    dashArray: options.dashArray,
  });

  polygon.addTo(map);
  return polygon;
}

/**
 * Load cyclone track on map
 * 
 * @param map - Leaflet map instance
 * @param trackData - Array of [lat, lng] coordinates for the track
 * @param options - Track/polyline style options
 * @returns Polyline layer instance
 */
export function loadCycloneTrack(
  map: LeafletMap,
  trackData: Array<[number, number]>,
  options: TrackOptions = {}
): L.Polyline {
  const track = L.polyline(trackData, {
    color: options.color || '#FF3B30',
    weight: options.weight || 4,
    opacity: options.opacity || 0.8,
    dashArray: options.dashArray || '10, 5',
    smoothFactor: options.smoothFactor || 1.0,
  });

  track.addTo(map);
  return track;
}

/**
 * Set map zoom and center
 * 
 * @param map - Leaflet map instance
 * @param coords - [latitude, longitude] coordinates
 * @param zoom - Zoom level (optional, keeps current if not provided)
 */
export function setZoomAndCenter(
  map: LeafletMap,
  coords: [number, number],
  zoom?: number
): void {
  if (zoom !== undefined) {
    map.setView(coords, zoom);
  } else {
    map.setView(coords);
  }
}

/**
 * Set map bounds to fit a specific area
 * 
 * @param map - Leaflet map instance
 * @param bounds - Bounds as [[south, west], [north, east]] or LatLngBounds
 * @param options - Fit bounds options (padding, maxZoom, etc.)
 */
export function setBounds(
  map: LeafletMap,
  bounds: L.LatLngBoundsExpression,
  options: L.FitBoundsOptions = {}
): void {
  const fitOptions: L.FitBoundsOptions = {
    padding: [20, 20],
    maxZoom: 15,
    ...options,
  };
  
  map.fitBounds(bounds, fitOptions);
}

/**
 * Add marker to map
 * 
 * @param map - Leaflet map instance
 * @param coords - [latitude, longitude] coordinates
 * @param options - Marker options
 * @param popupContent - Optional popup content (string or HTMLElement)
 * @returns Marker instance
 */
export function addMarker(
  map: LeafletMap,
  coords: [number, number],
  options: MarkerOptions = {},
  popupContent?: string | HTMLElement
): L.Marker {
  const marker = L.marker(coords, {
    icon: options.icon,
    title: options.title,
    alt: options.alt,
    opacity: options.opacity,
    zIndexOffset: options.zIndexOffset,
    riseOnHover: options.riseOnHover,
    riseOffset: options.riseOffset,
  });

  if (popupContent) {
    marker.bindPopup(popupContent);
  }

  marker.addTo(map);
  return marker;
}

/**
 * Add circle to map
 * 
 * @param map - Leaflet map instance
 * @param coords - [latitude, longitude] center coordinates
 * @param radius - Radius in meters
 * @param options - Circle style options
 * @returns Circle instance
 */
export function addCircle(
  map: LeafletMap,
  coords: [number, number],
  radius: number,
  options: PolygonStyleOptions = {}
): L.Circle {
  const circle = L.circle(coords, {
    radius,
    color: options.color || '#3388ff',
    weight: options.weight || 2,
    opacity: options.opacity || 0.8,
    fillColor: options.fillColor || '#3388ff',
    fillOpacity: options.fillOpacity || 0.2,
    dashArray: options.dashArray,
  });

  circle.addTo(map);
  return circle;
}

/**
 * Remove all layers from map (except base tile layer)
 * 
 * @param map - Leaflet map instance
 */
export function clearLayers(map: LeafletMap): void {
  map.eachLayer((layer) => {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });
}

/**
 * Get current map bounds
 * 
 * @param map - Leaflet map instance
 * @returns Current bounds as [[south, west], [north, east]]
 */
export function getMapBounds(map: LeafletMap): L.LatLngBounds {
  return map.getBounds();
}

/**
 * Get current map center
 * 
 * @param map - Leaflet map instance
 * @returns Current center as [latitude, longitude]
 */
export function getMapCenter(map: LeafletMap): [number, number] {
  const center = map.getCenter();
  return [center.lat, center.lng];
}

/**
 * Get current map zoom level
 * 
 * @param map - Leaflet map instance
 * @returns Current zoom level
 */
export function getMapZoom(map: LeafletMap): number {
  return map.getZoom();
}

