# ClimaGuard Development Guidelines

**Last Updated:** December 2024  
**Status:** Mandatory Rules for All Future Development

---

## 🗺️ 1. MAP SYSTEM ARCHITECTURE (NO DUPLICATE MAPS)

### Core Principle
**Do not repeat the same generic map component multiple times within a page.**

### Rules:
- Every page must use **ONE map instance** unless the second map shows a completely different visual context (e.g., satellite comparison mode).
- Use a **unified Map Engine** (`MapEngine.ts` / `useMapEngine.ts`) for all maps.

### Map Engine Responsibilities:
The Map Engine is responsible for:
- ✅ CRS/projection accuracy
- ✅ Tile sources
- ✅ GeoJSON alignment
- ✅ Elevation/terrain layers
- ✅ Overlay rendering
- ✅ `invalidateSize()` after all async loads

### Map Configuration Modes:
Every page must configure the map by calling the Map Engine with a specific mode:

```typescript
// Available modes:
cycloneMode()
floodMode()
oceanHealthMode()
coastalRiskMode()
pollutionMode()
generalOverviewMode()
```

### Each Mode Must Define:
- ✅ Default zoom + center
- ✅ Relevant layers
- ✅ Styling
- ✅ Interaction settings
- ✅ Accuracy corrections

---

## 🎯 2. MAP ACCURACY FIXES (MANDATORY FOR ALL MAP WORK)

### Spatial Data Standards:
Always ensure:

- ✅ All spatial data uses **WGS84 (EPSG:4326)**
- ✅ Leaflet must use **Web Mercator (EPSG:3857)**
- ✅ If satellite layers require it, use `proj4` + `leaflet-proj` for reprojection
- ✅ Snap all GeoJSON layers to the same projection
- ✅ Recalculate bounding boxes and `fitBounds` for **Mauritius**, not the entire world

### Size Invalidation:
Always call `map.invalidateSize()` after:
- ✅ Layer loads
- ✅ API data fetch
- ✅ Tab/component visibility changes

### Implementation Example:
```typescript
// After data fetch
useEffect(() => {
  if (map && dataLoaded) {
    map.invalidateSize();
  }
}, [map, dataLoaded]);
```

---

## 📊 3. REAL-TIME & FORECAST DATA (MANDATORY UPGRADES)

All main modules must support live and forecast layers:

### FLOOD MODULE:
Required layers:
- ✅ **Rainfall intensity layer** (Open-Meteo hourly or 24h/72h forecast)
- ✅ **Flood forecast heatmap** using rainfall + elevation
- ✅ **River/drain overflow prediction** based on terrain slope + runoff coefficient

### CYCLONE MODULE:
Required layers:
- ✅ **Wind-radius rings** (34kt, 50kt, 64kt)
- ✅ **Cone-of-uncertainty polygon** for trajectory forecasts
- ✅ **Predicted impact zones** combining wind + rainfall

### OCEAN HEALTH MODULE:
Critical requirements:
- ❌ **NO uniform ocean-health values** across the entire map
- ✅ **Split coastline into region segments** and generate region-based metrics
- ✅ **Pull data for each region separately** (turbidity, chlorophyll, SST, pH)
- ✅ **Add pollution plume detection** (Sentinel-2 color anomalies)
- ✅ **Add coastal risk heatmap** based on erosion + pollution + water quality

---

## 🎨 4. MAP UI ENHANCEMENTS

### Layer Toggles:
Implement consistently for:
- ✅ Flood zones
- ✅ Rainfall forecast
- ✅ Cyclone tracks
- ✅ Wind radius rings
- ✅ Coastal erosion
- ✅ Water quality
- ✅ Pollution events
- ✅ Elevation/contours
- ✅ Fishing activity

### Tooltip on Hover:
- ✅ Always provide popups or tooltips with **exact values** (rainfall, turbidity, flood risk, etc.)

### Click-to-Analyze:
- ✅ Clicking any point should invoke an API to fetch its **dynamic risk assessment**

### Compare Mode:
- ✅ Add optional map comparison (before/after or today/forecast)
- ⚠️ **Do NOT add redundant maps** unless the view is fundamentally different

---

## 🌊 5. OCEAN HEALTH IMPROVEMENTS

### Regional Granularity (CRITICAL):
- ❌ **Do not treat the entire ocean around Mauritius as a single data point**

### Required Spatial Segmentation:
Fetch data with spatial granularity:
- ✅ **North** region
- ✅ **East** region
- ✅ **South** region
- ✅ **West** region
- ✅ **Lagoon hot zones**

### Pollution Hotspot Detection:
Add sewage or pollution hotspot inference using:
- ✅ Turbidity anomalies
- ✅ NDWI/NDVI water color shifts
- ✅ Chlorophyll spikes

### Ocean Health Index:
- ✅ **Ocean health index should vary by region, not globally**

