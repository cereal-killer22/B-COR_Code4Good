/**
 * Biodiversity API Route
 * Returns marine biodiversity metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import type { BiodiversityMetrics } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch biodiversity data
    const biodiversity = await fetchBiodiversityData(lat, lng);
    
    return NextResponse.json({
      biodiversity,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching biodiversity data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch biodiversity data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchBiodiversityData(lat: number, lng: number): Promise<BiodiversityMetrics> {
  // Mock data - would integrate with biodiversity databases in production
  const speciesList = [
    { name: 'Blue Marlin', status: 'threatened' as const, population: 50000 },
    { name: 'Humpback Whale', status: 'endangered' as const, population: 2000 },
    { name: 'Green Turtle', status: 'endangered' as const, population: 5000 },
    { name: 'Manta Ray', status: 'vulnerable' as const, population: 10000 },
    { name: 'Coral Grouper', status: 'common' as const, population: 200000 },
    { name: 'Parrotfish', status: 'common' as const, population: 500000 },
    { name: 'Angelfish', status: 'common' as const, population: 300000 },
    { name: 'Shark', status: 'threatened' as const, population: 15000 }
  ];
  
  const endangeredCount = speciesList.filter(s => 
    s.status === 'endangered' || s.status === 'critically_endangered'
  ).length;
  
  const totalSpecies = speciesList.length;
  const totalPopulation = speciesList.reduce((sum, s) => sum + s.population, 0);
  
  // Calculate biodiversity index (simplified)
  const biodiversityIndex = Math.min(100, 
    50 + (totalSpecies / 20) * 30 + (endangeredCount < 3 ? 20 : 0)
  );
  
  return {
    location: [lat, lng],
    timestamp: new Date(),
    speciesCount: totalSpecies,
    endangeredSpecies: endangeredCount,
    biodiversityIndex: Math.round(biodiversityIndex),
    speciesList,
    habitatHealth: {
      coral: 75 + Math.random() * 20,
      seagrass: 70 + Math.random() * 25,
      mangrove: 65 + Math.random() * 30,
      overall: 70 + Math.random() * 25
    }
  };
}

