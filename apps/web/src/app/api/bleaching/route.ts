/**
 * Bleaching Risk API Route
 * Uses real NOAA Coral Reef Watch data for bleaching predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { OpenMeteoMarineService } from '@/lib/integrations/openMeteoMarine';
import type { BleachingRisk } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch real NOAA data
    const reefWatch = new CoralReefWatch();
    const openMeteo = new OpenMeteoMarineService();
    
    const [reefHealthResult, sstTrendResult] = await Promise.allSettled([
      reefWatch.getReefHealth(lat, lng),
      openMeteo.getSSTTrend(lat, lng, 7)
    ]);
    
    const reefHealth = reefHealthResult.status === 'fulfilled' ? reefHealthResult.value : null;
    const sstTrend = sstTrendResult.status === 'fulfilled' ? sstTrendResult.value : null;
    
    if (!reefHealth) {
      throw new Error('Failed to fetch reef health data');
    }
    
    // Calculate bleaching risk based on NOAA standards
    const sst = reefHealth.temperature;
    const dhw = reefHealth.degreeHeatingWeeks || 0;
    const hotspot = reefHealth.hotspot || 0;
    const alertLevel = reefHealth.alertLevel || 0;
    const sstAnomaly = reefHealth.anomaly || 0;
    
    // Determine risk level based on NOAA alert levels and DHW
    let riskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let probability = 0.1;
    let daysToBleaching: number | undefined = undefined;
    let confidence = 0.7;
    
    if (alertLevel >= 4 || sst >= 31 || dhw >= 12) {
      riskLevel = 'severe';
      probability = 0.9;
      daysToBleaching = dhw >= 12 ? 0 : Math.max(1, Math.round((12 - dhw) * 7));
      confidence = 0.95;
    } else if (alertLevel >= 3 || sst >= 30.5 || dhw >= 8) {
      riskLevel = 'high';
      probability = 0.7;
      daysToBleaching = dhw >= 8 ? 7 : Math.max(7, Math.round((8 - dhw) * 7));
      confidence = 0.85;
    } else if (alertLevel >= 2 || sst >= 30 || dhw >= 4) {
      riskLevel = 'moderate';
      probability = 0.4;
      daysToBleaching = dhw >= 4 ? 14 : Math.max(14, Math.round((4 - dhw) * 7));
      confidence = 0.75;
    } else {
      riskLevel = 'low';
      probability = 0.1;
      confidence = 0.8;
    }
    
    // Generate recommended actions based on risk level
    const recommendedActions: string[] = [];
    if (riskLevel === 'severe' || riskLevel === 'high') {
      recommendedActions.push('Immediate monitoring and protective measures required');
      recommendedActions.push('Consider temporary restrictions on reef activities');
      recommendedActions.push('Increase water circulation if possible (artificial upwelling)');
      recommendedActions.push('Monitor water quality parameters daily');
    } else if (riskLevel === 'moderate') {
      recommendedActions.push('Enhanced monitoring recommended');
      recommendedActions.push('Track SST trends and DHW accumulation');
      recommendedActions.push('Prepare contingency plans for reef protection');
    } else {
      recommendedActions.push('Continue regular monitoring');
      recommendedActions.push('Maintain baseline data collection');
    }
    
    // Build comprehensive bleaching risk response
    const bleachingRisk: BleachingRisk = {
      location: [lat, lng],
      timestamp: new Date(),
      riskLevel,
      probability,
      sst,
      sstAnomaly,
      degreeHeatingWeeks: dhw,
      hotspot,
      alertLevel,
      daysToBleaching,
      recommendedActions,
      confidence
    };
    
    // Build SST trend response
    const trend7d = sstTrend && sstTrend.length >= 7 
      ? sstTrend.slice(-7) 
      : Array(7).fill(sst);
    const baseline = trend7d.length > 0 
      ? trend7d.slice(0, Math.floor(trend7d.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(trend7d.length / 2)
      : 28.5;
    
    return NextResponse.json({
      bleachingRisk,
      sstTrend: {
        current: sst,
        anomaly: sstAnomaly,
        trend7d,
        baseline
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
