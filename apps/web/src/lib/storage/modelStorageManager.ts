/**
 * Model Storage Manager using Supabase
 * Handles saving and loading trained models to/from Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import * as tf from '@tensorflow/tfjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class ModelStorageManager {
  private supabase;
  
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Save trained model to Supabase Storage
   */
  async saveModel(model: tf.LayersModel, modelName: string = 'cyclone-lstm-model'): Promise<boolean> {
    try {
      console.log('💾 Saving model to Supabase Storage...');
      
      // Use custom save handler to capture model artifacts
      let capturedArtifacts: any = null;
      
      await model.save(tf.io.withSaveHandler(async (artifacts) => {
        capturedArtifacts = artifacts;
        return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
      }));
      
      if (!capturedArtifacts) {
        throw new Error('Failed to capture model artifacts');
      }
      
      const modelData = {
        modelTopology: capturedArtifacts.modelTopology,
        weightSpecs: capturedArtifacts.weightSpecs,
        weightData: Array.from(new Uint8Array(capturedArtifacts.weightData)),
        format: capturedArtifacts.format,
        generatedBy: capturedArtifacts.generatedBy,
        convertedBy: capturedArtifacts.convertedBy,
        signature: capturedArtifacts.signature,
        userDefinedMetadata: capturedArtifacts.userDefinedMetadata,
        modelInitializer: capturedArtifacts.modelInitializer,
        trainingConfig: capturedArtifacts.trainingConfig,
        timestamp: Date.now(),
        version: '2.1'
      };

      // Save model data as JSON to Supabase Storage
      const fileName = `${modelName}-${Date.now()}.json`;
      const { data, error } = await this.supabase.storage
        .from('trained-models')
        .upload(fileName, JSON.stringify(modelData), {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        console.error('❌ Error uploading to Supabase:', error);
        return false;
      }

      // Try to update the current model reference (optional)
      try {
        await this.updateCurrentModelReference(fileName, modelName);
      } catch (refError) {
        console.warn('⚠️ Could not update model reference, but model saved successfully');
      }
      
      console.log('✅ Model saved to Supabase Storage:', fileName);
      return true;

    } catch (error) {
      console.error('❌ Error saving model to Supabase:', error);
      return false;
    }
  }

  /**
   * Load trained model from Supabase Storage
   */
  async loadModel(modelName: string = 'cyclone-lstm-model'): Promise<tf.LayersModel | null> {
    try {
      console.log('📥 Loading model from Supabase Storage...');
      
      // Try to get the current model reference, or find the latest model
      let currentFile = await this.getCurrentModelReference(modelName);
      
      if (!currentFile) {
        // Fallback: get the latest model file
        const modelFiles = await this.listModels();
        const matchingFiles = modelFiles.filter(f => f.startsWith(modelName));
        
        if (matchingFiles.length === 0) {
          console.log('📝 No saved model found in Supabase');
          return null;
        }
        
        // Use the most recent file (files have timestamps)
        currentFile = matchingFiles.sort().reverse()[0];
        console.log('📁 Using latest model file:', currentFile);
      }

      // Download model data
      const { data, error } = await this.supabase.storage
        .from('trained-models')
        .download(currentFile);

      if (error) {
        console.error('❌ Error downloading from Supabase:', error);
        return null;
      }

      // Parse model data
      const modelData = JSON.parse(await data.text());
      
      // Reconstruct weight data from array
      const weightData = new Uint8Array(modelData.weightData).buffer;
      
      const modelArtifacts = {
        modelTopology: modelData.modelTopology,
        weightSpecs: modelData.weightSpecs,
        weightData: weightData,
        format: modelData.format,
        generatedBy: modelData.generatedBy,
        convertedBy: modelData.convertedBy,
        signature: modelData.signature,
        userDefinedMetadata: modelData.userDefinedMetadata,
        modelInitializer: modelData.modelInitializer,
        trainingConfig: modelData.trainingConfig
      };

      // Load model from artifacts
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
      
      console.log('✅ Model loaded from Supabase Storage');
      return model;

    } catch (error) {
      console.error('❌ Error loading model from Supabase:', error);
      return null;
    }
  }

  /**
   * Update reference to current model file
   */
  private async updateCurrentModelReference(fileName: string, modelName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('model_references')
        .upsert({
          model_name: modelName,
          current_file: fileName,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('⚠️ Could not update model reference:', error);
      }
    } catch (error) {
      console.warn('⚠️ Could not update model reference:', error);
    }
  }

  /**
   * Get reference to current model file
   */
  private async getCurrentModelReference(modelName: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('model_references')
        .select('current_file')
        .eq('model_name', modelName)
        .single();

      if (error || !data) {
        return null;
      }

      return data.current_file;
    } catch (error) {
      return null;
    }
  }

  /**
   * List all saved models
   */
  async listModels(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from('trained-models')
        .list();

      if (error) {
        console.error('❌ Error listing models:', error);
        return [];
      }

      return data.map(file => file.name);
    } catch (error) {
      console.error('❌ Error listing models:', error);
      return [];
    }
  }
}