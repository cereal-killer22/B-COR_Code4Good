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
   * Predict bleaching risk based on current conditions and historical data
   */
  async predictBleachingRisk(
    temperature: number,
    pH: number,
    historicalData: number[] = []
  ): Promise<CoralBleachingPrediction> {
    await this.initializeModel();
    
    // Calculate risk using statistical methods (model can be trained later)
    const riskScore = this.calculateRisk(temperature, pH, historicalData);
    const daysToBleaching = this.estimateDaysToBleaching(temperature, pH, riskScore);
    
    return {
      riskLevel: this.getRiskLevel(riskScore),
      probability: Math.min(1, Math.max(0, riskScore)),
      daysToBleaching: daysToBleaching > 0 ? daysToBleaching : undefined,
      temperature,
      pH,
      recommendations: this.getRecommendations(riskScore, temperature, pH),
      confidence: this.calculateConfidence(historicalData.length)
    };
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
   * Estimate days until potential bleaching
   */
  private estimateDaysToBleaching(
    temp: number,
    pH: number,
    riskScore: number
  ): number {
    if (riskScore < 0.6) return -1; // No imminent risk
    
    // Estimate based on how far above thresholds
    const tempExcess = Math.max(0, temp - this.thresholds.temperature.high);
    const days = Math.max(1, Math.round(30 / (1 + tempExcess * 2)));
    
    return days;
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
   * Generate recommendations based on risk
   */
  private getRecommendations(
    score: number,
    temp: number,
    pH: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (score > 0.8) {
      recommendations.push('🚨 URGENT: Implement emergency protection measures');
      recommendations.push('Consider temporary fishing restrictions in affected areas');
      recommendations.push('Deploy shading or cooling interventions if feasible');
      recommendations.push('Increase monitoring frequency to daily');
    } else if (score > 0.6) {
      recommendations.push('⚠️ HIGH RISK: Reduce local stressors (fishing, pollution)');
      recommendations.push('Increase shading or cooling measures');
      recommendations.push('Monitor reef health daily');
      recommendations.push('Prepare emergency response protocols');
    } else if (score > 0.3) {
      recommendations.push('Monitor temperature trends closely');
      recommendations.push('Reduce non-climate stressors');
      recommendations.push('Maintain regular reef health assessments');
    } else {
      recommendations.push('Continue regular monitoring');
      recommendations.push('Maintain good water quality standards');
    }
    
    // Add pH-specific recommendations
    if (pH < 7.8) {
      recommendations.push('Address ocean acidification through local CO₂ reduction');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate prediction confidence based on data availability
   */
  private calculateConfidence(dataPoints: number): number {
    if (dataPoints >= 30) return 0.9;
    if (dataPoints >= 14) return 0.7;
    if (dataPoints >= 7) return 0.5;
    return 0.3;
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

