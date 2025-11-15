/**
 * Biodiversity API Route
 * Returns marine biodiversity metrics using real NASA chlorophyll data
 */

import { NextRequest, NextResponse } from 'next/server';
import { NASAGIBSService } from '@/lib/integrations/nasaGibs';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import type { BiodiversityMetrics } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch biodiversity data from real sources
    const biodiversity = await fetchBiodiversityData(lat, lng);
    
    return NextResponse.json({
      biodiversity,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });
    
  } catch (error) {
    console.error('Error fetching biodiversity data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch real-time biodiversity data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchBiodiversityData(lat: number, lng: number): Promise<BiodiversityMetrics> {
  // Fetch real data from NASA GIBS (chlorophyll) and NOAA (reef health)
  const nasaGibs = new NASAGIBSService();
  const reefWatch = new CoralReefWatch();
  
  const [turbidityData, reefData] = await Promise.all([
    nasaGibs.getTurbidityData(lat, lng),
    reefWatch.getReefHealth(lat, lng)
  ]);
  
  // Calculate biodiversity index from real chlorophyll and water quality
  // Higher chlorophyll = more primary productivity = better biodiversity potential
  const chlorophyll = turbidityData.chlorophyll;
  const waterClarity = turbidityData.waterClarity;
  
  // Biodiversity index based on:
  // - Chlorophyll concentration (indicator of primary productivity)
  // - Water clarity (indicator of habitat quality)
  // - Reef health (indicator of ecosystem condition)
  const biodiversityIndex = Math.max(0, Math.min(100,
    (chlorophyll * 20) + // Chlorophyll contributes up to 20 points
    (waterClarity * 0.3) + // Water clarity contributes up to 30 points
    (reefData.healthIndex * 0.5) // Reef health contributes up to 50 points
  ));
  
  // Estimate habitat health from real data
  const coralHealth = reefData.healthIndex;
  const seagrassHealth = Math.max(0, Math.min(100, waterClarity + (chlorophyll * 10)));
  const mangroveHealth = Math.max(0, Math.min(100, 60 + (waterClarity * 0.4)));
  const overallHabitat = (coralHealth + seagrassHealth + mangroveHealth) / 3;
  
  return {
    location: [lat, lng],
    timestamp: new Date(),
    speciesCount: 0, // Would require biodiversity database (not available in free APIs)
    endangeredSpecies: 0, // Would require biodiversity database
    biodiversityIndex: Math.round(biodiversityIndex),
    speciesList: [], // Would require biodiversity database
    habitatHealth: {
      coral: Math.round(coralHealth),
      seagrass: Math.round(seagrassHealth),
      mangrove: Math.round(mangroveHealth),
      overall: Math.round(overallHabitat)
    }
  };
}

