# Data Map Components

Map components that fetch data from API calls and plot it on maps using the Map Engine.

## Available Components

### OceanHealthDataMap
Plots ocean health metrics from `/api/ocean-health`

```tsx
import { OceanHealthDataMap } from '@/components/map/DataMapComponents';

<OceanHealthDataMap lat={-20.2} lng={57.5} />
```

**Plots:**
- Water quality circles (color-coded by score)
- Temperature markers
- Pollution index indicators
- Biodiversity metrics

### PollutionDataMap
Plots pollution events from `/api/pollution/events`

```tsx
import { PollutionDataMap } from '@/components/map/DataMapComponents';

<PollutionDataMap lat={-20.2} lng={57.5} />
```

**Plots:**
- Pollution event markers
- Affected area circles
- Severity color-coding (critical/high/medium/low)

### FloodDataMap
Plots flood predictions from `/api/floodsense`

```tsx
import { FloodDataMap } from '@/components/map/DataMapComponents';

<FloodDataMap lat={-20.2} lng={57.5} />
```

**Plots:**
- Flood risk zones (color-coded by risk level)
- Rainfall data markers
- Probability indicators

### CycloneDataMap
Plots cyclone data from `/api/cyclone/current`

```tsx
import { CycloneDataMap } from '@/components/map/DataMapComponents';

<CycloneDataMap lat={-20.2} lng={57.5} />
```

**Plots:**
- Cyclone position markers
- Wind radius circles
- Distance indicators
- Track paths (if available)

### FishingActivityDataMap
Plots fishing activity from `/api/fishing-activity`

```tsx
import { FishingActivityDataMap } from '@/components/map/DataMapComponents';

<FishingActivityDataMap lat={-20.2} lng={57.5} />
```

**Plots:**
- Fishing vessel markers
- Activity area circles
- Vessel type indicators

## Usage Example

```tsx
'use client';

import { 
  OceanHealthDataMap,
  PollutionDataMap,
  FloodDataMap,
  CycloneDataMap 
} from '@/components/map/DataMapComponents';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OceanHealthDataMap lat={-20.2} lng={57.5} />
      <PollutionDataMap lat={-20.2} lng={57.5} />
      <FloodDataMap lat={-20.2} lng={57.5} />
      <CycloneDataMap lat={-20.2} lng={57.5} />
    </div>
  );
}
```

## Features

- ✅ Automatic data fetching from API routes
- ✅ Real-time updates (configurable intervals)
- ✅ Proper coordinate handling (WGS84)
- ✅ Color-coded visualizations
- ✅ Interactive popups with data details
- ✅ Loading states
- ✅ Error handling

## Customization

All components accept `lat` and `lng` props to center the map:

```tsx
<OceanHealthDataMap lat={-20.3484} lng={57.5522} />
```

The components automatically:
- Fetch data on mount
- Refresh at intervals (5-10 minutes)
- Clear and re-plot data when it updates
- Handle loading and error states

