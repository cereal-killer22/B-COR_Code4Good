/**
 * Cyclone Alert System
 * Handles notifications for cyclone formation and tracking predictions
 */

export interface AlertConfiguration {
  email?: string;
  phone?: string;
  webhook?: string;
  thresholds: {
    formationProbability: number; // Alert when formation probability exceeds this
    timeToFormation: number; // Alert when formation expected within hours
    windSpeed: number; // Alert when predicted wind speed exceeds this
    nearbyDistance: number; // Alert when cyclone within this distance (km)
  };
  regions: Array<{
    name: string;
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }>;
}

export interface CycloneAlert {
  id: string;
  type: 'formation' | 'tracking' | 'landfall' | 'intensification';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  message: string;
  location: { lat: number; lng: number };
  timestamp: number;
  data: any; // Additional alert data
  actions: string[]; // Recommended actions
}

export class CycloneAlertSystem {
  private alerts: CycloneAlert[] = [];
  private config: AlertConfiguration;
  
  constructor(config: AlertConfiguration) {
    this.config = config;
  }

  /**
   * Process formation predictions and generate alerts
   */
  async processFormationPredictions(predictions: any[]): Promise<CycloneAlert[]> {
    const newAlerts: CycloneAlert[] = [];
    
    for (const prediction of predictions) {
      // Check if formation probability exceeds threshold
      if (prediction.formationProbability > this.config.thresholds.formationProbability) {
        const alert: CycloneAlert = {
          id: `formation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'formation',
          severity: this.determineSeverity(prediction.formationProbability, prediction.timeToFormation),
          title: '🌀 High Cyclone Formation Probability Detected',
          message: `${(prediction.formationProbability * 100).toFixed(1)}% chance of cyclone formation at ${prediction.location.lat.toFixed(1)}°S, ${prediction.location.lng.toFixed(1)}°E within ${Math.round(prediction.timeToFormation)} hours`,
          location: prediction.location,
          timestamp: Date.now(),
          data: prediction,
          actions: this.generateFormationActions(prediction)
        };
        
        newAlerts.push(alert);
      }
      
      // Check for near-term formation
      if (prediction.timeToFormation < this.config.thresholds.timeToFormation) {
        const alert: CycloneAlert = {
          id: `nearterm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'formation',
          severity: 'high',
          title: '⚡ Imminent Cyclone Formation Alert',
          message: `Cyclone formation expected within ${Math.round(prediction.timeToFormation)} hours at ${prediction.location.lat.toFixed(1)}°S, ${prediction.location.lng.toFixed(1)}°E`,
          location: prediction.location,
          timestamp: Date.now(),
          data: prediction,
          actions: [
            '🛡️ Activate emergency monitoring protocols',
            '📡 Increase satellite observation frequency',
            '⚠️ Issue early warning to affected coastal areas',
            '🚁 Prepare emergency response teams'
          ]
        };
        
        newAlerts.push(alert);
      }
    }
    
    this.alerts.push(...newAlerts);
    
    // Send notifications for new alerts
    for (const alert of newAlerts) {
      await this.sendAlert(alert);
    }
    
    return newAlerts;
  }

