/**
 * Flood Risk Integration - Open-Meteo API
 * Uses precipitation and soil moisture data to assess flood risk
 */

export interface FloodRiskData {
  location: [number, number];
  timestamp: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0-100
  precipitation: number; // mm (current)
  precipitation24h: number; // mm (last 24 hours)
  soilMoisture: number; // 0-1 scale
  alerts: FloodAlert[];
}

export interface FloodAlert {
  level: 'low' | 'moderate' | 'high' | 'severe';
  message: string;
  area: string;
}

export class FloodRiskService {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Get flood risk assessment for a location
   */
  async getFloodRisk(lat: number, lng: number): Promise<FloodRiskData> {
    try {
      // Open-Meteo requires multiple query params for daily/hourly variables (not comma-separated)
      const url = new URL(this.baseUrl);
      url.searchParams.set('latitude', lat.toString());
      url.searchParams.set('longitude', lng.toString());
      url.searchParams.set('forecast_days', '3');
      url.searchParams.set('timezone', 'auto');
      
      // Add hourly parameters separately (multi-value)
      url.searchParams.append('hourly', 'precipitation');
      url.searchParams.append('hourly', 'soil_moisture_0_to_10cm');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        next: { revalidate: 1800 } // Cache for 30 minutes
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const hourly = data.hourly;

      // Calculate 24-hour precipitation sum
      const precipitation24h = (hourly.precipitation || [])
        .slice(0, 24)
        .reduce((sum: number, val: number) => sum + (val || 0), 0);

      const currentPrecipitation = hourly.precipitation?.[0] || 0;
      const soilMoisture = hourly.soil_moisture_0_to_10cm?.[0] || 0.5;

      // Calculate flood risk score (0-100)
      const riskScore = this.calculateRiskScore(currentPrecipitation, precipitation24h, soilMoisture);
      const riskLevel = this.mapRiskLevel(riskScore);

      // Generate alerts based on risk
      const alerts = this.generateAlerts(riskLevel, precipitation24h, soilMoisture);

      return {
        location: [lat, lng],
        timestamp: new Date(),
        riskLevel,
        riskScore,
        precipitation: currentPrecipitation,
        precipitation24h,
        soilMoisture,
        alerts
      };

    } catch (error) {
      console.error('Error fetching flood risk data:', error);
      throw new Error(`Failed to fetch flood risk data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate flood risk score from precipitation and soil moisture
   */
  private calculateRiskScore(
    currentPrecip: number,
    precip24h: number,
    soilMoisture: number
  ): number {
    // Risk factors:
    // 1. Current precipitation intensity (0-50 points)
    // 2. 24-hour accumulation (0-30 points)
    // 3. Soil saturation (0-20 points)

    let score = 0;

    // Current precipitation intensity
    if (currentPrecip > 50) score += 50; // Very heavy rain
    else if (currentPrecip > 25) score += 35;
    else if (currentPrecip > 10) score += 20;
    else if (currentPrecip > 5) score += 10;

    // 24-hour accumulation
    if (precip24h > 100) score += 30; // Extreme rainfall
    else if (precip24h > 50) score += 25;
    else if (precip24h > 25) score += 15;
    else if (precip24h > 10) score += 8;

    // Soil moisture (higher = more saturated = higher risk)
    if (soilMoisture > 0.8) score += 20; // Saturated
    else if (soilMoisture > 0.6) score += 12;
    else if (soilMoisture > 0.4) score += 6;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map risk score to risk level
   */
  private mapRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'severe' {
    if (score >= 70) return 'severe';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Generate flood alerts based on risk assessment
   */
  private generateAlerts(
    riskLevel: 'low' | 'moderate' | 'high' | 'severe',
    precip24h: number,
    soilMoisture: number
  ): FloodAlert[] {
    const alerts: FloodAlert[] = [];

    if (riskLevel === 'severe') {
      alerts.push({
        level: 'severe',
        message: `Extreme flood risk: ${precip24h.toFixed(1)}mm rainfall in 24h with saturated soil`,
        area: 'All regions'
      });
    } else if (riskLevel === 'high') {
      alerts.push({
        level: 'high',
        message: `High flood risk: ${precip24h.toFixed(1)}mm rainfall in 24h`,
        area: 'Low-lying areas'
      });
    } else if (riskLevel === 'moderate' && precip24h > 25) {
      alerts.push({
        level: 'moderate',
        message: `Moderate flood risk: ${precip24h.toFixed(1)}mm rainfall in 24h`,
        area: 'Drainage systems'
      });
    }

    if (soilMoisture > 0.8) {
      alerts.push({
        level: riskLevel === 'severe' ? 'severe' : 'high',
        message: 'Soil saturation levels critical - reduced water absorption capacity',
        area: 'Agricultural and low-lying zones'
      });
    }

    return alerts;
  }
}

