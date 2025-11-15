/**
 * API endpoint for current active cyclone data
 * Fetches real-time cyclone information from NOAA/IBTrACS
 */

import { NextRequest, NextResponse } from 'next/server';
import { CycloneService } from '@/lib/integrations/cyclone';

export async function GET(request: NextRequest) {
  try {
    console.log('🌀 Fetching current active cyclone data...');
    
    // Fetch from NOAA's real-time cyclone data
    const cycloneService = new CycloneService();
    const activeCyclone = await cycloneService.getActiveCyclone();
    
    if (activeCyclone) {
      console.log(`✅ Found active cyclone: ${activeCyclone.name}`);
      
      return NextResponse.json({
        success: true,
        activeCyclone,
        lastUpdated: new Date().toISOString(),
        source: 'NOAA Real-time Data',
        dataSource: 'real-time'
      });
    } else {
      console.log('📊 No active cyclones in Southwest Indian Ocean');
      
      return NextResponse.json({
        success: true,
        activeCyclone: {
          name: "No Active Cyclone",
          category: 0,
          windSpeed: 0,
          pressure: 1013,
          distance: 0,
          eta: 0,
          direction: "--",
          movement: "0 km/h",
          location: [-20.2, 57.5],
          timestamp: new Date()
        },
        lastUpdated: new Date().toISOString(),
        source: 'Real-time monitoring',
        dataSource: 'real-time'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching cyclone data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch real-time cyclone data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}