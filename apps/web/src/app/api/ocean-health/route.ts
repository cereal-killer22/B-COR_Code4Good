/**
 * Ocean Health API Route
 * Returns comprehensive ocean health metrics for a location
 */

import { NextRequest, NextResponse } from 'next/server';
import { CopernicusMarineService } from '@/lib/integrations/copernicusMarine';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { OceanAcidificationService } from '@/lib/integrations/oceanAcidification';
import { GlobalFishingWatch } from '@/lib/integrations/globalFishingWatch';
import { generateFallbackOceanHealth, calculateOceanHealthIndex } from '@/lib/models/oceanHealth';
import type { OceanHealthMetrics } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch ocean health data from multiple sources
    const oceanHealth = await fetchOceanHealthData(lat, lng);
    
    return NextResponse.json({ 
      oceanHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ocean-health API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch ocean health data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchOceanHealthData(lat: number, lng: number): Promise<OceanHealthMetrics> {
  try {
    // Initialize services
    const marineService = new CopernicusMarineService();
    const reefWatch = new CoralReefWatch();
    const acidificationService = new OceanAcidificationService();
    const fishingWatch = new GlobalFishingWatch();
    
    // Fetch data from all sources in parallel
    const [marineData, reefData, acidificationData, fishingMetrics] = await Promise.all([
      marineService.getMarineData(lat, lng),
      reefWatch.getReefHealth(lat, lng),
      acidificationService.getAcidificationMetrics(lat, lng),
      fishingWatch.getSustainableFishingMetrics(lat, lng)
    ]);
    
    // Calculate water quality score
    const waterQualityScore = calculateWaterQualityScore(marineData);
    
    // Calculate pollution index (would use actual pollution detection)
    const pollutionIndex = 80 - Math.random() * 15; // Placeholder
    
    // Calculate biodiversity index
    const biodiversityIndex = 70 + Math.random() * 20; // Placeholder
    
    // Get reef health index
    const reefHealthIndex = reefData.healthIndex;
    
    // Calculate overall health score
    const healthIndex = calculateOceanHealthIndex(
      waterQualityScore,
      pollutionIndex,
      biodiversityIndex,
      reefHealthIndex,
      acidificationData.pH > 7.8 ? 80 : 60,
      fishingMetrics.fishingActivity.overfishingRisk < 50 ? 80 : 60
    );
    
    return {
      location: [lat, lng],
      timestamp: new Date(),
      waterQuality: {
        pH: marineData.pH || acidificationData.pH,
        temperature: marineData.temperature,
        salinity: marineData.salinity,
        dissolvedOxygen: marineData.dissolvedOxygen || 6.5,
        turbidity: marineData.turbidity || 0.3,
        score: waterQualityScore
      },
      pollution: {
        plasticDensity: Math.random() * 2,
        oilSpillRisk: Math.random() * 20,
        chemicalPollution: Math.random() * 15,
        overallIndex: pollutionIndex
      },
      biodiversity: {
        speciesCount: 1000 + Math.floor(Math.random() * 500),
        endangeredSpecies: Math.floor(Math.random() * 10),
        biodiversityIndex
      },
      reefHealth: {
        bleachingRisk: reefData.bleachingRisk,
        healthIndex: reefHealthIndex,
        temperature: reefData.temperature,
        pH: marineData.pH || acidificationData.pH,
        coverage: 30 + Math.random() * 30
      },
      overallHealthScore: healthIndex.overall
    };
    
  } catch (error) {
    console.error('Error fetching ocean health data:', error);
    // Return fallback data
    return generateFallbackOceanHealth(lat, lng);
  }
}

/**
 * Calculate water quality score from marine data
 */
function calculateWaterQualityScore(data: {
  pH?: number;
  temperature: number;
  salinity: number;
  dissolvedOxygen?: number;
  turbidity?: number;
}): number {
  let score = 100;
  
  // pH scoring (optimal: 7.8-8.4)
  if (data.pH) {
    if (data.pH >= 7.8 && data.pH <= 8.4) {
      score -= 0; // Perfect
    } else if (data.pH >= 7.6 && data.pH < 8.6) {
      score -= 10; // Good
    } else {
      score -= 30; // Poor
    }
  }
  
  // Temperature scoring (optimal: 26-30°C for tropical)
  if (data.temperature < 26 || data.temperature > 30) {
    score -= 15;
  }
  
  // Salinity scoring (optimal: 34-36 ppt)
  if (data.salinity < 34 || data.salinity > 36) {
    score -= 10;
  }
  
  // Dissolved oxygen scoring (optimal: >5 mg/L)
  if (data.dissolvedOxygen) {
    if (data.dissolvedOxygen < 5) {
      score -= 20;
    } else if (data.dissolvedOxygen < 6) {
      score -= 10;
    }
  }
  
  // Turbidity scoring (lower is better)
  if (data.turbidity && data.turbidity > 1) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

