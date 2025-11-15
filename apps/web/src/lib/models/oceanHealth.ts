/**
 * Ocean Health Data Models
 * Core models for SDG 14 ocean health monitoring
 */

import type {
  OceanHealthMetrics,
  PollutionEvent,
  CoralReefData,
  BiodiversityMetrics,
  AcidificationMetrics,
  SustainableFishingMetrics,
  OceanHealthIndex
} from '@climaguard/shared/types/ocean';

export type {
  OceanHealthMetrics,
  PollutionEvent,
  CoralReefData,
  BiodiversityMetrics,
  AcidificationMetrics,
  SustainableFishingMetrics,
  OceanHealthIndex
};

/**
 * Calculate overall ocean health score from component metrics
 */
export function calculateOceanHealthIndex(
  waterQuality: number,
  pollution: number,
  biodiversity: number,
  reefHealth: number,
  acidification: number = 80,
  fishing: number = 75
): OceanHealthIndex {
  // Weighted average with emphasis on critical factors
  const weights = {
    waterQuality: 0.25,
    pollution: 0.25,
    biodiversity: 0.15,
    reefHealth: 0.15,
    acidification: 0.10,
    fishing: 0.10
  };

  const overall = Math.round(
    waterQuality * weights.waterQuality +
    pollution * weights.pollution +
    biodiversity * weights.biodiversity +
    reefHealth * weights.reefHealth +
    acidification * weights.acidification +
    fishing * weights.fishing
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    waterQuality,
    pollution,
    biodiversity,
    reefHealth,
    acidification,
    fishing,
    timestamp: new Date()
  };
}

/**
 * Generate realistic fallback ocean health data for a location
 */
export function generateFallbackOceanHealth(
  lat: number,
  lng: number
): OceanHealthMetrics {
  // Base values for Mauritius region
  const baseTemp = 28.5;
  const basePH = 8.1;
  const baseSalinity = 35.2;

  // Add some realistic variation
  const variation = (base: number, range: number) => 
    base + (Math.random() - 0.5) * range;

  return {
    location: [lat, lng],
    timestamp: new Date(),
    waterQuality: {
      pH: variation(basePH, 0.2),
      temperature: variation(baseTemp, 2),
      salinity: variation(baseSalinity, 1),
      dissolvedOxygen: variation(6.5, 1),
      turbidity: variation(0.3, 0.2),
      score: 80 + Math.random() * 15
    },
    pollution: {
      plasticDensity: Math.random() * 2,
      oilSpillRisk: Math.random() * 20,
      chemicalPollution: Math.random() * 15,
      overallIndex: 75 + Math.random() * 20
    },
    biodiversity: {
      speciesCount: 1000 + Math.floor(Math.random() * 500),
      endangeredSpecies: Math.floor(Math.random() * 10),
      biodiversityIndex: 70 + Math.random() * 20
    },
    reefHealth: {
      bleachingRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      healthIndex: 75 + Math.random() * 20,
      temperature: variation(baseTemp, 1.5),
      pH: variation(basePH, 0.15),
      coverage: 30 + Math.random() * 30
    },
    overallHealthScore: 75 + Math.random() * 20
  };
}

/**
 * Validate ocean health metrics
 */
export function validateOceanHealthMetrics(
  metrics: Partial<OceanHealthMetrics>
): metrics is OceanHealthMetrics {
  if (!metrics.location || !metrics.timestamp) return false;
  if (!metrics.waterQuality || !metrics.pollution) return false;
  if (!metrics.biodiversity || !metrics.reefHealth) return false;
  if (typeof metrics.overallHealthScore !== 'number') return false;
  
  // Validate ranges
  if (metrics.overallHealthScore < 0 || metrics.overallHealthScore > 100) return false;
  if (metrics.waterQuality.pH < 6 || metrics.waterQuality.pH > 9) return false;
  if (metrics.waterQuality.temperature < 0 || metrics.waterQuality.temperature > 40) return false;
  
  return true;
}

