/**
 * Smart Model Initialization
 * Only trains models when necessary, preserves existing trained models
 */

import { cycloneTrainer } from './cycloneTrainer';
import { TrainingStatusManager } from './trainingStatusManager';

export class SmartModelInitializer {
  private static instance: SmartModelInitializer | null = null;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): SmartModelInitializer {
    if (!this.instance) {
      this.instance = new SmartModelInitializer();
    }
    return this.instance;
  }

  /**
   * Initialize models smartly - only train if needed
   */
  async initializeModels(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialization();
    return this.initializationPromise;
  }

  private async doInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing ClimaGuard AI Models...');

      // Check current training status
      const status = TrainingStatusManager.getTrainingStatus();
      const hasTrainedModel = await TrainingStatusManager.hasTrainedModel();
      
      console.log('📊 Training Status:', TrainingStatusManager.getStatusMessage());

      if (hasTrainedModel && !status.needsTraining) {
        console.log('✅ Models are already trained and up-to-date!');
        console.log('🎯 Ready for predictions without additional training');
        return;
      }

      if (!hasTrainedModel) {
        console.log('🆕 First-time setup detected');
        console.log('📚 Starting initial model training with historical data...');
        
        // Perform initial training
        await cycloneTrainer.trainModel(true); // Force training
        console.log('🎉 Initial training completed! Models ready for use.');
        
      } else if (status.needsTraining) {
        const timeUntilNext = TrainingStatusManager.getTimeUntilNextTraining();
        
        if (timeUntilNext === 0) {
          console.log('⏰ Scheduled retraining is due');
          console.log('📈 Updating models with latest cyclone data...');
          
          await cycloneTrainer.trainModel(true);
          console.log('🔄 Model update completed!');
        }
      }

    } catch (error) {
      console.error('❌ Model initialization failed:', error);
      console.log('⚠️  Models will work with default weights, but training is recommended');
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Start background continuous learning (optional)
   */
  async startContinuousLearning(): Promise<void> {
    console.log('🔄 Starting continuous learning system...');
    cycloneTrainer.startContinuousLearning();
  }

  /**
   * Get current model readiness status
   */
  async getModelReadiness(): Promise<{
    isReady: boolean;
    hasTrained: boolean;
    needsTraining: boolean;
    statusMessage: string;
  }> {
    const status = TrainingStatusManager.getTrainingStatus();
    const hasTrained = await TrainingStatusManager.hasTrainedModel();

    return {
      isReady: true, // Models work even without training, just less accurate
      hasTrained,
      needsTraining: status.needsTraining || !hasTrained,
      statusMessage: TrainingStatusManager.getStatusMessage()
    };
  }
}

// Export singleton instance
export const modelInitializer = SmartModelInitializer.getInstance();