  /**
   * Process existing cyclone tracking predictions and generate alerts
   */
  async processTrackingPredictions(predictions: any[]): Promise<CycloneAlert[]> {
    const newAlerts: CycloneAlert[] = [];
    
    for (const prediction of predictions) {
      // Check for intensification
      if (prediction.prediction?.trajectory) {
        const currentWindSpeed = prediction.currentStatus?.windSpeed || 0;
        const maxPredictedWind = Math.max(
          ...prediction.prediction.trajectory.map((point: any) => point.windSpeed || 0)
        );
        
        if (maxPredictedWind > this.config.thresholds.windSpeed && maxPredictedWind > currentWindSpeed * 1.2) {
          const alert: CycloneAlert = {
            id: `intensification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'intensification',
            severity: 'high',
            title: '💨 Cyclone Intensification Alert',
            message: `${prediction.cycloneName} expected to intensify from ${currentWindSpeed} to ${maxPredictedWind.toFixed(0)} kt`,
            location: prediction.currentStatus.currentPosition,
            timestamp: Date.now(),
            data: prediction,
            actions: [
              '🌊 Prepare for stronger storm surge',
              '🏠 Reinforce coastal defenses',
              '📢 Update evacuation plans',
              '🚨 Increase warning levels for affected areas'
            ]
          };
          
          newAlerts.push(alert);
        }
      }
    }
    
    this.alerts.push(...newAlerts);
    
    for (const alert of newAlerts) {
      await this.sendAlert(alert);
    }
    
    return newAlerts;
  }

  /**
   * Send alert through configured channels
   */
  async sendAlert(alert: CycloneAlert): Promise<void> {
    console.log(`🚨 CYCLONE ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`);
    console.log(`📍 Location: ${alert.location.lat.toFixed(2)}, ${alert.location.lng.toFixed(2)}`);
    console.log(`📝 Message: ${alert.message}`);
    console.log(`⏰ Time: ${new Date(alert.timestamp).toLocaleString()}`);
    console.log(`🎯 Actions:`);
    alert.actions.forEach(action => console.log(`  • ${action}`));
    console.log('---');
    
    // Send email notification
    if (this.config.email) {
      await this.sendEmailAlert(alert);
    }
    
    // Send SMS notification  
    if (this.config.phone) {
      await this.sendSMSAlert(alert);
    }
    
    // Send webhook notification
    if (this.config.webhook) {
      await this.sendWebhookAlert(alert);
    }
  }

  /**
   * Send email alert (placeholder - integrate with actual email service)
   */
  private async sendEmailAlert(alert: CycloneAlert): Promise<void> {
    console.log(`📧 Email alert sent to: ${this.config.email}`);
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  }

  /**
   * Send SMS alert (placeholder - integrate with SMS service)
   */
  private async sendSMSAlert(alert: CycloneAlert): Promise<void> {
    console.log(`📱 SMS alert sent to: ${this.config.phone}`);
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: CycloneAlert): Promise<void> {
    try {
      const response = await fetch(this.config.webhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
          source: 'ClimaGuard-AI'
        })
      });
      
      console.log(`🔗 Webhook alert sent: ${response.status}`);
    } catch (error) {
      console.error('❌ Webhook alert failed:', error);
    }
  }

  /**
   * Determine alert severity based on probability and timing
   */
  private determineSeverity(probability: number, timeToFormation: number): CycloneAlert['severity'] {
    if (probability > 0.8 && timeToFormation < 24) return 'critical';
    if (probability > 0.6 && timeToFormation < 48) return 'high';
    if (probability > 0.4 && timeToFormation < 72) return 'moderate';
    return 'low';
  }

  /**
   * Generate recommended actions for formation alerts
   */
  private generateFormationActions(prediction: any): string[] {
    const actions = [];
    
    if (prediction.formationProbability > 0.7) {
      actions.push('🚨 Issue cyclone formation warning');
      actions.push('📡 Activate enhanced monitoring systems');
    }
    
    if (prediction.timeToFormation < 48) {
      actions.push('⚠️ Alert maritime traffic in the area');
      actions.push('🛡️ Prepare coastal emergency services');
    }
    
    if (prediction.environmentalFactors.seaTempFavorable && prediction.environmentalFactors.lowWindShear) {
      actions.push('🌊 Monitor for rapid intensification potential');
    }
    
    actions.push('📊 Continue tracking environmental conditions');
    actions.push('🎯 Focus satellite resources on formation zone');
    
    return actions;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): CycloneAlert[] {
    // Return alerts from last 24 hours
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > dayAgo);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: CycloneAlert['severity']): CycloneAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(): void {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > weekAgo);
  }
}

// Example configuration for Mauritius region
export const mauritiusAlertConfig: AlertConfiguration = {
  email: 'user@example.com', // Replace with your email
  phone: '+230XXXXXXXX', // Replace with your phone
  webhook: 'https://your-webhook-url.com/cyclone-alerts', // Replace with your webhook
  thresholds: {
    formationProbability: 0.4, // Alert when >40% formation probability
    timeToFormation: 72, // Alert when formation expected within 72 hours
    windSpeed: 100, // Alert when winds exceed 100 kt (Category 3+)
    nearbyDistance: 500 // Alert when cyclone within 500km
  },
  regions: [
    {
      name: 'Mauritius Region',
      minLat: -25,
      maxLat: -15,
      minLng: 55,
      maxLng: 65
    }
  ]
};

// Export singleton instance
export const cycloneAlerts = new CycloneAlertSystem(mauritiusAlertConfig);