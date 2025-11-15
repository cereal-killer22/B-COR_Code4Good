/**
 * Fishing Activity API Route
 * Returns fishing vessel data and activity metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { GlobalFishingWatch } from '@/lib/integrations/globalFishingWatch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const radius = parseFloat(searchParams.get('radius') || '0.5');
    
    const fishingWatch = new GlobalFishingWatch();
    
    // Get fishing activity
    const activity = await fishingWatch.getFishingActivity(lat, lng, radius);
    
    // Get sustainable fishing metrics
    const metrics = await fishingWatch.getSustainableFishingMetrics(lat, lng);
    
    return NextResponse.json({
      activity,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in fishing-activity API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch fishing activity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

