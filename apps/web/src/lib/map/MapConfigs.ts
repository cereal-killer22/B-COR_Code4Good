/**
 * Map Configuration Presets
 * Pre-configured map settings for different pages/features
 */

import type { MapEngineOptions } from './MapEngine';
import { MAURITIUS_CENTER, MAURITIUS_BOUNDS } from './MapEngine';

/**
 * Dashboard Map Configuration
 * Overview map with low zoom, all island layers
 */
export const DASHBOARD_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 10,
  minZoom: 8,
  maxZoom: 15,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'dashboard-map',
};

/**
 * Flood Map Configuration
 * Flood polygons, hydrology layers, elevation shading
 */
export const FLOOD_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 11,
  minZoom: 9,
  maxZoom: 16,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'flood-map',
};

/**
 * Cyclone Map Configuration
 * Predicted track, wind radius rings
 */
export const CYCLONE_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 9,
  minZoom: 7,
  maxZoom: 15,
  bounds: [
    [-21.0, 56.5], // Extended bounds for cyclone tracking
    [-19.5, 58.5]
  ],
  maxBounds: [
    [-22.0, 56.0],
    [-19.0, 59.0]
  ],
  scrollWheelZoom: true,
  className: 'cyclone-map',
};

/**
 * Coastal Map Configuration
 * Erosion, coastline change, marine pollution zones
 */
export const COASTAL_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 11,
  minZoom: 9,
  maxZoom: 17,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'coastal-map',
};

/**
 * Ocean Health Map Configuration
 * Marine data, pollution zones, biodiversity areas
 */
export const OCEAN_HEALTH_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 10,
  minZoom: 8,
  maxZoom: 16,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'ocean-health-map',
};

/**
 * Pollution Map Configuration
 * Pollution events, detection zones, satellite imagery
 */
export const POLLUTION_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 11,
  minZoom: 9,
  maxZoom: 17,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'pollution-map',
};

/**
 * Reef Health Map Configuration
 * Coral reef areas, bleaching risk zones
 */
export const REEF_HEALTH_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 11,
  minZoom: 9,
  maxZoom: 17,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'reef-health-map',
};

/**
 * Biodiversity Map Configuration
 * Species distribution, protected areas
 */
export const BIODIVERSITY_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 10,
  minZoom: 8,
  maxZoom: 16,
  bounds: MAURITIUS_BOUNDS,
  maxBounds: MAURITIUS_BOUNDS,
  scrollWheelZoom: true,
  className: 'biodiversity-map',
};

/**
 * Cyclone Formation Map Configuration
 * Formation prediction zones, probability areas
 */
export const CYCLONE_FORMATION_MAP_CONFIG: MapEngineOptions = {
  center: MAURITIUS_CENTER,
  zoom: 8,
  minZoom: 6,
  maxZoom: 14,
  bounds: [
    [-22.0, 55.0], // Extended bounds for formation tracking
    [-18.0, 60.0]
  ],
  maxBounds: [
    [-23.0, 54.0],
    [-17.0, 61.0]
  ],
  scrollWheelZoom: true,
  className: 'cyclone-formation-map',
};

