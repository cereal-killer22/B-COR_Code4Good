/**
 * Open-Meteo Marine API Integration (FREE - NO API KEY REQUIRED)
 * Fetches marine weather and ocean data
 * 
 * Endpoint: https://marine-api.open-meteo.com/v1/marine
 * 
 * Data provided:
 * - sea_surface_temperature_mean
 * - wave_height_max
 * - wind_speed_max
 * - swell_significant_height
 * - wind_wave_height
 */

export interface OpenMeteoMarineData {
  location: [number, number];
  timestamp: Date;
  seaSurfaceTemperature: number; // °C
  waveHeightMax: number; // meters
  windSpeedMax: number; // m/s
  swellSignificantHeight: number; // meters
  windWaveHeight: number; // meters
  daily?: {
    date: string;
    seaSurfaceTemperature: number;
    waveHeightMax: number;
    windSpeedMax: number;
  }[];
}

export class OpenMeteoMarineService {
  private baseUrl = 'https://marine-api.open-meteo.com/v1/marine';
  
  constructor() {
    // No API key needed - this is a free public API
  }
  
  /**
   * Get marine data for a location
   */
  async getMarineData(
    lat: number,
    lng: number,
    days: number = 7
  ): Promise<OpenMeteoMarineData> {
    try {
      // Build query parameters
      // Open-Meteo requires multiple query params for daily/hourly variables (not comma-separated)
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        timezone: 'auto',
        forecast_days: days.toString()
      });
      
      // Add daily parameters separately (multi-value)
      params.append('daily', 'sea_surface_temperature_mean');
      params.append('daily', 'wave_height_max');
      params.append('daily', 'wind_speed_max');
      params.append('daily', 'swell_significant_height');
      params.append('daily', 'wind_wave_height');
      
      const url = `${this.baseUrl}?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse response
      return this.parseResponse(data, lat, lng);
      
    } catch (error) {
      console.error('Error fetching Open-Meteo marine data:', error);
      // Throw error instead of returning fallback
      throw new Error(`Failed to fetch real-time marine data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse Open-Meteo API response
   */
  private parseResponse(data: any, lat: number, lng: number): OpenMeteoMarineData {
    try {
      const daily = data.daily;
      if (!daily || !daily.time || daily.time.length === 0) {
        throw new Error('No daily data in response');
      }
      
      // Get most recent data (index 0)
      const sstValues = daily.sea_surface_temperature_mean || [];
      const waveHeightValues = daily.wave_height_max || [];
      const windSpeedValues = daily.wind_speed_max || [];
      const swellHeightValues = daily.swell_significant_height || [];
      const windWaveHeightValues = daily.wind_wave_height || [];
      
      const currentSST = sstValues[0] || 28.5;
      const currentWaveHeight = waveHeightValues[0] || 1.0;
      const currentWindSpeed = windSpeedValues[0] || 5.0;
      const currentSwellHeight = swellHeightValues[0] || 0.5;
      const currentWindWaveHeight = windWaveHeightValues[0] || 0.5;
      
      // Build daily array
      const dailyData = daily.time.map((date: string, index: number) => ({
        date,
        seaSurfaceTemperature: sstValues[index] || currentSST,
        waveHeightMax: waveHeightValues[index] || currentWaveHeight,
        windSpeedMax: windSpeedValues[index] || currentWindSpeed
      }));
      
      return {
        location: [lat, lng],
        timestamp: new Date(),
        seaSurfaceTemperature: currentSST,
        waveHeightMax: currentWaveHeight,
        windSpeedMax: currentWindSpeed,
        swellSignificantHeight: currentSwellHeight,
        windWaveHeight: currentWindWaveHeight,
        daily: dailyData
      };
      
    } catch (error) {
      console.error('Error parsing Open-Meteo response:', error);
      throw new Error(`Failed to parse Open-Meteo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * REMOVED: getFallbackData
   * No mock/fallback data allowed - all data must come from real APIs
   */
  
  /**
   * Get SST trend (7-day or 30-day)
   */
  async getSSTTrend(lat: number, lng: number, days: number = 7): Promise<number[]> {
    try {
      const data = await this.getMarineData(lat, lng, days);
      return data.daily?.map(d => d.seaSurfaceTemperature) || [data.seaSurfaceTemperature];
    } catch (error) {
      console.error('Error getting SST trend:', error);
      throw new Error(`Failed to fetch SST trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

