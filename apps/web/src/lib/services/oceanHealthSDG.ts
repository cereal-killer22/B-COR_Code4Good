/**
 * Ocean Health SDG Service
 * Comprehensive implementation of SDG 14 (Life Below Water) targets
 * 
 * SDG 14 Targets:
 * 14.1 - Reduce marine pollution
 * 14.2 - Protect and restore ecosystems
 * 14.3 - Reduce ocean acidification
 * 14.4 - Regulate fishing and end overfishing
 * 14.5 - Conserve coastal and marine areas
 * 14.6 - End subsidies contributing to overfishing
 * 14.7 - Increase economic benefits from sustainable use
 * 14.a - Increase scientific knowledge
 * 14.b - Support small scale fishers
 * 14.c - Implement and enforce international law
 */

import type {
  OceanHealthMetrics,
  PollutionEvent,
  CoralReefData,
  BiodiversityMetrics,
  AcidificationMetrics,
  SustainableFishingMetrics,
} from '@climaguard/shared/types/ocean';
import { CoralReefWatch } from '@/lib/integrations/coralReefWatch';
import { OpenMeteoMarineService } from '@/lib/integrations/openMeteoMarine';
import { NASAGIBSService } from '@/lib/integrations/nasaGibs';
import { GlobalFishingWatch } from '@/lib/integrations/globalFishingWatch';
import { calculateOceanHealthIndex } from '@/lib/models/oceanHealth';

export interface SDG14Metrics {
  // Target 14.1: Marine Pollution
  pollutionReduction: {
    plasticDensity: number; // particles/km²
    oilSpillEvents: number;
    chemicalPollution: number; // 0-100
    sewageDischarge: number; // 0-100
    reductionTarget: number; // % reduction needed
    progress: number; // % progress toward target
  };

  // Target 14.2: Ecosystem Protection
  ecosystemHealth: {
    protectedAreaCoverage: number; // % of marine area protected
    reefHealthIndex: number; // 0-100
    mangroveCoverage: number; // km²
    seagrassCoverage: number; // km²
    restorationProgress: number; // % restored
  };

  // Target 14.3: Ocean Acidification
  acidificationStatus: {
    pH: number;
    aragoniteSaturation: number;
    acidificationRate: number; // pH units per decade
    vulnerableSpecies: number;
    mitigationProgress: number; // % progress
  };

  // Target 14.4: Sustainable Fishing
  fishingSustainability: {
    overfishingRate: number; // % of stocks overfished
    sustainableCatch: number; // tons
    totalCatch: number; // tons
    complianceRate: number; // % compliance with regulations
    stockStatus: 'healthy' | 'moderate' | 'depleted' | 'critical';
  };

  // Target 14.5: Marine Protected Areas
  protectedAreas: {
    totalArea: number; // km²
    percentageCoverage: number; // % of EEZ
    effectivelyManaged: number; // % effectively managed
    newAreasEstablished: number; // count this year
  };

  // Target 14.7: Economic Benefits
  economicBenefits: {
    sustainableTourism: number; // $ value
    sustainableFishing: number; // $ value
    blueEconomy: number; // $ value
    employment: number; // jobs in sustainable sectors
  };

  // Target 14.a: Scientific Knowledge
  researchCapacity: {
    monitoringStations: number;
    dataQuality: number; // 0-100
    researchOutput: number; // publications/year
    technologyAdoption: number; // % using advanced tech
  };

  // Overall SDG 14 Progress
  overallProgress: {
    score: number; // 0-100
    targetsOnTrack: number; // count
    targetsNeedingAttention: number; // count
    priorityActions: string[];
  };
}

export class OceanHealthSDGService {
  private reefWatch: CoralReefWatch;
  private marineService: OpenMeteoMarineService;
  private nasaGibs: NASAGIBSService;
  private fishingWatch: GlobalFishingWatch;

  constructor() {
    this.reefWatch = new CoralReefWatch();
    this.marineService = new OpenMeteoMarineService();
    this.nasaGibs = new NASAGIBSService();
    this.fishingWatch = new GlobalFishingWatch();
  }

