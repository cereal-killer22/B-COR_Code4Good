/**
 * Flood Risk API Route
 * Returns real-time flood risk assessment from Open-Meteo
 */

import { NextRequest, NextResponse } from 'next/server';
import { FloodRiskService } from '@/lib/integrations/flood';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    const floodService = new FloodRiskService();
    const floodRisk = await floodService.getFloodRisk(lat, lng);

    return NextResponse.json({
      floodRisk,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching flood risk data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch real-time flood risk data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

