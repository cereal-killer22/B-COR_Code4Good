/**
 * Ocean Health Prediction API Route
 * Fetches real-time coral reef data from NOAA ERDDAP
 * Returns ocean health score and risk assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { oceanHealthScoreFromNOAA } from '@/lib/predictors';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    // Use existing CoralReefWatch service which handles ERDDAP/Open-Meteo integration
    const reefWatch = new CoralReefWatch();
    const reefData = await reefWatch.getReefHealth(lat, lng);

    // Extract NOAA data
    const sst = reefData.temperature;
    const hotspot = reefData.hotspot || 0;
    const dhw = reefData.degreeHeatingWeeks || 0;

    // Get prediction
    const prediction = oceanHealthScoreFromNOAA(sst, hotspot, dhw);

    return NextResponse.json({
      location: { lat, lon: lng },
      rawData: {
        sst,
        hotspot,
        dhw
      },
      prediction,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching ocean health prediction:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ocean health prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

