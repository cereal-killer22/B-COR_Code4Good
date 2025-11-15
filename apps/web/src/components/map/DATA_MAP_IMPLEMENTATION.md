# Data Map Implementation Summary

## Overview

The map system has been reworked to plot data from API calls. All map components now fetch real-time data from API routes and visualize it on maps using the centralized Map Engine.

## What Was Created

### 1. Data Map Components (`DataMapComponents.tsx`)

Five ready-to-use map components that fetch and plot API data:

- **OceanHealthDataMap** - Plots ocean health metrics
- **PollutionDataMap** - Plots pollution events
- **FloodDataMap** - Plots flood predictions
- **CycloneDataMap** - Plots cyclone data
- **FishingActivityDataMap** - Plots fishing vessel activity

### 2. New API Route

- **`/api/fishing-activity`** - Returns fishing vessel data and metrics from Global Fishing Watch

## How It Works

Each component:
1. Fetches data from its corresponding API route
2. Uses the Map Engine to create a properly configured map
3. Plots the data using Map Engine functions (markers, circles, polygons, tracks)
4. Auto-refreshes at configurable intervals
5. Handles loading and error states

## Usage

### Basic Usage

```tsx
import { 
  OceanHealthDataMap,
  PollutionDataMap,
  FloodDataMap 
} from '@/components/map/DataMapComponents';

export default function MyPage() {
  return (
    <div>
      <OceanHealthDataMap lat={-20.2} lng={57.5} />
      <PollutionDataMap lat={-20.2} lng={57.5} />
      <FloodDataMap lat={-20.2} lng={57.5} />
    </div>
  );
}
```

### What Gets Plotted

#### Ocean Health Map
- Water quality circles (color-coded: green >70, yellow >50, red ≤50)
- Temperature and pollution indicators
- Biodiversity and reef health metrics
- Interactive popups with detailed metrics

#### Pollution Map
- Pollution event markers at detected locations
- Affected area circles (size based on area)
- Severity color-coding (critical/high/medium/low)
- Event details in popups

#### Flood Map
- Flood risk zones (color-coded by risk level)
- Risk probability indicators
- Rainfall data markers
- 24h and 72h precipitation data

#### Cyclone Map
- Cyclone position markers
- Wind radius circles (if available)
- Distance indicators
- Track paths (if available)
- Category and intensity information

#### Fishing Activity Map
- Fishing vessel markers
- Activity area circles
- Vessel type and speed information
- Sustainable fishing metrics

## API Endpoints Used

- `/api/ocean-health?lat={lat}&lng={lng}` - Ocean health metrics
- `/api/pollution/events?lat={lat}&lng={lng}&radius={radius}` - Pollution events
- `/api/floodsense?lat={lat}&lng={lng}` - Flood predictions
- `/api/cyclone/current` - Current cyclone data
- `/api/fishing-activity?lat={lat}&lng={lng}&radius={radius}` - Fishing activity

## Features

✅ **Real-time Data** - Fetches live data from API routes
✅ **Auto-refresh** - Updates automatically (5-10 minute intervals)
✅ **Proper Coordinates** - Uses WGS84 coordinates correctly
✅ **Color-coded** - Visual indicators based on data values
✅ **Interactive** - Click markers for detailed popups
✅ **Loading States** - Shows loading indicators while fetching
✅ **Error Handling** - Gracefully handles API errors

## Coordinate Accuracy

All components use the Map Engine which ensures:
- Correct WGS84 → Web Mercator projection
- Accurate layer alignment with tiles
- No shifting or scaling issues
- Proper bounding boxes for Mauritius region

## Customization

Each component accepts `lat` and `lng` props:

```tsx
<OceanHealthDataMap lat={-20.3484} lng={57.5522} />
```

The map will center on these coordinates and fetch data for that location.

## Next Steps

1. **Use in Pages** - Replace existing map components with these data-driven ones
2. **Add More Data Types** - Create additional components for other API endpoints
3. **Customize Styling** - Adjust colors, sizes, and styles as needed
4. **Add Filters** - Implement filtering by date, severity, etc.

## Example: Complete Page

```tsx
'use client';

import { 
  OceanHealthDataMap,
  PollutionDataMap,
  FloodDataMap,
  CycloneDataMap,
  FishingActivityDataMap
} from '@/components/map/DataMapComponents';

export default function DashboardPage() {
  const mauritiusCenter = { lat: -20.2, lng: 57.5 };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ClimaGuard Data Maps</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Ocean Health</h2>
          <OceanHealthDataMap {...mauritiusCenter} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Pollution Events</h2>
          <PollutionDataMap {...mauritiusCenter} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Flood Risk</h2>
          <FloodDataMap {...mauritiusCenter} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Cyclone Tracking</h2>
          <CycloneDataMap {...mauritiusCenter} />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Fishing Activity</h2>
        <FishingActivityDataMap {...mauritiusCenter} />
      </div>
    </div>
  );
}
```

## Benefits

1. **Centralized** - All maps use the same Map Engine
2. **Data-driven** - Real API data, not mock data
3. **Consistent** - Same coordinate handling across all maps
4. **Maintainable** - Single source of truth for map logic
5. **Extensible** - Easy to add new data types

