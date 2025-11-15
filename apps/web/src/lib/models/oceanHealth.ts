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
 * REMOVED: generateFallbackOceanHealth
 * All data must come from real APIs - no fallback mock data allowed
 * If APIs fail, throw errors instead of returning fake data
 */

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

