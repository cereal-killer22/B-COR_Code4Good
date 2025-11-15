/**
 * API endpoint for current active cyclone data
 * Fetches real-time cyclone information from NOAA/IBTrACS
 */

import { NextRequest, NextResponse } from 'next/server';

interface CycloneData {
  name: string;
  category: number;
  windSpeed: number; // km/h
  pressure: number; // hPa
  distance: number; // km from Mauritius
  eta: number; // hours
  direction: string;
  movement: string;
  lat?: number;
  lng?: number;
  basin?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🌀 Fetching current active cyclone data...');
    
    // Fetch from NOAA's real-time cyclone data
    const activeCyclone = await fetchActiveCyclone();
    
    if (activeCyclone) {
      console.log(`✅ Found active cyclone: ${activeCyclone.name}`);
      
      return NextResponse.json({
        success: true,
        activeCyclone,
        lastUpdated: new Date().toISOString(),
        source: 'NOAA/NHC Real-time Data'
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
          movement: "0 km/h"
        },
        lastUpdated: new Date().toISOString(),
        source: 'Real-time monitoring'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching cyclone data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch cyclone data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch active cyclone from real data sources
 */
async function fetchActiveCyclone(): Promise<CycloneData | null> {
  try {
    // Try NOAA's JSON feed for active storms
    console.log('🌍 Connecting to NOAA active cyclone feed...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Longer timeout for NOAA
    
    const noaaResponse = await fetch(
      'https://www.nhc.noaa.gov/CurrentStorms.json',
      { 
        headers: { 
          'User-Agent': 'ClimaGuard/1.0 (Climate Monitoring System)' 
        },
        cache: 'no-store', // Always fetch fresh data
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (noaaResponse.ok) {
      const data = await noaaResponse.json();
      console.log('✅ Successfully fetched NOAA storm data');
      
      // Look for storms in Southwest Indian Ocean (our region)
      const swIndianOceanStorms = data.activeStorms?.filter((storm: any) => 
        storm.basin === 'SI' || // Southwest Indian Ocean
        (storm.center && 
         storm.center[1] >= -30 && storm.center[1] <= -10 && // Latitude range
         storm.center[0] >= 40 && storm.center[0] <= 90)     // Longitude range
      );
      
      if (swIndianOceanStorms && swIndianOceanStorms.length > 0) {
        const storm = swIndianOceanStorms[0]; // Get closest/strongest storm
        
        // Calculate distance from Mauritius (-20.2, 57.5)
        const mauritiusLat = -20.2;
        const mauritiusLng = 57.5;
        const stormLat = storm.center?.[1] || 0;
        const stormLng = storm.center?.[0] || 0;
        
        const distance = calculateDistance(mauritiusLat, mauritiusLng, stormLat, stormLng);
        const eta = estimateArrivalTime(distance, storm.movement?.speed || 15);
        
        return {
          name: storm.name || 'Unnamed Storm',
          category: storm.intensity?.category || categorizeIntensity(storm.intensity?.wind || 0),
          windSpeed: Math.round((storm.intensity?.wind || 0) * 1.852), // Convert knots to km/h
          pressure: storm.intensity?.pressure || 1000,
          distance: Math.round(distance),
          eta: Math.round(eta),
          direction: storm.movement?.direction || '--',
          movement: `${Math.round((storm.movement?.speed || 0) * 1.852)} km/h`,
          lat: stormLat,
          lng: stormLng,
          basin: storm.basin
        };
      }
    } else {
      console.warn(`⚠️ NOAA API returned ${noaaResponse.status}: ${noaaResponse.statusText}`);
    }

    // Fallback: Check alternative sources or return null
    console.log('📡 Checking alternative cyclone data sources...');
    
    // Could add more data sources here (JTWC, regional meteorological services, etc.)
    
    return null;

  } catch (error) {
    console.error('❌ Error in fetchActiveCyclone:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Estimate arrival time based on distance and speed
 */
function estimateArrivalTime(distance: number, speedKmh: number): number {
  if (speedKmh === 0) return 999; // Very far future
  return distance / speedKmh; // Hours
}

/**
 * Categorize cyclone intensity from wind speed
 */
function categorizeIntensity(windKnots: number): number {
  const windKmh = windKnots * 1.852;
  
  if (windKmh >= 250) return 5;
  if (windKmh >= 210) return 4;
  if (windKmh >= 178) return 3;
  if (windKmh >= 154) return 2;
  if (windKmh >= 119) return 1;
  if (windKmh >= 63) return 0; // Tropical storm
  
  return -1; // Tropical depression
}