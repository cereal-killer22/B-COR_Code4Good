# ClimaGuard Map Engine

Centralized map engine for all map features in ClimaGuard. This engine ensures:
- ✅ Correct coordinate projections (WGS84 → Web Mercator)
- ✅ Accurate centering and zoom levels
- ✅ Proper alignment of GeoJSON overlays, heatmaps, flood layers, hazard shapes, and markers
- ✅ Consistent tile sources
- ✅ No layer shifting, scaling, or misalignment

## Architecture

**Each page should use the Map Engine with its own configuration** rather than reusing a single generic map component.

## Quick Start

### 1. Import the Map Engine

```typescript
import {
  MapEngineComponent,
  FLOOD_MAP_CONFIG,
  loadRiskPolygon,
  addMarker,
} from '@/lib/map';
```

### 2. Use in Your Component

```tsx
<MapEngineComponent
  containerId="my-map"
  options={FLOOD_MAP_CONFIG}
  onMapReady={(map) => {
    // Add your layers here
    loadRiskPolygon(map, floodZones, '#ff0000');
    addMarker(map, [-20.2, 57.5], {}, 'Flood Zone');
  }}
/>
```

## Available Configurations

Pre-configured map settings for different pages:

- `DASHBOARD_MAP_CONFIG` - Overview map, low zoom, all island layers
- `FLOOD_MAP_CONFIG` - Flood polygons, hydrology layers, elevation shading
- `CYCLONE_MAP_CONFIG` - Predicted track, wind radius rings
- `COASTAL_MAP_CONFIG` - Erosion, coastline change, marine pollution zones
- `OCEAN_HEALTH_MAP_CONFIG` - Marine data, pollution zones, biodiversity areas
- `POLLUTION_MAP_CONFIG` - Pollution events, detection zones, satellite imagery
- `REEF_HEALTH_MAP_CONFIG` - Coral reef areas, bleaching risk zones
- `BIODIVERSITY_MAP_CONFIG` - Species distribution, protected areas
- `CYCLONE_FORMATION_MAP_CONFIG` - Formation prediction zones, probability areas

## Core Functions

### Map Creation

```typescript
import { createBaseMap } from '@/lib/map';

const map = createBaseMap('map-container', {
  center: [-20.2, 57.5],
  zoom: 10,
});
```

### Loading Layers

```typescript
import {
  loadGeoJSONLayer,
  loadHeatmap,
  loadRiskPolygon,
  loadCycloneTrack,
} from '@/lib/map';

// GeoJSON layer
loadGeoJSONLayer(map, geoJSONData, {
  color: '#3388ff',
  weight: 2,
  fillOpacity: 0.3,
});

// Heatmap
loadHeatmap(map, [[-20.2, 57.5, 0.8], [-20.3, 57.6, 0.6]], {
  radius: 25,
  blur: 15,
});

// Risk polygon
loadRiskPolygon(map, [[-20.2, 57.5], [-20.3, 57.6], [-20.1, 57.7]], '#ff0000');

// Cyclone track
loadCycloneTrack(map, [[-20.2, 57.5], [-20.3, 57.6], [-20.1, 57.7]], {
  color: '#FF3B30',
  weight: 4,
});
```

### Map Controls

```typescript
import {
  setZoomAndCenter,
  setBounds,
  addMarker,
  addCircle,
  clearLayers,
} from '@/lib/map';

// Set center and zoom
setZoomAndCenter(map, [-20.2, 57.5], 12);

// Fit bounds
setBounds(map, [[-20.6, 57.2], [-19.8, 57.9]]);

// Add marker
addMarker(map, [-20.2, 57.5], {}, 'Popup content');

// Add circle
addCircle(map, [-20.2, 57.5], 5000, {
  color: '#ff0000',
  fillOpacity: 0.3,
});

// Clear all layers (except base tiles)
clearLayers(map);
```

## React Hook

```typescript
import { useMapEngine } from '@/lib/map';

function MyComponent() {
  const { map, isReady, updateCenter, updateBounds } = useMapEngine(
    'my-map-container',
    FLOOD_MAP_CONFIG
  );

  useEffect(() => {
    if (isReady && map) {
      // Map is ready, add your layers
    }
  }, [isReady, map]);

  return <div id="my-map-container" style={{ height: '500px' }} />;
}
```

## Coordinate System

The Map Engine uses:
- **Input**: WGS84 (EPSG:4326) - standard lat/lng coordinates
- **Internal**: Web Mercator (EPSG:3857) - Leaflet's default projection
- **Output**: WGS84 - all functions accept and return lat/lng

Leaflet automatically handles the projection conversion, ensuring proper alignment with tile layers.

## Mauritius Bounds

Default bounds for Mauritius are provided:

```typescript
import { MAURITIUS_CENTER, MAURITIUS_BOUNDS } from '@/lib/map';

// Center: [-20.2, 57.5]
// Bounds: [[-20.6, 57.2], [-19.8, 57.9]]
```

## Examples

### Flood Map

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

### Cyclone Map

```tsx
import MapEngineComponent from '@/components/map/MapEngineComponent';
import { CYCLONE_MAP_CONFIG, loadCycloneTrack, addMarker } from '@/lib/map';

<MapEngineComponent
  containerId="cyclone-map"
  options={CYCLONE_MAP_CONFIG}
  onMapReady={(map) => {
    // Add cyclone track
    loadCycloneTrack(map, trackCoordinates, {
      color: '#FF3B30',
      weight: 4,
    });
    
    // Add current position
    addMarker(map, currentPosition, {}, 'Cyclone Position');
  }}
/>
```

## Best Practices

1. **Use page-specific configurations** - Each page should use its own config preset
2. **Don't reuse map instances** - Create new maps for each page/component
3. **Clear layers when needed** - Use `clearLayers()` before adding new data
4. **Handle map ready state** - Wait for `onMapReady` callback before adding layers
5. **Use proper coordinates** - Always use [lat, lng] format (WGS84)

## Troubleshooting

### Layers not aligning correctly

- Ensure you're using WGS84 coordinates (lat/lng)
- Check that bounds are set correctly for your region
- Verify tile layer URL is correct

### Map not rendering

- Ensure container element exists before creating map
- Check that Leaflet CSS is imported
- Verify container has explicit height/width

### Performance issues

- Clear unused layers with `clearLayers()`
- Use appropriate zoom levels for your data
- Consider clustering for many markers