  /**
   * Get comprehensive SDG 14 metrics for a location
   * Target 14.1-14.7, 14.a implementation
   */
  async getSDG14Metrics(
    lat: number,
    lng: number,
    region: string = 'Mauritius'
  ): Promise<SDG14Metrics> {
    // Fetch all ocean health data in parallel
    const [reefData, marineData, turbidityData, fishingData] = await Promise.all([
      this.reefWatch.getReefHealth(lat, lng),
      this.marineService.getMarineData(lat, lng),
      this.nasaGibs.getTurbidityData(lat, lng),
      this.fishingWatch.getSustainableFishingMetrics(lat, lng),
    ]);

    // Calculate pollution metrics (Target 14.1)
    const pollutionReduction = this.calculatePollutionReduction(
      turbidityData,
      marineData,
      region
    );

    // Calculate ecosystem health (Target 14.2)
    const ecosystemHealth = this.calculateEcosystemHealth(
      reefData,
      region
    );

    // Calculate acidification (Target 14.3)
    const acidificationStatus = this.calculateAcidificationStatus(
      marineData,
      reefData
    );

    // Calculate fishing sustainability (Target 14.4)
    const fishingSustainability = this.calculateFishingSustainability(
      fishingData
    );

    // Calculate protected areas (Target 14.5)
    const protectedAreas = this.calculateProtectedAreas(region);

    // Calculate economic benefits (Target 14.7)
    const economicBenefits = this.calculateEconomicBenefits(
      fishingData,
      region
    );

    // Calculate research capacity (Target 14.a)
    const researchCapacity = this.calculateResearchCapacity(region);

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress({
      pollutionReduction,
      ecosystemHealth,
      acidificationStatus,
      fishingSustainability,
      protectedAreas,
      economicBenefits,
      researchCapacity,
    });

    return {
      pollutionReduction,
      ecosystemHealth,
      acidificationStatus,
      fishingSustainability,
      protectedAreas,
      economicBenefits,
      researchCapacity,
      overallProgress,
    };
  }

  /**
   * Target 14.1: Reduce marine pollution
   */
  private calculatePollutionReduction(
    turbidityData: any,
    marineData: any,
    region: string
  ) {
    // Estimate plastic density from turbidity and chlorophyll
    const plasticDensity = Math.max(0, (turbidityData.turbidity * 10) + (turbidityData.chlorophyll * 5));
    
    // Oil spill risk from water quality indicators
    const oilSpillRisk = turbidityData.turbidity > 0.5 ? 25 : 10;
    
    // Chemical pollution estimate
    const chemicalPollution = Math.min(100, turbidityData.turbidity * 100);
    
    // Target: 50% reduction by 2030
    const reductionTarget = 50;
    const currentReduction = Math.max(0, 100 - chemicalPollution);
    const progress = (currentReduction / reductionTarget) * 100;

    return {
      plasticDensity: Math.round(plasticDensity * 100) / 100,
      oilSpillEvents: oilSpillRisk > 20 ? 1 : 0,
      chemicalPollution: Math.round(chemicalPollution),
      sewageDischarge: Math.round(chemicalPollution * 0.6),
      reductionTarget,
      progress: Math.min(100, Math.round(progress)),
    };
  }

  /**
   * Target 14.2: Protect and restore ecosystems
   */
  private calculateEcosystemHealth(reefData: any, region: string) {
    const reefHealthIndex = reefData.healthIndex || 0;
    
    // Estimate protected area coverage (would come from MPA database)
    const protectedAreaCoverage = region === 'Mauritius' ? 15 : 10; // % of EEZ
    
    // Estimate mangrove and seagrass (would come from satellite data)
    const mangroveCoverage = region === 'Mauritius' ? 12.5 : 10; // km²
    const seagrassCoverage = region === 'Mauritius' ? 45 : 30; // km²
    
    // Restoration progress (target: restore 20% by 2030)
    const restorationProgress = Math.min(100, (reefHealthIndex / 80) * 100);

    return {
      protectedAreaCoverage,
      reefHealthIndex,
      mangroveCoverage,
      seagrassCoverage,
      restorationProgress: Math.round(restorationProgress),
    };
  }

