/**
 * Ocean History API Route
 * Returns SST trends and historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { OpenMeteoMarineService } from '@/lib/integrations/openMeteoMarine';
import type { SSTTrend } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const days = parseInt(searchParams.get('days') || '30');
    
    // Fetch SST trend from NOAA
    const reefWatch = new CoralReefWatch();
    const sstTrend = await reefWatch.getSSTTrend(lat, lng);
    
    // Also get Open-Meteo data for comparison
    const openMeteo = new OpenMeteoMarineService();
    const marineData = await openMeteo.getMarineData(lat, lng, days);
    
    // Combine data
    const history: SSTTrend = {
      location: [lat, lng],
      timestamp: new Date(),
      sst: sstTrend.sst,
      sstAnomaly: sstTrend.sstAnomaly,
      hotspot: sstTrend.hotspot,
      degreeHeatingWeeks: sstTrend.degreeHeatingWeeks,
      trend7d: sstTrend.trend7d,
      trend30d: sstTrend.trend30d.length >= days 
        ? sstTrend.trend30d.slice(-days)
        : sstTrend.trend30d,
      baseline: sstTrend.baseline
    };
    
    // Add Open-Meteo SST trend for comparison
    const openMeteoTrend = marineData.daily?.map(d => d.seaSurfaceTemperature) || [];
    
    return NextResponse.json({
      history,
      openMeteoTrend,
      comparison: {
        noaaSST: sstTrend.sst,
        openMeteoSST: marineData.seaSurfaceTemperature,
        difference: sstTrend.sst - marineData.seaSurfaceTemperature
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in ocean-history API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch ocean history data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