### Implementation Pattern:
```typescript
// BAD: Single data point
const oceanHealth = await fetchOceanHealth(lat, lng);

// GOOD: Regional data
const regions = [
  { name: 'North', bounds: [[-19.8, 57.3], [-20.0, 57.7]] },
  { name: 'East', bounds: [[-20.0, 57.7], [-20.2, 58.0]] },
  // ... more regions
];

const regionalData = await Promise.all(
  regions.map(region => fetchOceanHealthForRegion(region))
);
```

---

## 💻 6. CODE STYLE & STRUCTURE

### Avoid Duplication:
- ❌ Avoid duplicate map components → Always use the shared Map Engine
- ❌ Avoid duplicating API integration logic → Centralize in `integrations/` folder
- ✅ Separate APIs from visualization logic
- ✅ Keep each module's logic in its proper domain folder (`cyclone/`, `flood/`, `ocean/`)

### TypeScript:
- ✅ All new features must be typed using **TypeScript strict mode**
- ✅ Use shared types from `@climaguard/shared/types`

### File Organization:
```
apps/web/src/
├── lib/
│   ├── integrations/     # API integrations (centralized)
│   ├── map/              # Map Engine and utilities
│   ├── models/           # AI/ML models
│   └── services/         # Business logic
├── components/
│   ├── map/              # Map components (use Map Engine)
│   └── [feature]/        # Feature-specific components
└── app/
    └── api/              # API routes
```

---

## 🎯 7. FEATURE PRIORITY (Cursor must respect this)

When improving or modifying anything, follow this priority order:

### Priority 1: Fix Map Accuracy
1. ✅ Ensure WGS84/EPSG:4326 for all spatial data
2. ✅ Proper projection handling
3. ✅ Mauritius-specific bounds
4. ✅ `invalidateSize()` calls

### Priority 2: Remove Redundant Maps
1. ✅ Consolidate duplicate map instances
2. ✅ Use unified Map Engine
3. ✅ One map per page (unless different context)

### Priority 3: Add Real-Time & Forecast Layers
1. ✅ Rainfall intensity (flood)
2. ✅ Wind radius rings (cyclone)
3. ✅ Regional ocean health data
4. ✅ Forecast heatmaps

### Priority 4: Improve Ocean Data Granularity
1. ✅ Split into regions (North, East, South, West, Lagoon)
2. ✅ Per-region API calls
3. ✅ Regional health indices
4. ✅ Pollution hotspot detection

### Priority 5: Add Predictive Layers
1. ✅ Cyclone impact zones
2. ✅ Flood forecast heatmaps
3. ✅ Coastal risk heatmaps
4. ✅ Pollution plume predictions

### Priority 6: Improve Interactivity
1. ✅ Layer toggles
2. ✅ Tooltips with exact values
3. ✅ Click-to-analyze functionality
4. ✅ Compare mode (optional)

### Priority 7: Clean Up Code Duplication
1. ✅ Consolidate map components
2. ✅ Centralize API logic
3. ✅ Extract shared utilities
4. ✅ Refactor duplicate code

---

## ⚠️ IMPORTANT REMINDERS

### Never:
- ❌ Reuse the same static map configuration for different modules
- ❌ Show multiple maps on the same page unless they show different data modes
- ❌ Treat the entire ocean as a single data point
- ❌ Skip `invalidateSize()` after async operations
- ❌ Use world-wide bounds for Mauritius-specific data

### Always:
- ✅ Use the shared Map Engine as the single source of truth for map logic
- ✅ Ensure accuracy and regional variation in ocean/flood/cyclone layers
- ✅ Fetch data with spatial granularity
- ✅ Provide exact values in tooltips/popups
- ✅ Use TypeScript strict mode
- ✅ Follow the priority order when making changes

---

## 📝 Implementation Checklist

When working on map, data, or visualization features:

### Before Starting:
- [ ] Identify which map mode to use
- [ ] Check if a map already exists on the page
- [ ] Verify spatial data projection (WGS84)
- [ ] Plan regional data segmentation (if ocean health)

### During Development:
- [ ] Use Map Engine with appropriate mode
- [ ] Add `invalidateSize()` after async loads
- [ ] Implement layer toggles if needed
- [ ] Add tooltips with exact values
- [ ] Fetch regional data (not single point)
- [ ] Use TypeScript strict typing

### Before Committing:
- [ ] Verify no duplicate maps on page
- [ ] Check map accuracy (projection, bounds)
- [ ] Test `invalidateSize()` calls
- [ ] Verify regional data variation
- [ ] Ensure tooltips show exact values
- [ ] Run TypeScript type check
- [ ] Review code for duplication

---

## 🔗 Related Documentation

- `PROJECT_PROGRESS_SUMMARY.md` - Overall project status
- `apps/web/src/lib/map/README.md` - Map Engine documentation
- `apps/web/src/lib/integrations/README.md` - API integration patterns

---

**These guidelines are MANDATORY for all future development work on maps, data visualization, and related features.**

**Last Review:** December 2024  
**Next Review:** Q1 2025

