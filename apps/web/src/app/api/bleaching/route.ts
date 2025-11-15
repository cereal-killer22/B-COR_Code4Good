/**
 * Bleaching Risk API Route
 * Uses real NOAA Coral Reef Watch data for bleaching predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoralBleachingPredictor } from '@/lib/models/coralBleachingPredictor';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import type { BleachingRisk } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch real NOAA data
    const reefWatch = new CoralReefWatch();
    const [reefHealth, sstTrend] = await Promise.all([
      reefWatch.getReefHealth(lat, lng),
      reefWatch.getSSTTrend(lat, lng)
    ]);
    
    // Use real NOAA data for prediction
    const predictor = new CoralBleachingPredictor();
    const prediction = await predictor.predictBleachingRisk(
      reefHealth.temperature,
      reefHealth.anomaly,
      reefHealth.degreeHeatingWeeks || 0,
      reefHealth.hotspot || 0,
      8.1, // Default pH (can be enhanced with real data)
      sstTrend.trend7d
    );
    
    // Build comprehensive bleaching risk response
    const bleachingRisk: BleachingRisk = {
      location: [lat, lng],
      timestamp: new Date(),
      riskLevel: prediction.riskLevel === 'low' ? 'low' :
                 prediction.riskLevel === 'medium' ? 'moderate' :
                 prediction.riskLevel === 'high' ? 'high' : 'severe',
      probability: prediction.probability,
      sst: reefHealth.temperature,
      sstAnomaly: reefHealth.anomaly,
      degreeHeatingWeeks: reefHealth.degreeHeatingWeeks || 0,
      hotspot: reefHealth.hotspot || 0,
      alertLevel: reefHealth.alertLevel || 0,
      daysToBleaching: prediction.daysToBleaching,
      recommendedActions: prediction.recommendations,
      confidence: prediction.confidence
    };
    
    // Clean up
    predictor.dispose();
    
    return NextResponse.json({
      bleachingRisk,
      sstTrend: {
        current: sstTrend.sst,
        anomaly: sstTrend.sstAnomaly,
        trend7d: sstTrend.trend7d,
        baseline: sstTrend.baseline
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in bleaching API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch bleaching risk data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