  /**
   * Target 14.3: Reduce ocean acidification
   */
  private calculateAcidificationStatus(marineData: any, reefData: any) {
    // pH from reef data or default
    const pH = reefData.pH || 8.1;
    
    // Aragonite saturation (critical for coral growth)
    // Normal: 3.5-4.5, concerning: <3.0
    const aragoniteSaturation = pH > 8.0 ? 3.8 : pH > 7.9 ? 3.2 : 2.8;
    
    // Acidification rate (estimated from pH trend)
    const acidificationRate = pH < 8.0 ? -0.02 : -0.01; // pH units per decade
    
    // Vulnerable species count (would come from biodiversity data)
    const vulnerableSpecies = pH < 7.9 ? 15 : 8;
    
    // Mitigation progress (target: maintain pH > 8.0)
    const mitigationProgress = pH >= 8.0 ? 100 : (pH / 8.0) * 100;

    return {
      pH: Math.round(pH * 100) / 100,
      aragoniteSaturation: Math.round(aragoniteSaturation * 10) / 10,
      acidificationRate: Math.round(acidificationRate * 100) / 100,
      vulnerableSpecies,
      mitigationProgress: Math.round(mitigationProgress),
    };
  }

  /**
   * Target 14.4: Regulate fishing and end overfishing
   */
  private calculateFishingSustainability(fishingData: any) {
    const sustainableCatch = fishingData.fishingActivity?.sustainableCatch || 0;
    const totalCatch = fishingData.fishingActivity?.totalCatch || 0;
    
    // Overfishing rate
    const overfishingRate = totalCatch > sustainableCatch
      ? ((totalCatch - sustainableCatch) / sustainableCatch) * 100
      : 0;
    
    // Compliance rate (from MPA compliance data)
    const complianceRate = fishingData.protectedAreaCompliance?.[0]?.complianceRate || 85;
    
    // Stock status
    const overfishingRisk = fishingData.fishingActivity?.overfishingRisk || 20;
    let stockStatus: 'healthy' | 'moderate' | 'depleted' | 'critical';
    if (overfishingRisk < 30) stockStatus = 'healthy';
    else if (overfishingRisk < 50) stockStatus = 'moderate';
    else if (overfishingRisk < 70) stockStatus = 'depleted';
    else stockStatus = 'critical';

    return {
      overfishingRate: Math.round(overfishingRate * 10) / 10,
      sustainableCatch: Math.round(sustainableCatch * 10) / 10,
      totalCatch: Math.round(totalCatch * 10) / 10,
      complianceRate: Math.round(complianceRate),
      stockStatus,
    };
  }

  /**
   * Target 14.5: Conserve coastal and marine areas
   */
  private calculateProtectedAreas(region: string) {
    // Would come from MPA database
    const totalArea = region === 'Mauritius' ? 2500 : 2000; // km²
    const percentageCoverage = region === 'Mauritius' ? 15 : 12; // % of EEZ
    const effectivelyManaged = 75; // % effectively managed
    const newAreasEstablished = 2; // count this year

    return {
      totalArea,
      percentageCoverage,
      effectivelyManaged,
      newAreasEstablished,
    };
  }

  /**
   * Target 14.7: Increase economic benefits
   */
  private calculateEconomicBenefits(fishingData: any, region: string) {
    const sustainableCatch = fishingData.fishingActivity?.totalCatch || 0;
    
    // Economic value estimates (would come from economic data)
    const sustainableFishing = sustainableCatch * 5000; // $5000 per ton
    const sustainableTourism = region === 'Mauritius' ? 1200000000 : 800000000; // $1.2B
    const blueEconomy = sustainableFishing + sustainableTourism;
    const employment = region === 'Mauritius' ? 45000 : 30000; // jobs

    return {
      sustainableTourism,
      sustainableFishing,
      blueEconomy,
      employment,
    };
  }

