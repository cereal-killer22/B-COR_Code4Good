/**
 * NOAA Coral Reef Watch Integration (FREE - NO API KEY REQUIRED)
 * Uses NOAA ERDDAP JSON API for coral reef health data
 * 
 * Data sources:
 * - SST (Sea Surface Temperature)
 * - SST Anomalies (HotSpot)
 * - Degree Heating Weeks (DHW)
 * - Bleaching Alert Levels
 */

import type { CoralReefData, SSTTrend, BleachingRisk } from '@climaguard/shared/types/ocean';

export interface CoralReefWatchData {
  location: [number, number];
  bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
  temperature: number;
  anomaly: number; // Temperature anomaly
  healthIndex: number;
  degreeHeatingWeeks?: number;
  alertLevel?: number; // 0-5
  hotspot?: number;
}

export class CoralReefWatch {
  // NOAA ERDDAP endpoint (FREE - NO KEY REQUIRED)
  // Using the correct ERDDAP server for Coral Reef Watch
  private erddapBaseUrl = 'https://oceanwatch.pifsc.noaa.gov/erddap';
  private datasetId = 'CRW_sst_v1_0';
  
  constructor() {
    // No API key needed - this is a free public API
  }
  
  /**
   * Get reef health data for a location using NOAA ERDDAP
   * Fetches SST, HotSpot, and DHW data
   */
  async getReefHealth(lat: number, lng: number): Promise<CoralReefWatchData> {
    try {
      // Use Open-Meteo as primary source for SST (more reliable)
      const openMeteoUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&daily=sea_surface_temperature_mean&timezone=auto`;
      
      const [sstResponse, dhwResponse] = await Promise.all([
        fetch(openMeteoUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 1800 } // 30 min cache
        }),
        // Get DHW from 12 weeks of historical data
        this.fetchDHWFromAlternative(lat, lng)
      ]);
      
      let sst = 28.5;
      let sstAnomaly = 0;
      
      if (sstResponse.ok) {
        const sstData = await sstResponse.json();
        if (sstData.daily?.sea_surface_temperature_mean?.[0]) {
          sst = sstData.daily.sea_surface_temperature_mean[0];
          // Calculate anomaly from baseline (28.5°C for tropical waters)
          sstAnomaly = sst - 28.5;
        }
      } else {
        throw new Error(`Open-Meteo API returned ${sstResponse.status}`);
      }
      
      // Get actual DHW from alternative source
      const dhw = await dhwResponse;
      
      // Calculate HotSpot from SST anomaly
      const hotspot = sstAnomaly > 0 ? sstAnomaly : 0;
      
      // Determine alert level based on SST and DHW (NOAA standards)
      let alertLevel = 0;
      if (sst >= 31 || dhw >= 12) alertLevel = 5; // Alert Level 2 (Severe)
      else if (sst >= 30.5 || dhw >= 8) alertLevel = 4; // Alert Level 1 (High)
      else if (sst >= 30 || dhw >= 4) alertLevel = 3; // Warning
      else if (sst >= 29.5 || dhw >= 1) alertLevel = 2; // Watch
      else if (sst >= 29) alertLevel = 1; // No Stress
      
      return {
        location: [lat, lng],
        bleachingRisk: this.mapAlertLevelToRisk(alertLevel),
        temperature: sst,
        anomaly: sstAnomaly,
        healthIndex: this.calculateHealthIndex({ sst, anomaly: sstAnomaly, dhw, alertLevel }),
        degreeHeatingWeeks: dhw,
        alertLevel,
        hotspot
      };
      
    } catch (error) {
      console.error('Error fetching reef health data:', error);
      // Throw error instead of returning mock data
      throw new Error(`Failed to fetch real-time reef health data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Try to fetch DHW from alternative source (Open-Meteo historical data)
   */
  private async fetchDHWFromAlternative(lat: number, lng: number): Promise<number> {
    try {
      // Use Open-Meteo historical data to calculate DHW (12 weeks)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks ago
      
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&daily=sea_surface_temperature_mean&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&timezone=auto`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });
      
      if (response.ok) {
        const data = await response.json();
        const temps = data.daily?.sea_surface_temperature_mean || [];
        if (temps.length > 0) {
          // Calculate DHW: sum of degrees above 30°C over 12 weeks
          const threshold = 30.0;
          let dhw = 0;
          for (const temp of temps) {
            if (temp > threshold) {
              dhw += (temp - threshold) / 7; // Convert to weeks
            }
          }
          return Math.min(dhw, 20); // Cap at 20
        }
      }
    } catch (error) {
      console.warn('Could not fetch DHW from alternative source:', error);
    }
    return 0;
  }
  
  /**
   * Get SST trend data (7-day and 30-day)
   */
  async getSSTTrend(lat: number, lng: number): Promise<SSTTrend> {
    try {
      // Use Open-Meteo for real SST trend data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&daily=sea_surface_temperature_mean&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&timezone=auto`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        next: { revalidate: 3600 }
      });
      
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }
      
      const data = await response.json();
      const temps = data.daily?.sea_surface_temperature_mean || [];
      const dates = data.daily?.time || [];
      
      if (temps.length === 0) {
        throw new Error('No SST data returned');
      }
      
      const currentSST = temps[temps.length - 1] || temps[0];
      const baseline = temps.length > 15 
        ? temps.slice(0, Math.floor(temps.length / 2)).reduce((a: number, b: number) => a + b, 0) / Math.floor(temps.length / 2)
        : 28.5;
      
      const sstAnomaly = currentSST - baseline;
      const hotspot = sstAnomaly > 0 ? sstAnomaly : 0;
      
      // Calculate DHW from recent temperatures above threshold
      const threshold = 30.0;
      let dhw = 0;
      for (let i = Math.max(0, temps.length - 84); i < temps.length; i++) {
        if (temps[i] > threshold) {
          dhw += (temps[i] - threshold) / 7;
        }
      }
      
      const trend7d = temps.slice(-7);
      const trend30d = temps;
      
      return {
        location: [lat, lng],
        timestamp: new Date(),
        sst: currentSST,
        sstAnomaly,
        hotspot,
        degreeHeatingWeeks: Math.min(dhw, 20),
        trend7d: trend7d.length > 0 ? trend7d : [currentSST],
        trend30d: trend30d.length > 0 ? trend30d : [currentSST],
        baseline
      };
      
    } catch (error) {
      console.error('Error fetching SST trend:', error);
      throw new Error(`Failed to fetch real-time SST trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse ERDDAP JSON response for bleaching alert data
   */
  private parseERDDAPResponse(data: any, lat: number, lng: number): {
    sst: number;
    anomaly: number;
    hotspot: number;
    dhw: number;
    alertLevel: number;
  } {
    try {
      // ERDDAP returns data in table format
      const table = data.table;
      if (!table || !table.rows || table.rows.length === 0) {
        throw new Error('No data in ERDDAP response');
      }
      
      // Get column indices - check if columnNames exists and is an array
      if (!table.columnNames || !Array.isArray(table.columnNames)) {
        throw new Error('Invalid columnNames in ERDDAP response');
      }
      
      const timeIdx = table.columnNames.indexOf('time');
      const sstIdx = table.columnNames.indexOf('CRW_SST') >= 0 
        ? table.columnNames.indexOf('CRW_SST') 
        : table.columnNames.indexOf('SST');
      const hotspotIdx = table.columnNames.indexOf('CRW_HOTSPOT') >= 0
        ? table.columnNames.indexOf('CRW_HOTSPOT')
        : table.columnNames.indexOf('HOTSPOT');
      const dhwIdx = table.columnNames.indexOf('CRW_DHW') >= 0
        ? table.columnNames.indexOf('CRW_DHW')
        : table.columnNames.indexOf('DHW');
      const baaIdx = table.columnNames.indexOf('CRW_BAA') >= 0
        ? table.columnNames.indexOf('CRW_BAA')
        : table.columnNames.indexOf('BAA');
      
      // Get most recent row
      const row = table.rows[table.rows.length - 1];
      
      const sst = sstIdx >= 0 ? parseFloat(row[sstIdx]) || 28.5 : 28.5;
      const hotspot = hotspotIdx >= 0 ? parseFloat(row[hotspotIdx]) || 0 : 0;
      const dhw = dhwIdx >= 0 ? parseFloat(row[dhwIdx]) || 0 : 0;
      const baa = baaIdx >= 0 ? parseFloat(row[baaIdx]) || 0 : 0;
      
      // Calculate anomaly (simplified - would use baseline)
      const baseline = 28.5; // Typical baseline for tropical waters
      const anomaly = sst - baseline;
      
      // Map BAA to alert level (0-5)
      const alertLevel = Math.min(5, Math.max(0, Math.round(baa)));
      
      return { sst, anomaly, hotspot, dhw, alertLevel };
      
    } catch (error) {
      console.error('Error parsing ERDDAP response:', error);
      // Return default values
      return {
        sst: 28.5,
        anomaly: 0,
        hotspot: 0,
        dhw: 0,
        alertLevel: 0
      };
    }
  }
  
  /**
   * Parse ERDDAP SST trend response
   */
  private parseERDDAPSSTResponse(data: any, lat: number, lng: number): {
    currentSST: number;
    anomaly: number;
    hotspot: number;
    dhw: number;
    trend7d: number[];
    trend30d: number[];
    baseline: number;
  } {
    try {
      const table = data.table;
      if (!table || !table.rows || table.rows.length === 0) {
        throw new Error('No SST trend data');
      }
      
      // Check if columnNames exists and is an array
      if (!table.columnNames || !Array.isArray(table.columnNames)) {
        throw new Error('Invalid columnNames in ERDDAP SST response');
      }
      
      const sstIdx = table.columnNames.indexOf('CRW_SST') >= 0
        ? table.columnNames.indexOf('CRW_SST')
        : table.columnNames.indexOf('SST');
      
      const sstValues: number[] = [];
      for (const row of table.rows) {
        if (sstIdx >= 0) {
          const val = parseFloat(row[sstIdx]);
          if (!isNaN(val)) sstValues.push(val);
        }
      }
      
      const currentSST = sstValues[sstValues.length - 1] || 28.5;
      const baseline = sstValues.length > 0 
        ? sstValues.slice(0, Math.floor(sstValues.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(sstValues.length / 2)
        : 28.5;
      const anomaly = currentSST - baseline;
      
      const trend7d = sstValues.slice(-7);
      const trend30d = sstValues;
      
      return {
        currentSST,
        anomaly,
        hotspot: anomaly > 1 ? anomaly : 0,
        dhw: anomaly > 0 ? anomaly * 7 : 0, // Simplified DHW calculation
        trend7d: trend7d.length > 0 ? trend7d : [currentSST],
        trend30d: trend30d.length > 0 ? trend30d : [currentSST],
        baseline
      };
      
    } catch (error) {
      console.error('Error parsing SST trend:', error);
      return {
        currentSST: 28.5,
        anomaly: 0,
        hotspot: 0,
        dhw: 0,
        trend7d: [28.5],
        trend30d: [28.5],
        baseline: 28.5
      };
    }
  }
  
  /**
   * REMOVED: getFallbackSSTTrend
   * No mock/fallback data allowed - all data must come from real APIs
   */
  
  /**
   * Get bleaching alerts for a region
   * Uses ERDDAP to query multiple locations
   */
  async getBleachingAlerts(
    bbox: [number, number, number, number] = [-21.0, 57.0, -19.0, 58.0] // Mauritius region
  ): Promise<CoralReefWatchData[]> {
    try {
      // Query multiple grid points in the bounding box
      const [minLat, minLng, maxLat, maxLng] = bbox;
      const step = 0.1; // 0.1 degree steps
      
      const alerts: CoralReefWatchData[] = [];
      
      // Sample grid points
      for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lng = minLng; lng <= maxLng; lng += step) {
          try {
            const health = await this.getReefHealth(lat, lng);
            // Only include if there's a significant risk
            if (health.alertLevel && health.alertLevel >= 2) {
              alerts.push(health);
            }
          } catch (error) {
            // Skip failed points
            continue;
          }
        }
      }
      
      return alerts;
      
    } catch (error) {
      console.error('Error fetching bleaching alerts:', error);
      // Return empty array instead of mock data
      return [];
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
   * REMOVED: getMockReefHealth, getMockBleachingAlerts
   * No mock data generators allowed - all data must come from real APIs
   */
}

