/**
 * Map Engine - Centralized Export
 * 
 * This module provides a unified map engine for all map features in ClimaGuard.
 * Each page should use the Map Engine with its own configuration rather than
 * reusing a single generic map component.
 */

// Core engine functions
export {
  createBaseMap,
  loadGeoJSONLayer,
  loadHeatmap,
  loadRiskPolygon,
  loadCycloneTrack,
  setZoomAndCenter,
  setBounds,
  addMarker,
  addCircle,
  clearLayers,
  getMapBounds,
  getMapCenter,
  getMapZoom,
  MAURITIUS_CENTER,
  MAURITIUS_BOUNDS,
  DEFAULT_TILE_URL,
  DEFAULT_TILE_ATTRIBUTION,
} from './MapEngine';

// Type exports
export type {
  MapEngineOptions,
  GeoJSONStyleOptions,
  HeatmapOptions,
  PolygonStyleOptions,
  MarkerOptions,
  TrackOptions,
} from './MapEngine';

// Configuration presets
export {
  DASHBOARD_MAP_CONFIG,
  FLOOD_MAP_CONFIG,
  CYCLONE_MAP_CONFIG,
  COASTAL_MAP_CONFIG,
  OCEAN_HEALTH_MAP_CONFIG,
  POLLUTION_MAP_CONFIG,
  REEF_HEALTH_MAP_CONFIG,
  BIODIVERSITY_MAP_CONFIG,
  CYCLONE_FORMATION_MAP_CONFIG,
} from './MapConfigs';

// React hooks
export { useMapEngine } from './useMapEngine';

// Layer management
export {
  createLayerGroup,
  registerLayer,
  showLayer,
  hideLayer,
  toggleLayer,
  isLayerVisible,
  unregisterLayer,
} from './MapEngine';

