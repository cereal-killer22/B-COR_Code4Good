/**
 * Storm Surge Risk API Route
 * Returns real-time storm surge risk from Open-Meteo Marine
 */

import { NextRequest, NextResponse } from 'next/server';
import { StormSurgeService } from '@/lib/integrations/stormSurge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    const stormSurgeService = new StormSurgeService();
    const stormSurge = await stormSurgeService.getStormSurgeRisk(lat, lng);

    // Check if we got valid data (not fallback)
    const dataSource = stormSurge.waveHeightMax > 0 || stormSurge.windSpeedMax > 0 
      ? 'real-time' 
      : 'fallback';

    return NextResponse.json({
      stormSurge,
      timestamp: new Date().toISOString(),
      dataSource
    });

  } catch (error) {
    console.error('Error fetching storm surge risk data:', error);
    
    // Return low-risk fallback instead of error
    return NextResponse.json({
      stormSurge: {
        location: [parseFloat(searchParams.get('lat') || '-20.2'), parseFloat(searchParams.get('lng') || '57.5')],
        timestamp: new Date(),
        riskLevel: 'low' as const,
        riskScore: 0,
        waveHeightMax: 0,
        windSpeedMax: 0,
        swellHeight: 0,
        alerts: []
      },
      timestamp: new Date().toISOString(),
      dataSource: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

