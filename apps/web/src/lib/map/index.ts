/**
 * Map Engine - Centralized Export
 * 
 * This module provides a unified map engine for all map features in ClimaGuard.
 * Each page should use the Map Engine with its own configuration rather than
 * reusing a single generic map component.
 */

// Mapbox Engine exports (primary)
export {
  createMapboxMap,
  addMapboxMarker,
  addMapboxRoute,
  addMapboxPolygon,
  addMapboxHeatmap,
  addMapboxWindRings,
  addMapboxConeOfUncertainty,
  clearMapboxLayers,
  fitMapboxBounds,
  getMapboxCenter,
  getMapboxZoom,
  registerMapboxLayer,
  showMapboxLayer,
  hideMapboxLayer,
  toggleMapboxLayer,
  isMapboxLayerVisible,
  unregisterMapboxLayer,
} from './MapboxEngine';

export type { MapboxEngineOptions } from './MapboxEngine';

// React hooks
export { useMapboxEngine } from './useMapboxEngine';
export type { UseMapboxEngineOptions } from './useMapboxEngine';

// Legacy Leaflet exports (for backward compatibility)
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
  createLayerGroup,
  registerLayer,
  showLayer,
  hideLayer,
  toggleLayer,
  isLayerVisible,
  unregisterLayer,
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

// React hooks (legacy)
export { useMapEngine } from './useMapEngine';

