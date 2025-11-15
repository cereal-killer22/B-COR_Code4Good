/**
 * Reef Health API Route
 * Returns coral reef health data and bleaching predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { CoralBleachingPredictor } from '@/lib/models/coralBleachingPredictor';
import { CopernicusMarineService } from '@/lib/integrations/copernicusMarine';
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
  // Initialize services
  const reefWatch = new CoralReefWatch();
  const marineService = new CopernicusMarineService();
  
  // Fetch reef health from NOAA
  const reefWatchData = await reefWatch.getReefHealth(lat, lng);
  
  // Fetch water quality for pH
  const marineData = await marineService.getMarineData(lat, lng);
  
  // Build reef data
  const reef: CoralReefData = {
    id: `reef-${lat}-${lng}`,
    location: [lat, lng],
    name: `Reef at ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    bleachingRisk: reefWatchData.bleachingRisk,
    temperature: reefWatchData.temperature,
    anomaly: reefWatchData.anomaly,
    healthIndex: reefWatchData.healthIndex,
    pH: marineData.pH || 8.1,
    coverage: 30 + Math.random() * 30, // Would come from actual surveys
    biodiversity: 50 + Math.random() * 30,
    lastAssessment: new Date()
  };
  
  let prediction = undefined;
  
  if (includePredictions) {
    // Generate bleaching prediction
    const predictor = new CoralBleachingPredictor();
    
    // Generate historical temperature data (would come from database)
    const historicalData = Array.from({ length: 30 }, () => 
      reefWatchData.temperature + (Math.random() - 0.5) * 2
    );
    
    prediction = await predictor.predictBleachingRisk(
      reefWatchData.temperature,
      reef.pH,
      historicalData
    );
    
    predictor.dispose();
  }
  
  return { reef, prediction };
}