  /**
   * Target 14.a: Increase scientific knowledge
   */
  private calculateResearchCapacity(region: string) {
    // Would come from research database
    const monitoringStations = region === 'Mauritius' ? 12 : 8;
    const dataQuality = 85; // % data quality score
    const researchOutput = region === 'Mauritius' ? 25 : 15; // publications/year
    const technologyAdoption = 70; // % using advanced monitoring tech

    return {
      monitoringStations,
      dataQuality,
      researchOutput,
      technologyAdoption,
    };
  }

  /**
   * Calculate overall SDG 14 progress
   */
  private calculateOverallProgress(metrics: Omit<SDG14Metrics, 'overallProgress'>) {
    const scores = {
      pollution: metrics.pollutionReduction.progress,
      ecosystem: metrics.ecosystemHealth.restorationProgress,
      acidification: metrics.acidificationStatus.mitigationProgress,
      fishing: metrics.fishingSustainability.complianceRate,
      protectedAreas: metrics.protectedAreas.effectivelyManaged,
      economic: 75, // Estimated
      research: metrics.researchCapacity.dataQuality,
    };

    const overallScore = Math.round(
      (scores.pollution * 0.2 +
       scores.ecosystem * 0.2 +
       scores.acidification * 0.15 +
       scores.fishing * 0.15 +
       scores.protectedAreas * 0.1 +
       scores.economic * 0.1 +
       scores.research * 0.1)
    );

    const targetsOnTrack = Object.values(scores).filter(s => s >= 70).length;
    const targetsNeedingAttention = Object.values(scores).filter(s => s < 50).length;

    const priorityActions: string[] = [];
    if (scores.pollution < 50) priorityActions.push('Urgent: Reduce marine pollution');
    if (scores.ecosystem < 50) priorityActions.push('Restore degraded ecosystems');
    if (scores.acidification < 50) priorityActions.push('Address ocean acidification');
    if (scores.fishing < 50) priorityActions.push('End overfishing and illegal fishing');
    if (scores.protectedAreas < 30) priorityActions.push('Expand marine protected areas');

    return {
      score: Math.min(100, Math.max(0, overallScore)),
      targetsOnTrack,
      targetsNeedingAttention,
      priorityActions,
    };
  }

  /**
   * Get SDG 14 action recommendations
   */
  getActionRecommendations(metrics: SDG14Metrics): string[] {
    const recommendations: string[] = [];

    // Pollution recommendations
    if (metrics.pollutionReduction.progress < 50) {
      recommendations.push('Implement plastic waste reduction programs');
      recommendations.push('Strengthen oil spill response capabilities');
      recommendations.push('Improve wastewater treatment infrastructure');
    }

    // Ecosystem recommendations
    if (metrics.ecosystemHealth.restorationProgress < 50) {
      recommendations.push('Restore degraded coral reefs');
      recommendations.push('Protect and restore mangrove forests');
      recommendations.push('Establish new marine protected areas');
    }

    // Acidification recommendations
    if (metrics.acidificationStatus.mitigationProgress < 50) {
      recommendations.push('Reduce CO2 emissions to slow acidification');
      recommendations.push('Protect vulnerable species from acidification');
      recommendations.push('Monitor pH levels more frequently');
    }

    // Fishing recommendations
    if (metrics.fishingSustainability.complianceRate < 70) {
      recommendations.push('Strengthen fishing regulations enforcement');
      recommendations.push('Support sustainable fishing practices');
      recommendations.push('End subsidies that contribute to overfishing');
    }

    // Protected areas recommendations
    if (metrics.protectedAreas.percentageCoverage < 10) {
      recommendations.push('Expand marine protected area coverage to 10% of EEZ');
      recommendations.push('Improve management effectiveness of existing MPAs');
    }

    return recommendations;
  }
}

