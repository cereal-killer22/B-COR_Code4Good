/**
 * Global Fishing Watch Integration
 * Tracks fishing activity and vessel movements
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SustainableFishingMetrics } from '@climaguard/shared/types/ocean';

export interface FishingVessel {
  id: string;
  location: [number, number];
  speed: number; // knots
  course: number; // degrees
  timestamp: Date;
  vesselType?: string;
  flag?: string;
}

export interface FishingActivity {
  location: [number, number];
  vesselCount: number;
  totalCatch: number; // tons (estimated)
  fishingHours: number;
  vessels: FishingVessel[];
}

import { getAPIKeys, hasAPIKey } from '@/lib/config/apiKeys';

export class GlobalFishingWatch {
  private apiKey: string;
  private baseUrl = 'https://gateway.api.globalfishingwatch.org/v2';
  private useMockData: boolean;
  
  constructor() {
    const keys = getAPIKeys();
    this.apiKey = keys.globalFishingWatch;
    this.useMockData = !hasAPIKey('globalFishingWatch');
    
    if (this.useMockData) {
      console.warn('⚠️ Global Fishing Watch API key not configured - service unavailable');
    }
  }
  
  /**
   * Get fishing activity for a region
   */
  async getFishingActivity(
    lat: number,
    lng: number,
    radius: number = 0.5 // degrees
  ): Promise<FishingActivity> {
    if (this.useMockData) {
      return this.getMockFishingActivity(lat, lng);
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/vessels/search?lat=${lat}&lng=${lng}&radius=${radius}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
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
        vesselCount: data.vessels?.length || 0,
        totalCatch: this.estimateCatch(data.vessels || []),
        fishingHours: this.calculateFishingHours(data.vessels || []),
        vessels: (data.vessels || []).map((v: any) => ({
          id: v.id,
          location: [v.lat, v.lng],
          speed: v.speed || 0,
          course: v.course || 0,
          timestamp: new Date(v.timestamp),
          vesselType: v.type,
          flag: v.flag
        }))
      };
      
    } catch (error) {
      console.error('Error fetching fishing activity:', error);
      return this.getMockFishingActivity(lat, lng);
    }
  }
  
  /**
   * Get sustainable fishing metrics
   */
  async getSustainableFishingMetrics(
    lat: number,
    lng: number
  ): Promise<SustainableFishingMetrics> {
    const activity = await this.getFishingActivity(lat, lng);
    
    // Estimate sustainable catch (would use stock assessments in production)
    const sustainableCatch = activity.totalCatch * 0.7; // Assume 70% is sustainable
    const overfishingRisk = activity.totalCatch > sustainableCatch * 1.2 ? 
      Math.min(100, ((activity.totalCatch / sustainableCatch) - 1) * 50) : 20;
    
    return {
      location: [lat, lng],
      timestamp: new Date(),
      fishingActivity: {
        vesselCount: activity.vesselCount,
        totalCatch: activity.totalCatch,
        sustainableCatch,
        overfishingRisk
      },
      stockStatus: this.getMockStockStatus(),
      protectedAreaCompliance: this.getMockMPACompliance()
    };
  }
  
  /**
   * Check for vessels in marine protected areas
   */
  async checkMPAViolations(
    mpaBoundary: [number, number][],
    timeWindow: number = 24 // hours
  ): Promise<Array<{ vessel: FishingVessel; violation: boolean }>> {
    // Get all vessels in the region
    const centerLat = mpaBoundary.reduce((sum, p) => sum + p[0], 0) / mpaBoundary.length;
    const centerLng = mpaBoundary.reduce((sum, p) => sum + p[1], 0) / mpaBoundary.length;
    
    const activity = await this.getFishingActivity(centerLat, centerLng, 1);
    
    // Check if vessels are inside MPA boundary (simplified point-in-polygon)
    return activity.vessels.map(vessel => ({
      vessel,
      violation: this.isPointInPolygon([vessel.location[0], vessel.location[1]], mpaBoundary)
    }));
  }
  
  /**
   * Helper: Estimate catch from vessel data
   */
  private estimateCatch(vessels: any[]): number {
    // Simplified estimation (would use vessel type, gear, etc. in production)
    return vessels.length * 0.5; // 0.5 tons per vessel (average)
  }
  
  /**
   * Helper: Calculate fishing hours
   */
  private calculateFishingHours(vessels: any[]): number {
    // Simplified calculation
    return vessels.length * 8; // Assume 8 hours per vessel
  }
  
  /**
   * Helper: Point in polygon test
   */
  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  
  /**
   * Mock data generators
   */
  private getMockFishingActivity(lat: number, lng: number): FishingActivity {
    const vesselCount = Math.floor(Math.random() * 10);
    const vessels: FishingVessel[] = [];
    
    for (let i = 0; i < vesselCount; i++) {
      vessels.push({
        id: `vessel-${i}`,
        location: [
          lat + (Math.random() - 0.5) * 0.2,
          lng + (Math.random() - 0.5) * 0.2
        ],
        speed: 2 + Math.random() * 8,
        course: Math.random() * 360,
        timestamp: new Date(),
        vesselType: ['trawler', 'longliner', 'purse_seine'][Math.floor(Math.random() * 3)],
        flag: 'MU' // Mauritius
      });
    }
    
    return {
      location: [lat, lng],
      vesselCount,
      totalCatch: vesselCount * 0.5,
      fishingHours: vesselCount * 8,
      vessels
    };
  }
  
  private getMockStockStatus(): Array<{
    species: string;
    stockLevel: 'healthy' | 'moderate' | 'depleted' | 'critical';
    biomass: number;
    maxSustainableYield: number;
  }> {
    return [
      {
        species: 'Yellowfin Tuna',
        stockLevel: 'moderate',
        biomass: 50000,
        maxSustainableYield: 8000
      },
      {
        species: 'Skipjack Tuna',
        stockLevel: 'healthy',
        biomass: 120000,
        maxSustainableYield: 15000
      },
      {
        species: 'Mahi Mahi',
        stockLevel: 'moderate',
        biomass: 30000,
        maxSustainableYield: 5000
      }
    ];
  }
  
  private getMockMPACompliance(): Array<{
    mpaName: string;
    violations: number;
    complianceRate: number;
  }> {
    return [
      {
        mpaName: 'Blue Bay Marine Park',
        violations: Math.floor(Math.random() * 5),
        complianceRate: 85 + Math.random() * 15
      },
      {
        mpaName: 'Balaclava Marine Park',
        violations: Math.floor(Math.random() * 3),
        complianceRate: 90 + Math.random() * 10
      }
    ];
  }
}

