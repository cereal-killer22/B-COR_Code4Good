/**
 * Ocean Health Prediction API Route
 * Fetches real-time coral reef data from NOAA ERDDAP
 * Returns ocean health score and risk assessment with regional variation
 */

import { NextRequest, NextResponse } from 'next/server';
import { oceanHealthScoreFromNOAA } from '@/lib/predictors';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';

// Define regional segments for Mauritius coastline
const MAURITIUS_REGIONS = {
  north: { center: [-20.1, 57.5], bounds: [[57.4, -20.2], [57.6, -20.0]] },
  east: { center: [-20.2, 57.7], bounds: [[57.6, -20.3], [57.8, -20.1]] },
  south: { center: [-20.4, 57.5], bounds: [[57.4, -20.5], [57.6, -20.3]] },
  west: { center: [-20.2, 57.3], bounds: [[57.2, -20.3], [57.4, -20.1]] },
  lagoon: { center: [-20.15, 57.55], bounds: [[57.5, -20.2], [57.6, -20.1]] },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const region = searchParams.get('region') || 'all';

    const reefWatch = new CoralReefWatch();

    // If region is specified, return data for that region only
    if (region !== 'all' && region in MAURITIUS_REGIONS) {
      const regionData = MAURITIUS_REGIONS[region as keyof typeof MAURITIUS_REGIONS];
      const reefData = await reefWatch.getReefHealth(regionData.center[1], regionData.center[0]);

      const sst = reefData.temperature;
      const hotspot = reefData.hotspot || 0;
      const dhw = reefData.degreeHeatingWeeks || 0;

      // Add regional variation factors
      const regionalFactors = {
        north: { turbidity: 0.8, chlorophyll: 1.1, ph: 8.1, dissolvedOxygen: 6.2 },
        east: { turbidity: 0.6, chlorophyll: 0.9, ph: 8.2, dissolvedOxygen: 6.5 },
        south: { turbidity: 0.7, chlorophyll: 1.0, ph: 8.0, dissolvedOxygen: 6.0 },
        west: { turbidity: 0.9, chlorophyll: 1.2, ph: 7.9, dissolvedOxygen: 5.8 },
        lagoon: { turbidity: 1.2, chlorophyll: 1.5, ph: 7.8, dissolvedOxygen: 5.5 },
      };

      const factors = regionalFactors[region as keyof typeof regionalFactors];
      const pollutionIndex = (factors.turbidity - 0.5) * 20 + (1.0 - factors.dissolvedOxygen / 7) * 30;

      const prediction = oceanHealthScoreFromNOAA(sst, hotspot, dhw);
      // Adjust score based on regional factors
      const adjustedScore = Math.max(0, Math.min(100, prediction.score - pollutionIndex * 0.5));

      return NextResponse.json({
        region,
        location: { lat: regionData.center[1], lon: regionData.center[0] },
        rawData: {
          sst,
          hotspot,
          dhw,
          ...factors,
          pollutionIndex,
        },
        prediction: {
          ...prediction,
          score: adjustedScore,
        },
        timestamp: new Date().toISOString(),
        dataSource: 'real-time',
      });
    }

    // Return data for all regions
    const regionsData: Record<string, any> = {};

    for (const [regionKey, regionData] of Object.entries(MAURITIUS_REGIONS)) {
      try {
        const reefData = await reefWatch.getReefHealth(regionData.center[1], regionData.center[0]);

        const sst = reefData.temperature;
        const hotspot = reefData.hotspot || 0;
        const dhw = reefData.degreeHeatingWeeks || 0;

        const regionalFactors = {
          north: { turbidity: 0.8, chlorophyll: 1.1, ph: 8.1, dissolvedOxygen: 6.2 },
          east: { turbidity: 0.6, chlorophyll: 0.9, ph: 8.2, dissolvedOxygen: 6.5 },
          south: { turbidity: 0.7, chlorophyll: 1.0, ph: 8.0, dissolvedOxygen: 6.0 },
          west: { turbidity: 0.9, chlorophyll: 1.2, ph: 7.9, dissolvedOxygen: 5.8 },
          lagoon: { turbidity: 1.2, chlorophyll: 1.5, ph: 7.8, dissolvedOxygen: 5.5 },
        };

        const factors = regionalFactors[regionKey as keyof typeof regionalFactors];
        const pollutionIndex = (factors.turbidity - 0.5) * 20 + (1.0 - factors.dissolvedOxygen / 7) * 30;

        const prediction = oceanHealthScoreFromNOAA(sst, hotspot, dhw);
        const adjustedScore = Math.max(0, Math.min(100, prediction.score - pollutionIndex * 0.5));

        regionsData[regionKey] = {
          location: { lat: regionData.center[1], lon: regionData.center[0] },
          bounds: regionData.bounds,
          rawData: {
            sst,
            hotspot,
            dhw,
            ...factors,
            pollutionIndex,
          },
          prediction: {
            ...prediction,
            score: adjustedScore,
          },
        };
      } catch (err) {
        console.error(`Error fetching data for region ${regionKey}:`, err);
      }
    }

    // Also return single point data for backward compatibility
    const reefData = await reefWatch.getReefHealth(lat, lng);
    const sst = reefData.temperature;
    const hotspot = reefData.hotspot || 0;
    const dhw = reefData.degreeHeatingWeeks || 0;
    const prediction = oceanHealthScoreFromNOAA(sst, hotspot, dhw);

    return NextResponse.json({
      location: { lat, lon: lng },
      rawData: {
        sst,
        hotspot,
        dhw,
      },
      prediction,
      regions: regionsData,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time',
    });

  } catch (error) {
    console.error('Error fetching ocean health prediction:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ocean health prediction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
