/**
 * Reef Health API Route
 * Returns coral reef health data and bleaching predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { CoralBleachingPredictor } from '@/lib/models/coralBleachingPredictor';
import { OpenMeteoMarineService } from '@/lib/integrations/openMeteoMarine';
import type { CoralReefData } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const includePredictions = searchParams.get('predictions') === 'true';
    
    // Fetch reef health data
    const reefData = await fetchReefHealthData(lat, lng, includePredictions);
    
    return NextResponse.json({
      reef: reefData.reef,
      prediction: reefData.prediction,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching reef health:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reef health data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchReefHealthData(
  lat: number,
  lng: number,
  includePredictions: boolean = false
): Promise<{
  reef: CoralReefData;
  prediction?: any;
}> {
  // Initialize services (FREE APIs only)
  const reefWatch = new CoralReefWatch();
  const openMeteo = new OpenMeteoMarineService();
  
  // Fetch reef health from NOAA/Open-Meteo
  const reefWatchData = await reefWatch.getReefHealth(lat, lng);
  
  // Fetch marine data for additional context (pH would need sensor data - using default)
  const marineData = await openMeteo.getMarineData(lat, lng);
  
  // Get SST trend for historical data
  const sstTrend = await reefWatch.getSSTTrend(lat, lng);
  
  // Build reef data using real values only
  const reef: CoralReefData = {
    id: `reef-${lat}-${lng}`,
    location: [lat, lng],
    name: `Reef at ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    bleachingRisk: reefWatchData.bleachingRisk,
    temperature: reefWatchData.temperature,
    anomaly: reefWatchData.anomaly,
    healthIndex: reefWatchData.healthIndex,
    pH: 8.1, // Default (pH requires sensor data - not available in free APIs)
    coverage: 0, // Would come from reef surveys (not available in free APIs)
    biodiversity: 0, // Would come from biodiversity surveys (not available in free APIs)
    lastAssessment: new Date()
  };
  
  let prediction = undefined;
  
  if (includePredictions) {
    // Generate bleaching prediction using real NOAA data
    const predictor = new CoralBleachingPredictor();
    
    // Use real SST trend data for historical context
    const historicalSST = sstTrend.trend30d.length > 0 ? sstTrend.trend30d : [reefWatchData.temperature];
    
    prediction = await predictor.predictBleachingRisk(
      reefWatchData.temperature,
      reefWatchData.anomaly || 0,
      reefWatchData.degreeHeatingWeeks || 0,
      reefWatchData.hotspot || 0,
      reef.pH,
      historicalSST
    );
    
    predictor.dispose();
  }
  
  return { reef, prediction };
}

