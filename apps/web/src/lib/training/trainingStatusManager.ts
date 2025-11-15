/**
 * Training Status Manager
 * Tracks training history and determines when retraining is needed
 */

interface TrainingHistory {
  lastTrainingTime: number;
  modelVersion: string;
  trainingDataSize: number;
  accuracy: number;
  needsTraining: boolean;
}

export class TrainingStatusManager {
  private static STORAGE_KEY = 'climaguard_training_status';
  private static TRAINING_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  /**
   * Get current training status
   */
  static getTrainingStatus(): TrainingHistory {
    if (typeof window === 'undefined') {
      // Server-side: assume needs training
      return this.getDefaultStatus();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultStatus();
      }
      
      const status: TrainingHistory = JSON.parse(stored);
      
      // Check if retraining is needed based on time
      const timeSinceLastTraining = Date.now() - status.lastTrainingTime;
      status.needsTraining = timeSinceLastTraining > this.TRAINING_INTERVAL;
      
      return status;
    } catch (error) {
      console.error('Error reading training status:', error);
      return this.getDefaultStatus();
    }
  }

  /**
   * Update training status after successful training
   */
  static updateTrainingStatus(dataSize: number, accuracy: number = 0.85): void {
    if (typeof window === 'undefined') return;

    const status: TrainingHistory = {
      lastTrainingTime: Date.now(),
      modelVersion: 'LSTM-v2.1',
      trainingDataSize: dataSize,
      accuracy: accuracy,
      needsTraining: false
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
      console.log('✅ Training status updated:', status);
    } catch (error) {
      console.error('❌ Error saving training status:', error);
    }
  }

  /**
   * Check if model has been trained at least once
   */
  static hasBeenTrained(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const status: TrainingHistory = JSON.parse(stored);
      return status.lastTrainingTime > 0 && status.trainingDataSize > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if a saved model exists
   */
  static async hasTrainedModel(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      // Try to list saved models in localStorage
      const modelInfo = localStorage.getItem('tensorflowjs_models/cyclone-lstm-model/info');
      return modelInfo !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get time until next scheduled training
   */
  static getTimeUntilNextTraining(): number {
    const status = this.getTrainingStatus();
    const nextTrainingTime = status.lastTrainingTime + this.TRAINING_INTERVAL;
    return Math.max(0, nextTrainingTime - Date.now());
  }

  /**
   * Force mark as needing training (useful for manual triggers)
   */
  static markNeedsTraining(): void {
    if (typeof window === 'undefined') return;

    try {
      const status = this.getTrainingStatus();
      status.needsTraining = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Error marking needs training:', error);
    }
  }

  /**
   * Get default status for new installations
   */
  private static getDefaultStatus(): TrainingHistory {
    return {
      lastTrainingTime: 0,
      modelVersion: 'LSTM-v2.1',
      trainingDataSize: 0,
      accuracy: 0,
      needsTraining: true
    };
  }

  /**
   * Get human-readable status
   */
  static getStatusMessage(): string {
    const status = this.getTrainingStatus();
    
    if (status.lastTrainingTime === 0) {
      return '🆕 New model - Initial training recommended';
    }
    
    if (status.needsTraining) {
      return '⏰ Scheduled retraining due - Click to update with latest data';
    }
    
    const lastTrained = new Date(status.lastTrainingTime);
    return `✅ Model trained on ${lastTrained.toLocaleDateString()} with ${status.trainingDataSize} cyclone tracks`;
  }
}