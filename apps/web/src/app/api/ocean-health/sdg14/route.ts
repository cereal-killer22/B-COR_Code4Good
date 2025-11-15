/**
 * SDG 14 Metrics API Route
 * Returns comprehensive SDG 14 (Life Below Water) metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { OceanHealthSDGService } from '@/lib/services/oceanHealthSDG';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const region = searchParams.get('region') || 'Mauritius';
    
    const sdgService = new OceanHealthSDGService();
    const metrics = await sdgService.getSDG14Metrics(lat, lng, region);
    const recommendations = sdgService.getActionRecommendations(metrics);
    
    return NextResponse.json({
      metrics,
      recommendations,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time',
      region,
    });
  } catch (error) {
    console.error('Error fetching SDG 14 metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch SDG 14 metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

