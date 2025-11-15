/**
 * Real-Time Prediction Functions
 * Deterministic heuristics using real API data
 */

export interface PredictionResult {
  probability: number; // 0-1
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  explanation: string;
}

export interface OceanHealthResult {
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  explanation: string;
}

/**
 * Calculate cyclone risk from pressure and wind observations
 * Uses deterministic heuristics based on meteorological thresholds
 */
export function cycloneRiskFromObservations(
  minPressure: number, // hPa (minimum pressure in last 24h)
  maxWindSpeed: number // km/h (maximum wind speed in last 24h)
): PredictionResult {
  let riskScore = 0;
  const factors: string[] = [];

  // Pressure analysis (lower pressure = higher risk)
  if (minPressure < 980) {
    riskScore += 50;
    factors.push('extremely low pressure');
  } else if (minPressure < 990) {
    riskScore += 35;
    factors.push('very low pressure');
  } else if (minPressure < 1000) {
    riskScore += 20;
    factors.push('low pressure');
  } else if (minPressure < 1010) {
    riskScore += 10;
    factors.push('slightly low pressure');
  }

  // Wind speed analysis (higher wind = higher risk)
  if (maxWindSpeed > 120) {
    riskScore += 50;
    factors.push('hurricane-force winds');
  } else if (maxWindSpeed > 90) {
    riskScore += 35;
    factors.push('storm-force winds');
  } else if (maxWindSpeed > 60) {
    riskScore += 20;
    factors.push('strong winds');
  } else if (maxWindSpeed > 40) {
    riskScore += 10;
    factors.push('moderate winds');
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  let probability: number;

  if (riskScore >= 80) {
    riskLevel = 'severe';
    probability = 0.85 + (riskScore - 80) / 20 * 0.15; // 0.85-1.0
  } else if (riskScore >= 60) {
    riskLevel = 'high';
    probability = 0.65 + (riskScore - 60) / 20 * 0.20; // 0.65-0.85
  } else if (riskScore >= 30) {
    riskLevel = 'moderate';
    probability = 0.35 + (riskScore - 30) / 30 * 0.30; // 0.35-0.65
  } else {
    riskLevel = 'low';
    probability = riskScore / 30 * 0.35; // 0-0.35
  }

  probability = Math.min(1.0, Math.max(0.0, probability));

  const explanation = factors.length > 0
    ? `Cyclone risk based on: ${factors.join(', ')}. Pressure: ${minPressure.toFixed(1)} hPa, Wind: ${maxWindSpeed.toFixed(1)} km/h`
    : `Normal conditions. Pressure: ${minPressure.toFixed(1)} hPa, Wind: ${maxWindSpeed.toFixed(1)} km/h`;

  return {
    probability,
    riskLevel,
    explanation
  };
}

/**
 * Calculate flood risk from precipitation data
 * Uses 24h and 72h rainfall accumulation
 */
export function floodRiskFromPrecip(
  precip24h: number, // mm (last 24 hours)
  precip72h: number, // mm (last 72 hours)
  soilMoisture?: number // 0-1 (optional)
): PredictionResult {
  let riskScore = 0;
  const factors: string[] = [];

  // 24-hour precipitation analysis
  if (precip24h > 100) {
    riskScore += 50;
    factors.push('extreme 24h rainfall');
  } else if (precip24h > 50) {
    riskScore += 35;
    factors.push('very heavy 24h rainfall');
  } else if (precip24h > 25) {
    riskScore += 20;
    factors.push('heavy 24h rainfall');
  } else if (precip24h > 10) {
    riskScore += 10;
    factors.push('moderate 24h rainfall');
  }

  // 72-hour accumulation analysis
  if (precip72h > 200) {
    riskScore += 30;
    factors.push('extreme 72h accumulation');
  } else if (precip72h > 100) {
    riskScore += 20;
    factors.push('very high 72h accumulation');
  } else if (precip72h > 50) {
    riskScore += 10;
    factors.push('high 72h accumulation');
  }

  // Soil moisture factor (if available)
  if (soilMoisture !== undefined) {
    if (soilMoisture > 0.8) {
      riskScore += 20;
      factors.push('saturated soil');
    } else if (soilMoisture > 0.6) {
      riskScore += 10;
      factors.push('high soil moisture');
    }
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  let probability: number;

  if (riskScore >= 80) {
    riskLevel = 'severe';
    probability = 0.85 + (riskScore - 80) / 20 * 0.15; // 0.85-1.0
  } else if (riskScore >= 60) {
    riskLevel = 'high';
    probability = 0.65 + (riskScore - 60) / 20 * 0.20; // 0.65-0.85
  } else if (riskScore >= 30) {
    riskLevel = 'moderate';
    probability = 0.35 + (riskScore - 30) / 30 * 0.30; // 0.35-0.65
  } else {
    riskLevel = 'low';
    probability = riskScore / 30 * 0.35; // 0-0.35
  }

  probability = Math.min(1.0, Math.max(0.0, probability));

  const explanation = factors.length > 0
    ? `Flood risk based on: ${factors.join(', ')}. 24h: ${precip24h.toFixed(1)}mm, 72h: ${precip72h.toFixed(1)}mm`
    : `Low flood risk. 24h: ${precip24h.toFixed(1)}mm, 72h: ${precip72h.toFixed(1)}mm`;

  return {
    probability,
    riskLevel,
    explanation
  };
}

/**
 * Calculate ocean health score from NOAA Coral Reef Watch data
 * Uses SST, HotSpot, and DHW (Degree Heating Weeks)
 */
export function oceanHealthScoreFromNOAA(
  sst: number, // Sea Surface Temperature (°C)
  hotspot: number, // HotSpot value (temperature anomaly)
  dhw: number // Degree Heating Weeks
): OceanHealthResult {
  let score = 100; // Start with perfect health
  const factors: string[] = [];

  // SST analysis (optimal range: 26-29°C for tropical reefs)
  if (sst > 31) {
    score -= 40;
    factors.push('extreme temperature');
  } else if (sst > 30) {
    score -= 30;
    factors.push('very high temperature');
  } else if (sst > 29) {
    score -= 15;
    factors.push('elevated temperature');
  } else if (sst < 24) {
    score -= 20;
    factors.push('low temperature');
  }

  // HotSpot analysis (positive = above threshold)
  if (hotspot > 2) {
    score -= 30;
    factors.push('severe hotspot');
  } else if (hotspot > 1) {
    score -= 20;
    factors.push('high hotspot');
  } else if (hotspot > 0.5) {
    score -= 10;
    factors.push('moderate hotspot');
  }

  // DHW analysis (Degree Heating Weeks)
  if (dhw > 12) {
    score -= 30;
    factors.push('extreme heat stress');
  } else if (dhw > 8) {
    score -= 25;
    factors.push('severe heat stress');
  } else if (dhw > 4) {
    score -= 15;
    factors.push('moderate heat stress');
  } else if (dhw > 0) {
    score -= 5;
    factors.push('mild heat stress');
  }

  // Ensure score stays in valid range
  score = Math.max(0, Math.min(100, score));

  // Determine risk level from score
  let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  if (score < 40) {
    riskLevel = 'severe';
  } else if (score < 60) {
    riskLevel = 'high';
  } else if (score < 80) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  const explanation = factors.length > 0
    ? `Ocean health: ${factors.join(', ')}. SST: ${sst.toFixed(1)}°C, HotSpot: ${hotspot.toFixed(1)}, DHW: ${dhw.toFixed(1)}`
    : `Good ocean health. SST: ${sst.toFixed(1)}°C, HotSpot: ${hotspot.toFixed(1)}, DHW: ${dhw.toFixed(1)}`;

  return {
    score,
    riskLevel,
    explanation
  };
}

