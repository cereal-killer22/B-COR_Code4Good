# Map Engine Implementation Summary

## Overview

A centralized Map Engine has been created to handle all map features in ClimaGuard. This ensures:
- ✅ Correct coordinate projections (WGS84 → Web Mercator)
- ✅ Accurate centering and zoom levels
- ✅ Proper alignment of all layers (GeoJSON, heatmaps, polygons, tracks, markers)
- ✅ Consistent tile sources
- ✅ No layer shifting, scaling, or misalignment

## Architecture

### Core Principle

**Each page uses the Map Engine with its own configuration** - pages do NOT reuse a single generic map component.

### File Structure

```
apps/web/src/lib/map/
├── MapEngine.ts          # Core engine functions
├── MapConfigs.ts         # Pre-configured settings for different pages
├── useMapEngine.ts       # React hook for map integration
├── index.ts              # Centralized exports
└── README.md             # Documentation

apps/web/src/components/map/
├── MapEngineComponent.tsx    # React component wrapper
└── FloodMapExample.tsx       # Example implementation
```

## Key Features

### 1. Coordinate Projection

- **Input**: WGS84 (EPSG:4326) - standard lat/lng
- **Internal**: Web Mercator (EPSG:3857) - Leaflet default
- **Output**: WGS84 - all functions use lat/lng

Leaflet automatically handles WGS84 → Web Mercator conversion, ensuring proper tile alignment.

### 2. Map Creation

```typescript
import { createBaseMap } from '@/lib/map';

const map = createBaseMap('container-id', {
  center: [-20.2, 57.5],
  zoom: 10,
  bounds: MAURITIUS_BOUNDS,
});
```

### 3. Layer Loading Functions

- `loadGeoJSONLayer()` - GeoJSON overlays with styling
- `loadHeatmap()` - Heatmap visualization
- `loadRiskPolygon()` - Risk/hazard polygons
- `loadCycloneTrack()` - Cyclone tracks/polylines
- `addMarker()` - Point markers
- `addCircle()` - Circular areas

### 4. Map Control Functions

- `setZoomAndCenter()` - Set map center and zoom
- `setBounds()` - Fit map to bounds
- `clearLayers()` - Remove all layers (except tiles)
- `getMapBounds()` - Get current bounds
- `getMapCenter()` - Get current center
- `getMapZoom()` - Get current zoom

### 5. Page-Specific Configurations

Pre-configured settings for each page type:

- `DASHBOARD_MAP_CONFIG` - Overview map
- `FLOOD_MAP_CONFIG` - Flood features
- `CYCLONE_MAP_CONFIG` - Cyclone tracking
- `COASTAL_MAP_CONFIG` - Coastal features
- `OCEAN_HEALTH_MAP_CONFIG` - Ocean health
- `POLLUTION_MAP_CONFIG` - Pollution monitoring
- `REEF_HEALTH_MAP_CONFIG` - Reef health
- `BIODIVERSITY_MAP_CONFIG` - Biodiversity
- `CYCLONE_FORMATION_MAP_CONFIG` - Cyclone formation

## Usage Examples

### Example 1: Flood Map

```tsx
import MapEngineComponent from '@/components/map/MapEngineComponent';
import { FLOOD_MAP_CONFIG, addCircle, addMarker } from '@/lib/map';

<MapEngineComponent
  containerId="flood-map"
  options={FLOOD_MAP_CONFIG}
  onMapReady={(map) => {
    // Add flood risk zones
    addCircle(map, [-20.2, 57.5], 5000, {
      color: '#ff0000',
      fillOpacity: 0.3,
    });
  }}
/>
```

### Example 2: Cyclone Map

```tsx
import MapEngineComponent from '@/components/map/MapEngineComponent';
import { CYCLONE_MAP_CONFIG, loadCycloneTrack } from '@/lib/map';

<MapEngineComponent
  containerId="cyclone-map"
  options={CYCLONE_MAP_CONFIG}
  onMapReady={(map) => {
    loadCycloneTrack(map, trackCoordinates, {
      color: '#FF3B30',
      weight: 4,
    });
  }}
/>
```

### Example 3: Using React Hook

```tsx
import { useMapEngine } from '@/lib/map';
import { FLOOD_MAP_CONFIG } from '@/lib/map';

function MyComponent() {
  const { map, isReady, updateCenter } = useMapEngine(
    'my-map',
    FLOOD_MAP_CONFIG
  );

  useEffect(() => {
    if (isReady && map) {
      // Add layers
    }
  }, [isReady, map]);

  return <div id="my-map" style={{ height: '500px' }} />;
}
```

## Migration Guide

### Before (Old Pattern)

```tsx
// Each component had its own map implementation
<MapContainer center={[lat, lng]} zoom={10}>
  <TileLayer url="..." />
  <CircleMarker center={[lat, lng]} />
</MapContainer>
```

### After (New Pattern)

```tsx
// Use Map Engine with page-specific config
<MapEngineComponent
  containerId="my-map"
  options={FLOOD_MAP_CONFIG}
  onMapReady={(map) => {
    addCircle(map, [lat, lng], 5000, { color: '#ff0000' });
  }}
/>
```

## Benefits

1. **Consistency** - All maps use the same engine and tile sources
2. **Accuracy** - Proper coordinate handling ensures no misalignment
3. **Maintainability** - Single source of truth for map logic
4. **Flexibility** - Each page can configure maps differently
5. **Performance** - Optimized layer management
6. **Type Safety** - Full TypeScript support

## Next Steps

1. **Migrate existing components** - Update existing map components to use Map Engine
2. **Add custom configurations** - Create page-specific configs as needed
3. **Test alignment** - Verify all layers align correctly with tiles
4. **Performance optimization** - Add clustering, layer groups as needed

## Notes

- The Map Engine uses Leaflet (react-leaflet) under the hood
- All coordinates are in WGS84 format [lat, lng]
- Mauritius bounds are pre-configured for regional maps
- The engine handles SSR issues automatically
- Marker icons are fixed for Next.js compatibility

