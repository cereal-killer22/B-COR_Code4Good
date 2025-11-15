/**
 * Ocean Health and Marine Ecosystem Types
 * Shared types for SDG 14 (Life Below Water) features
 */

export interface OceanHealthMetrics {
  location: [number, number];
  timestamp: Date;
  
  // Water Quality
  waterQuality: {
    pH: number;
    temperature: number; // SST
    salinity: number;
    dissolvedOxygen: number;
    turbidity: number;
    score: number; // 0-100
  };
  
  // Pollution
  pollution: {
    plasticDensity: number; // particles/km²
    oilSpillRisk: number; // 0-100
    chemicalPollution: number; // 0-100
    overallIndex: number; // 0-100
  };
  
  // Biodiversity
  biodiversity: {
    speciesCount: number;
    endangeredSpecies: number;
    biodiversityIndex: number; // 0-100
  };
  
  // Coral Reef Health
  reefHealth: {
    bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
    healthIndex: number; // 0-100
    temperature: number;
    pH: number;
    coverage: number; // % coral coverage
  };
  
  // Overall Health Score
  overallHealthScore: number; // 0-100
}

export interface PollutionEvent {
  id: string;
  type: 'oil_spill' | 'plastic' | 'chemical' | 'debris' | 'sewage';
  location: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedArea: number; // km²
  predictedSpread: [number, number][];
  source?: string;
  status: 'detected' | 'confirmed' | 'contained' | 'resolved';
}

export interface CoralReefData {
  id: string;
  location: [number, number];
  name?: string;
  bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
  temperature: number;
  anomaly: number; // Temperature anomaly
  healthIndex: number;
  pH: number;
  coverage: number; // % coral coverage
  biodiversity: number;
  lastAssessment: Date;
}

export interface BiodiversityMetrics {
  location: [number, number];
  timestamp: Date;
  speciesCount: number;
  endangeredSpecies: number;
  biodiversityIndex: number; // 0-100
  speciesList: {
    name: string;
    status: 'common' | 'threatened' | 'endangered' | 'critically_endangered';
    population: number;
  }[];
  habitatHealth: {
    coral: number; // 0-100
    seagrass: number; // 0-100
    mangrove: number; // 0-100
    overall: number; // 0-100
  };
}

export interface AcidificationMetrics {
  location: [number, number];
  timestamp: Date;
  pH: number;
  pHAnomaly: number; // Deviation from baseline
  aragoniteSaturation: number; // Ωarag
  co2Concentration: number; // ppm
  trend: 'improving' | 'stable' | 'declining';
  projectedpH: {
    year2025: number;
    year2030: number;
    year2050: number;
  };
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SustainableFishingMetrics {
  location: [number, number];
  timestamp: Date;
  fishingActivity: {
    vesselCount: number;
    totalCatch: number; // tons
    sustainableCatch: number; // tons
    overfishingRisk: number; // 0-100
  };
  stockStatus: {
    species: string;
    stockLevel: 'healthy' | 'moderate' | 'depleted' | 'critical';
    biomass: number; // tons
    maxSustainableYield: number; // tons
  }[];
  protectedAreaCompliance: {
    mpaName: string;
    violations: number;
    complianceRate: number; // 0-100
  }[];
}

export interface OceanHealthIndex {
  overall: number; // 0-100
  waterQuality: number;
  pollution: number;
  biodiversity: number;
  reefHealth: number;
  acidification: number;
  fishing: number;
  timestamp: Date;
}

/**
 * SST (Sea Surface Temperature) Trend Data
 */
export interface SSTTrend {
  location: [number, number];
  timestamp: Date;
  sst: number; // Current SST in Celsius
  sstAnomaly: number; // Temperature anomaly from baseline
  hotspot: number; // HotSpot value (positive = above threshold)
  degreeHeatingWeeks: number; // DHW value
  trend7d: number[]; // Last 7 days SST values
  trend30d: number[]; // Last 30 days SST values (if available)
  baseline: number; // Historical baseline SST
}

/**
 * Turbidity Data from NASA GIBS
 */
export interface TurbidityData {
  location: [number, number];
  timestamp: Date;
  turbidity: number; // Turbidity index (0-1 or normalized)
  chlorophyll: number; // Chlorophyll concentration (mg/m³)
  waterClarity: number; // Water clarity index (0-100)
  source: 'nasa_gibs' | 'open_meteo' | 'computed';
}

/**
 * Bleaching Risk Assessment
 */
export interface BleachingRisk {
  location: [number, number];
  timestamp: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  probability: number; // 0-1
  sst: number;
  sstAnomaly: number;
  degreeHeatingWeeks: number;
  hotspot: number;
  alertLevel: number; // 0-5 (NOAA alert level)
  daysToBleaching?: number;
  recommendedActions: string[];
  confidence: number; // 0-1
}

