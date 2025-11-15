/**
 * NOAA Coral Reef Watch Integration
 * Fetches coral reef health data from NOAA Coral Reef Watch
 */

import type { CoralReefData } from '@climaguard/shared/types/ocean';

export interface CoralReefWatchData {
  location: [number, number];
  bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
  temperature: number;
  anomaly: number; // Temperature anomaly
  healthIndex: number;
  degreeHeatingWeeks?: number;
  alertLevel?: number; // 0-5
}

export class CoralReefWatch {
  private baseUrl = 'https://coralreefwatch.noaa.gov/api';
  private useMockData: boolean;
  
  constructor() {
    const apiKey = process.env.NOAA_CORAL_REEF_API_KEY || '';
    this.useMockData = !apiKey || apiKey.length < 10;
    
    if (this.useMockData) {
      console.warn('⚠️ NOAA Coral Reef Watch API key not configured - using mock data');
    }
  }
  
  /**
   * Get reef health data for a location
   */
  async getReefHealth(lat: number, lng: number): Promise<CoralReefWatchData> {
    if (this.useMockData) {
      return this.getMockReefHealth(lat, lng);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/reef-health?lat=${lat}&lng=${lng}`,
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
      
      return {
        location: [lat, lng],
        bleachingRisk: this.mapAlertLevelToRisk(data.alertLevel || 0),
        temperature: data.temperature || 28.5,
        anomaly: data.anomaly || 0,
        healthIndex: this.calculateHealthIndex(data),
        degreeHeatingWeeks: data.degreeHeatingWeeks,
        alertLevel: data.alertLevel
      };
      
    } catch (error) {
      console.error('Error fetching Coral Reef Watch data:', error);
      return this.getMockReefHealth(lat, lng);
    }
  }
  
  /**
   * Get bleaching alerts for a region
   */
  async getBleachingAlerts(
    region: string = 'southwest-indian-ocean'
  ): Promise<CoralReefWatchData[]> {
    if (this.useMockData) {
      return this.getMockBleachingAlerts(region);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/bleaching-alerts?region=${region}`,
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
      return (data.alerts || []).map((alert: any) => ({
        location: [alert.lat, alert.lng],
        bleachingRisk: this.mapAlertLevelToRisk(alert.alertLevel || 0),
        temperature: alert.temperature || 28.5,
        anomaly: alert.anomaly || 0,
        healthIndex: this.calculateHealthIndex(alert),
        degreeHeatingWeeks: alert.degreeHeatingWeeks,
        alertLevel: alert.alertLevel
      }));
      
    } catch (error) {
      console.error('Error fetching bleaching alerts:', error);
      return this.getMockBleachingAlerts(region);
    }
  }
  
  /**
   * Convert alert level to risk category
   */
  private mapAlertLevelToRisk(alertLevel: number): 'low' | 'medium' | 'high' | 'severe' {
    if (alertLevel >= 4) return 'severe';
    if (alertLevel >= 3) return 'high';
    if (alertLevel >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Calculate health index from reef data
   */
  private calculateHealthIndex(data: any): number {
    // Base health index calculation
    let index = 80; // Start with good baseline
    
    // Reduce based on temperature anomaly
    if (data.anomaly) {
      index -= Math.min(30, Math.abs(data.anomaly) * 10);
    }
    
    // Reduce based on degree heating weeks
    if (data.degreeHeatingWeeks) {
      index -= Math.min(20, data.degreeHeatingWeeks * 2);
    }
    
    // Reduce based on alert level
    if (data.alertLevel) {
      index -= data.alertLevel * 5;
    }
    
    return Math.max(0, Math.min(100, index));
  }
  
  /**
   * Mock data generators
   */
  private getMockReefHealth(lat: number, lng: number): CoralReefWatchData {
    const baseTemp = 28.5;
    const temp = baseTemp + (Math.random() - 0.5) * 2;
    const anomaly = temp - baseTemp;
    
    let risk: 'low' | 'medium' | 'high' | 'severe' = 'low';
    if (temp > 31) risk = 'severe';
    else if (temp > 30) risk = 'high';
    else if (temp > 29) risk = 'medium';
    
    return {
      location: [lat, lng],
      bleachingRisk: risk,
      temperature: temp,
      anomaly,
      healthIndex: 75 + Math.random() * 20,
      degreeHeatingWeeks: temp > 30 ? (temp - 30) * 2 : 0,
      alertLevel: temp > 31 ? 4 : temp > 30 ? 3 : temp > 29 ? 2 : 1
    };
  }
  
  private getMockBleachingAlerts(region: string): CoralReefWatchData[] {
    // Generate a few mock alerts
    const alerts: CoralReefWatchData[] = [];
    
    // Mauritius region coordinates
    const locations: [number, number][] = [
      [-20.0, 57.5], // Port Louis
      [-20.2, 57.7], // Grand Baie
      [-20.4, 57.6], // Flic en Flac
    ];
    
    for (const loc of locations) {
      if (Math.random() > 0.5) { // 50% chance of alert
        alerts.push(this.getMockReefHealth(loc[0], loc[1]));
      }
    }
    
    return alerts;
  }
}

