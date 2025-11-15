/**
 * Coral Bleaching Predictor
 * Predicts coral bleaching risk using temperature, pH, and historical data
 */

import * as tf from '@tensorflow/tfjs';
import type { CoralReefData } from '@climaguard/shared/types/ocean';

export interface CoralBleachingPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'severe';
  probability: number; // 0-1
  daysToBleaching?: number;
  temperature: number;
  pH: number;
  recommendations: string[];
  confidence: number;
}

export class CoralBleachingPredictor {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Critical thresholds for coral bleaching
  private readonly thresholds = {
    temperature: {
      low: 28,
      medium: 29,
      high: 30,
      severe: 31
    },
    pH: {
      critical: 7.8,
      warning: 7.9
    },
    degreeHeatingWeeks: {
      low: 1,
      medium: 4,
      high: 8,
      severe: 12
    }
  };
  
  constructor() {
    // Lazy initialization
  }
  
  /**
   * Initialize the LSTM model for time series prediction
   */
  private async initializeModel(): Promise<void> {
    if (this.isInitialized && this.model) return;
    
    try {
      console.log('🪸 Initializing Coral Bleaching Predictor...');
      
      // Build LSTM model for time series prediction
      const sequenceLength = 30; // 30 days of historical data
      
      this.model = tf.sequential({
        layers: [
          // Input LSTM layer
          tf.layers.lstm({
            inputShape: [sequenceLength, 3], // [temperature, pH, anomaly]
            units: 64,
            returnSequences: true,
            dropout: 0.2,
            recurrentDropout: 0.2,
            name: 'lstm1'
          }),
          
          // Second LSTM layer
          tf.layers.lstm({
            units: 32,
            returnSequences: false,
            dropout: 0.2,
            name: 'lstm2'
          }),
          
          // Dense layers
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            name: 'dense1'
          }),
          tf.layers.dropout({ rate: 0.3, name: 'dropout1' }),
          
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            name: 'dense2'
          }),
          
          // Output: risk probability and days to bleaching
          tf.layers.dense({
            units: 2, // [risk_probability, days_to_bleaching]
            activation: 'linear',
            name: 'output'
          })
        ]
      });
      
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });
      
      this.isInitialized = true;
      console.log('✅ Coral Bleaching Predictor initialized');
      
    } catch (error) {
      console.error('❌ Error initializing coral bleaching model:', error);
      // Don't throw - use statistical methods
      this.isInitialized = false;
    }
  }
  
  /**
   * Predict bleaching risk based on real NOAA data (SST, HotSpot, DHW)
   * Uses NOAA Coral Reef Watch data for accurate predictions
   */
  async predictBleachingRisk(
    sst: number,
    sstAnomaly: number,
    degreeHeatingWeeks: number,
    hotspot: number,
    pH: number = 8.1,
    historicalSST: number[] = []
  ): Promise<CoralBleachingPrediction> {
    await this.initializeModel();
    
    // Calculate risk using NOAA thresholds and real data
    const riskScore = this.calculateRiskFromNOAAData(
      sst,
      sstAnomaly,
      degreeHeatingWeeks,
      hotspot,
      pH,
      historicalSST
    );
    const daysToBleaching = this.estimateDaysToBleaching(sst, pH, riskScore, degreeHeatingWeeks);
    
    return {
      riskLevel: this.getRiskLevel(riskScore),
      probability: Math.min(1, Math.max(0, riskScore)),
      daysToBleaching: daysToBleaching > 0 ? daysToBleaching : undefined,
      temperature: sst,
      pH,
      recommendations: this.getRecommendations(riskScore, sst, pH, degreeHeatingWeeks),
      confidence: this.calculateConfidence(historicalSST.length, degreeHeatingWeeks)
    };
  }
  
  /**
   * Calculate risk using NOAA Coral Reef Watch methodology
   */
  private calculateRiskFromNOAAData(
    sst: number,
    sstAnomaly: number,
    dhw: number,
    hotspot: number,
    pH: number,
    historicalSST: number[]
  ): number {
    let riskScore = 0;
    
    // NOAA DHW-based risk (primary indicator)
    // DHW >= 12: Severe bleaching likely
    // DHW >= 8: High risk
    // DHW >= 4: Moderate risk
    // DHW >= 1: Low risk
    if (dhw >= 12) {
      riskScore += 0.5; // 50% base risk from DHW
    } else if (dhw >= 8) {
      riskScore += 0.35;
    } else if (dhw >= 4) {
      riskScore += 0.2;
    } else if (dhw >= 1) {
      riskScore += 0.1;
    }
    
    // HotSpot component (current temperature stress)
    if (hotspot >= 2) {
      riskScore += 0.3; // High current stress
    } else if (hotspot >= 1) {
      riskScore += 0.15;
    } else if (hotspot > 0) {
      riskScore += 0.05;
    }
    
    // SST anomaly component
    if (sstAnomaly >= 2) {
      riskScore += 0.15;
    } else if (sstAnomaly >= 1) {
      riskScore += 0.1;
    } else if (sstAnomaly > 0) {
      riskScore += 0.05;
    }
    
    // pH component (acidification stress)
    const pHRisk = this.calculatePHRisk(pH);
    riskScore += pHRisk * 0.1; // 10% weight
    
    // Historical trend component
    if (historicalSST.length >= 7) {
      const trendRisk = this.analyzeTrend(historicalSST);
      riskScore += trendRisk * 0.05; // 5% weight
    }
    
    return Math.min(1, riskScore);
  }
  
  /**
   * Calculate bleaching risk score (0-1)
   */
  private calculateRisk(temp: number, pH: number, history: number[]): number {
    let riskScore = 0;
    
    // Temperature component (most critical)
    const tempRisk = this.calculateTemperatureRisk(temp);
    riskScore += tempRisk * 0.6; // 60% weight
    
    // pH component (acidification stress)
    const pHRisk = this.calculatePHRisk(pH);
    riskScore += pHRisk * 0.25; // 25% weight
    
    // Historical trend component
    const trendRisk = this.analyzeTrend(history);
    riskScore += trendRisk * 0.15; // 15% weight
    
    return Math.min(1, riskScore);
  }
  
  /**
   * Calculate temperature-based risk
   */
  private calculateTemperatureRisk(temp: number): number {
    // Degree Heating Weeks (DHW) concept
    // Temperature above 30°C is critical
    if (temp >= this.thresholds.temperature.severe) {
      return 1.0; // Maximum risk
    }
    if (temp >= this.thresholds.temperature.high) {
      return 0.7 + (temp - this.thresholds.temperature.high) * 3; // 0.7-1.0
    }
    if (temp >= this.thresholds.temperature.medium) {
      return 0.4 + (temp - this.thresholds.temperature.medium) * 3; // 0.4-0.7
    }
    if (temp >= this.thresholds.temperature.low) {
      return 0.1 + (temp - this.thresholds.temperature.low) * 3; // 0.1-0.4
    }
    return 0.05; // Low baseline risk
  }
  
  /**
   * Calculate pH-based risk (acidification)
   */
  private calculatePHRisk(pH: number): number {
    // pH below 7.8 indicates significant acidification stress
    if (pH < this.thresholds.pH.critical) {
      return 0.8 + (this.thresholds.pH.critical - pH) * 2; // 0.8-1.0
    }
    if (pH < this.thresholds.pH.warning) {
      return 0.4 + (this.thresholds.pH.warning - pH) * 4; // 0.4-0.8
    }
    if (pH < 8.0) {
      return 0.1 + (8.0 - pH) * 1.5; // 0.1-0.4
    }
    return 0.05; // Normal pH range
  }
  
  /**
   * Analyze historical temperature trend
   */
  private analyzeTrend(history: number[]): number {
    if (history.length < 2) return 0;
    
    // Calculate trend (increasing temperatures increase risk)
    const recent = history.slice(-7); // Last week
    const older = history.slice(0, Math.max(1, history.length - 7));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const trend = recentAvg - olderAvg;
    
    // Normalize trend to 0-1 risk
    if (trend > 2) return 1.0; // Very high warming trend
    if (trend > 1) return 0.7;
    if (trend > 0.5) return 0.4;
    if (trend > 0) return 0.2;
    return 0.05; // Stable or cooling
  }
  
  /**
   * Estimate days until potential bleaching using DHW
   */
  private estimateDaysToBleaching(
    temp: number,
    pH: number,
    riskScore: number,
    dhw: number
  ): number {
    if (riskScore < 0.6) return -1; // No imminent risk
    
    // Use DHW to estimate timeline
    // DHW accumulates over time, so higher DHW = closer to bleaching
    if (dhw >= 12) {
      return 1; // Imminent (within days)
    } else if (dhw >= 8) {
      return 7; // Within a week
    } else if (dhw >= 4) {
      return 14; // Within 2 weeks
    } else if (dhw >= 1) {
      return 30; // Within a month
    }
    
    // Fallback: estimate based on temperature excess
    const tempExcess = Math.max(0, temp - this.thresholds.temperature.high);
    return Math.max(1, Math.round(30 / (1 + tempExcess * 2)));
  }
  
  /**
   * Get risk level category
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'severe' {
    if (score >= 0.8) return 'severe';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }
  
  /**
   * Generate recommendations based on risk and NOAA data
   */
  private getRecommendations(
    score: number,
    temp: number,
    pH: number,
    dhw: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (score > 0.8 || dhw >= 12) {
      recommendations.push('🚨 URGENT: Severe bleaching risk detected (DHW ≥ 12)');
      recommendations.push('Implement emergency protection measures immediately');
      recommendations.push('Consider temporary fishing restrictions in affected areas');
      recommendations.push('Deploy shading or cooling interventions if feasible');
      recommendations.push('Increase monitoring frequency to daily');
      recommendations.push('Alert marine park authorities and research institutions');
    } else if (score > 0.6 || dhw >= 8) {
      recommendations.push('⚠️ HIGH RISK: Significant bleaching risk (DHW ≥ 8)');
      recommendations.push('Reduce local stressors (fishing, pollution, tourism)');
      recommendations.push('Increase shading or cooling measures');
      recommendations.push('Monitor reef health daily');
      recommendations.push('Prepare emergency response protocols');
      recommendations.push('Coordinate with local conservation groups');
    } else if (score > 0.3 || dhw >= 4) {
      recommendations.push('⚠️ MODERATE RISK: Monitor temperature trends closely');
      recommendations.push('Reduce non-climate stressors');
      recommendations.push('Maintain regular reef health assessments (weekly)');
      recommendations.push('Prepare for potential escalation');
    } else {
      recommendations.push('✅ LOW RISK: Continue regular monitoring');
      recommendations.push('Maintain good water quality standards');
      recommendations.push('Monitor NOAA Coral Reef Watch alerts');
    }
    
    // Add pH-specific recommendations
    if (pH < 7.8) {
      recommendations.push('Address ocean acidification through local CO₂ reduction');
    }
    
    // Add DHW-specific guidance
    if (dhw > 0 && dhw < 4) {
      recommendations.push('DHW accumulating - monitor closely for rapid changes');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate prediction confidence based on data availability and NOAA data quality
   */
  private calculateConfidence(dataPoints: number, dhw: number): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more historical data
    if (dataPoints >= 30) confidence += 0.3;
    else if (dataPoints >= 14) confidence += 0.2;
    else if (dataPoints >= 7) confidence += 0.1;
    
    // Higher confidence when using real NOAA DHW data
    if (dhw > 0) confidence += 0.2;
    
    return Math.min(0.95, confidence);
  }
  
  /**
   * Predict for multiple reef locations
   */
  async predictMultipleReefs(
    reefs: Array<{ location: [number, number]; temperature: number; pH: number; history?: number[] }>
  ): Promise<Array<CoralBleachingPrediction & { location: [number, number] }>> {
    const predictions = await Promise.all(
      reefs.map(async (reef) => {
        const prediction = await this.predictBleachingRisk(
          reef.temperature,
          reef.pH,
          reef.history || []
        );
        return {
          ...prediction,
          location: reef.location
        };
      })
    );
    
    return predictions;
  }
  
  /**
   * Dispose of model resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

