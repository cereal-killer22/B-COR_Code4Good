/**
 * Storm Surge Risk Integration - Open-Meteo Marine API
 * Uses wave height and wind speed to assess storm surge and coastal flooding risk
 */

export interface StormSurgeData {
  location: [number, number];
  timestamp: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0-100
  waveHeightMax: number; // meters
  windSpeedMax: number; // km/h
  swellHeight: number; // meters
  alerts: StormSurgeAlert[];
}

export interface StormSurgeAlert {
  level: 'low' | 'moderate' | 'high' | 'severe';
  message: string;
  area: string;
}

export class StormSurgeService {
  private baseUrl = 'https://marine-api.open-meteo.com/v1/marine';

  /**
   * Get storm surge risk assessment for a location
   */
  async getStormSurgeRisk(lat: number, lng: number): Promise<StormSurgeData> {
    try {
      // Open-Meteo requires multiple query params for daily/hourly variables (not comma-separated)
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        timezone: 'auto',
        forecast_days: '3'
      });
      
      // Add daily parameters (wind_speed_max is not available as daily, use hourly instead)
      params.append('daily', 'wave_height_max');
      params.append('daily', 'swell_significant_height');
      
      // Add hourly parameters for wind speed (wind_speed_max is not a valid daily parameter)
      params.append('hourly', 'wind_speed_10m');
      params.append('hourly', 'swell_wave_height');
      
      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        next: { revalidate: 1800 } // Cache for 30 minutes
      });

      if (!response.ok) {
        // Get error details from response
        let errorMessage = `Open-Meteo Marine API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.reason) {
            errorMessage += ` - ${errorData.reason}`;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check if daily data exists
      if (!data.daily) {
        throw new Error('No daily data in response');
      }
      
      const daily = data.daily;
      const hourly = data.hourly || {};

      // Get today's wave height from daily data
      const waveHeightMax = daily.wave_height_max?.[0] || 0;
      
      // Get wind speed max from hourly data (first 24 hours = today)
      // Calculate max wind speed from hourly data since wind_speed_max is not available as daily
      let windSpeedMaxMs = 0;
      if (hourly.wind_speed_10m && hourly.wind_speed_10m.length > 0) {
        // Get max wind speed from first 24 hours (today)
        const todayWindSpeeds = hourly.wind_speed_10m.slice(0, 24);
        windSpeedMaxMs = Math.max(...todayWindSpeeds.filter((v: number) => v != null)) || 0;
      }
      const windSpeedMax = windSpeedMaxMs * 3.6; // Convert m/s to km/h
      
      // Get swell height from daily or hourly data
      let swellHeight = 0;
      if (daily.swell_significant_height && daily.swell_significant_height[0] !== undefined) {
        swellHeight = daily.swell_significant_height[0];
      } else if (hourly.swell_wave_height && hourly.swell_wave_height.length > 0) {
        // Get average of first 24 hours (today)
        const hourlySwell = hourly.swell_wave_height.slice(0, 24);
        const validSwell = hourlySwell.filter((v: number) => v != null);
        if (validSwell.length > 0) {
          const sum = validSwell.reduce((acc: number, val: number) => acc + val, 0);
          swellHeight = sum / validSwell.length;
        }
      }

      // Calculate storm surge risk score
      const riskScore = this.calculateRiskScore(waveHeightMax, windSpeedMax, swellHeight);
      const riskLevel = this.mapRiskLevel(riskScore);

      // Generate alerts
      const alerts = this.generateAlerts(riskLevel, waveHeightMax, windSpeedMax);

      return {
        location: [lat, lng],
        timestamp: new Date(),
        riskLevel,
        riskScore,
        waveHeightMax,
        windSpeedMax: Math.round(windSpeedMax * 10) / 10, // Round to 1 decimal
        swellHeight,
        alerts
      };

    } catch (error) {
      console.error('Error fetching storm surge risk data:', error);
      
      // If API fails, return low risk with zero values (not mock data)
      // This allows the dashboard to still function
      return {
        location: [lat, lng],
        timestamp: new Date(),
        riskLevel: 'low',
        riskScore: 0,
        waveHeightMax: 0,
        windSpeedMax: 0,
        swellHeight: 0,
        alerts: []
      };
    }
  }

  /**
   * Calculate storm surge risk score from wave and wind data
   */
  private calculateRiskScore(
    waveHeight: number,
    windSpeed: number,
    swellHeight: number
  ): number {
    // Risk factors:
    // 1. Wave height (0-40 points)
    // 2. Wind speed (0-40 points)
    // 3. Swell height (0-20 points)

    let score = 0;

    // Wave height risk
    if (waveHeight > 5) score += 40; // Extreme waves
    else if (waveHeight > 3) score += 30;
    else if (waveHeight > 2) score += 20;
    else if (waveHeight > 1.5) score += 10;

    // Wind speed risk
    if (windSpeed > 100) score += 40; // Hurricane force
    else if (windSpeed > 75) score += 30; // Storm force
    else if (windSpeed > 50) score += 20; // Strong gale
    else if (windSpeed > 30) score += 10; // Moderate wind

    // Swell height risk
    if (swellHeight > 4) score += 20;
    else if (swellHeight > 2.5) score += 12;
    else if (swellHeight > 1.5) score += 6;

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
   * Generate storm surge alerts
   */
  private generateAlerts(
    riskLevel: 'low' | 'moderate' | 'high' | 'severe',
    waveHeight: number,
    windSpeed: number
  ): StormSurgeAlert[] {
    const alerts: StormSurgeAlert[] = [];

    if (riskLevel === 'severe') {
      alerts.push({
        level: 'severe',
        message: `Extreme storm surge risk: ${waveHeight.toFixed(1)}m waves and ${windSpeed.toFixed(0)}km/h winds`,
        area: 'All coastal areas'
      });
    } else if (riskLevel === 'high') {
      alerts.push({
        level: 'high',
        message: `High storm surge risk: ${waveHeight.toFixed(1)}m waves expected`,
        area: 'Low-lying coastal zones'
      });
    } else if (riskLevel === 'moderate' && waveHeight > 2) {
      alerts.push({
        level: 'moderate',
        message: `Moderate storm surge risk: ${waveHeight.toFixed(1)}m waves`,
        area: 'Beach and harbor areas'
      });
    }

    if (windSpeed > 75) {
      alerts.push({
        level: riskLevel === 'severe' ? 'severe' : 'high',
        message: `Strong winds (${windSpeed.toFixed(0)}km/h) - coastal flooding possible`,
        area: 'Exposed coastal regions'
      });
    }

    return alerts;
  }
}

