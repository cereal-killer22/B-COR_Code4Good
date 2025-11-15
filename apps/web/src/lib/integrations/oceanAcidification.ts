/**
 * Ocean Acidification Data Integration
 * Fetches ocean acidification data from research centers
 */

import type { AcidificationMetrics } from '@climaguard/shared/types/ocean';
import { getAPIKeys, hasAPIKey } from '@/lib/config/apiKeys';

export interface AcidificationData {
  pH: number;
  pHAnomaly: number;
  aragoniteSaturation: number; // Ωarag
  co2Concentration: number; // ppm
  pco2: number; // Partial pressure of CO2
}

export class OceanAcidificationService {
  private apiKey: string;
  private baseUrl = 'https://oceanacidification.noaa.gov/api';
  private useMockData: boolean;
  
  constructor() {
    const keys = getAPIKeys();
    this.apiKey = keys.oceanAcidification;
    this.useMockData = !hasAPIKey('oceanAcidification');
    
    if (this.useMockData) {
      console.warn('⚠️ Ocean Acidification API key not configured - service unavailable');
    }
  }
  
  /**
   * Get acidification data for a location
   */
  async getAcidificationData(lat: number, lng: number): Promise<AcidificationData> {
    if (this.useMockData) {
      return this.getMockAcidificationData(lat, lng);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/acidification?lat=${lat}&lng=${lng}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClimaGuard/1.0'
          },
          next: { revalidate: 86400 } // Cache for 24 hours (acidification changes slowly)
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        pH: data.pH || 8.1,
        pHAnomaly: data.pHAnomaly || 0,
        aragoniteSaturation: data.arag || 3.5,
        co2Concentration: data.co2 || 420,
        pco2: data.pco2 || 400
      };
      
    } catch (error) {
      console.error('Error fetching acidification data:', error);
      return this.getMockAcidificationData(lat, lng);
    }
  }
  
  /**
   * Get comprehensive acidification metrics
   */
  async getAcidificationMetrics(lat: number, lng: number): Promise<AcidificationMetrics> {
    const data = await this.getAcidificationData(lat, lng);
    const baseline = 8.1; // Pre-industrial baseline pH
    
    // Calculate trend (simplified - would use historical data)
    const trend = data.pHAnomaly < -0.1 ? 'declining' : 
                  data.pHAnomaly > 0.1 ? 'improving' : 'stable';
    
    // Project future pH (simplified model)
    const projectedpH = {
      year2025: data.pH + data.pHAnomaly * 0.5,
      year2030: data.pH + data.pHAnomaly * 1.0,
      year2050: data.pH + data.pHAnomaly * 2.0
    };
    
    // Determine impact level
    let impactLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (data.pH < 7.6) impactLevel = 'critical';
    else if (data.pH < 7.8) impactLevel = 'high';
    else if (data.pH < 8.0) impactLevel = 'medium';
    
    return {
      location: [lat, lng],
      timestamp: new Date(),
      pH: data.pH,
      pHAnomaly: data.pHAnomaly,
      aragoniteSaturation: data.aragoniteSaturation,
      co2Concentration: data.co2Concentration,
      trend,
      projectedpH,
      impactLevel
    };
  }
  
  /**
   * Get historical pH trends
   */
  async getHistoricalTrend(
    lat: number,
    lng: number,
    years: number = 10
  ): Promise<Array<{ year: number; pH: number }>> {
    if (this.useMockData) {
      return this.getMockHistoricalTrend(years);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/historical?lat=${lat}&lng=${lng}&years=${years}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClimaGuard/1.0'
          },
          next: { revalidate: 86400 }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.trend || this.getMockHistoricalTrend(years);
      
    } catch (error) {
      console.error('Error fetching historical trend:', error);
      return this.getMockHistoricalTrend(years);
    }
  }
  
  /**
   * Mock data generators
   */
  private getMockAcidificationData(lat: number, lng: number): AcidificationData {
    // Simulate slight acidification trend
    const basePH = 8.1;
    const anomaly = -0.05 - Math.random() * 0.1; // Slight decline
    
    return {
      pH: basePH + anomaly,
      pHAnomaly: anomaly,
      aragoniteSaturation: 3.5 + anomaly * 2,
      co2Concentration: 420 + Math.random() * 10,
      pco2: 400 + Math.random() * 20
    };
  }
  
  private getMockHistoricalTrend(years: number): Array<{ year: number; pH: number }> {
    const currentYear = new Date().getFullYear();
    const trend: Array<{ year: number; pH: number }> = [];
    const basePH = 8.1;
    const declineRate = -0.02; // pH decline per year
    
    for (let i = years; i >= 0; i--) {
      const year = currentYear - i;
      const pH = basePH + (declineRate * i) + (Math.random() - 0.5) * 0.05;
      trend.push({ year, pH });
    }
    
    return trend;
  }
}

