/**
 * Copernicus Marine Service Integration
 * Fetches ocean data from Copernicus Marine Service API
 */

export interface CopernicusMarineData {
  temperature: number; // Sea surface temperature
  salinity: number;
  pH?: number;
  dissolvedOxygen?: number;
  turbidity?: number;
  currents?: {
    u: number; // Eastward velocity
    v: number; // Northward velocity
  };
}

export class CopernicusMarineService {
  private apiKey: string;
  private baseUrl = 'https://marine.copernicus.eu/api';
  private useMockData: boolean;
  
  constructor() {
    this.apiKey = process.env.COPERNICUS_MARINE_API_KEY || '';
    this.useMockData = !this.apiKey || this.apiKey.length < 10;
    
    if (this.useMockData) {
      console.warn('⚠️ Copernicus Marine API key not configured - using mock data');
    }
  }
  
  /**
   * Get ocean temperature for a location
   */
  async getOceanTemperature(lat: number, lng: number): Promise<number> {
    if (this.useMockData) {
      return this.getMockTemperature(lat, lng);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/temperature?lat=${lat}&lng=${lng}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClimaGuard/1.0'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.temperature || this.getMockTemperature(lat, lng);
      
    } catch (error) {
      console.error('Error fetching Copernicus temperature:', error);
      return this.getMockTemperature(lat, lng);
    }
  }
  
  /**
   * Get water quality parameters
   */
  async getWaterQuality(lat: number, lng: number): Promise<{
    pH: number;
    salinity: number;
    dissolvedOxygen: number;
    turbidity: number;
  }> {
    if (this.useMockData) {
      return this.getMockWaterQuality(lat, lng);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/water-quality?lat=${lat}&lng=${lng}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClimaGuard/1.0'
          },
          next: { revalidate: 3600 }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        pH: data.pH || 8.1,
        salinity: data.salinity || 35.2,
        dissolvedOxygen: data.dissolvedOxygen || 6.5,
        turbidity: data.turbidity || 0.3
      };
      
    } catch (error) {
      console.error('Error fetching Copernicus water quality:', error);
      return this.getMockWaterQuality(lat, lng);
    }
  }
  
  /**
   * Get comprehensive marine data
   */
  async getMarineData(lat: number, lng: number): Promise<CopernicusMarineData> {
    if (this.useMockData) {
      return this.getMockMarineData(lat, lng);
    }
    
    try {
      const [temperature, waterQuality] = await Promise.all([
        this.getOceanTemperature(lat, lng),
        this.getWaterQuality(lat, lng)
      ]);
      
      return {
        temperature,
        salinity: waterQuality.salinity,
        pH: waterQuality.pH,
        dissolvedOxygen: waterQuality.dissolvedOxygen,
        turbidity: waterQuality.turbidity
      };
      
    } catch (error) {
      console.error('Error fetching Copernicus marine data:', error);
      return this.getMockMarineData(lat, lng);
    }
  }
  
  /**
   * Mock data generators (fallback)
   */
  private getMockTemperature(lat: number, lng: number): number {
    // Base temperature for Mauritius region
    const baseTemp = 28.5;
    const seasonalVariation = Math.sin(Date.now() / (365.25 * 24 * 60 * 60 * 1000) * 2 * Math.PI) * 2;
    return baseTemp + seasonalVariation + (Math.random() - 0.5) * 1;
  }
  
  private getMockWaterQuality(lat: number, lng: number): {
    pH: number;
    salinity: number;
    dissolvedOxygen: number;
    turbidity: number;
  } {
    return {
      pH: 8.1 + (Math.random() - 0.5) * 0.2,
      salinity: 35.2 + (Math.random() - 0.5) * 1,
      dissolvedOxygen: 6.5 + (Math.random() - 0.5) * 1,
      turbidity: 0.3 + Math.random() * 0.2
    };
  }
  
  private getMockMarineData(lat: number, lng: number): CopernicusMarineData {
    const temp = this.getMockTemperature(lat, lng);
    const quality = this.getMockWaterQuality(lat, lng);
    
    return {
      temperature: temp,
      salinity: quality.salinity,
      pH: quality.pH,
      dissolvedOxygen: quality.dissolvedOxygen,
      turbidity: quality.turbidity
    };
  }
}

