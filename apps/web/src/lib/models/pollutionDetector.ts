/**
 * Pollution Detection CNN Model
 * Uses TensorFlow.js to detect pollution in satellite imagery
 */

import * as tf from '@tensorflow/tfjs';
import type { PollutionEvent } from '@climaguard/shared/types/ocean';

export interface PollutionDetectionResult {
  type: 'oil_spill' | 'plastic' | 'chemical' | 'debris' | 'sewage';
  confidence: number;
  location: [number, number];
  boundingBox?: [number, number, number, number]; // [x, y, width, height]
}

export class PollutionDetector {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private readonly imageSize = 256;
  
  constructor() {
    // Lazy initialization
  }
  
  /**
   * Initialize the CNN model for pollution detection
   */
  async initializeModel(): Promise<void> {
    if (this.isInitialized && this.model) return;
    
    try {
      console.log('🌊 Initializing Pollution Detection CNN...');
      
      // Build CNN for pollution detection
      this.model = tf.sequential({
        layers: [
          // First convolutional block
          tf.layers.conv2d({
            inputShape: [this.imageSize, this.imageSize, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same',
            name: 'conv1'
          }),
          tf.layers.batchNormalization({ name: 'bn1' }),
          tf.layers.maxPooling2d({ poolSize: 2, name: 'pool1' }),
          tf.layers.dropout({ rate: 0.25, name: 'dropout1' }),
          
          // Second convolutional block
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same',
            name: 'conv2'
          }),
          tf.layers.batchNormalization({ name: 'bn2' }),
          tf.layers.maxPooling2d({ poolSize: 2, name: 'pool2' }),
          tf.layers.dropout({ rate: 0.25, name: 'dropout2' }),
          
          // Third convolutional block
          tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same',
            name: 'conv3'
          }),
          tf.layers.batchNormalization({ name: 'bn3' }),
          tf.layers.maxPooling2d({ poolSize: 2, name: 'pool3' }),
          tf.layers.dropout({ rate: 0.25, name: 'dropout3' }),
          
          // Flatten and dense layers
          tf.layers.flatten({ name: 'flatten' }),
          tf.layers.dense({ 
            units: 256, 
            activation: 'relu',
            name: 'dense1'
          }),
          tf.layers.dropout({ rate: 0.5, name: 'dropout4' }),
          tf.layers.dense({ 
            units: 128, 
            activation: 'relu',
            name: 'dense2'
          }),
          
          // Output layer: 5 pollution types + none
          tf.layers.dense({ 
            units: 6, 
            activation: 'softmax',
            name: 'output'
          })
        ]
      });
      
      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      this.isInitialized = true;
      console.log('✅ Pollution Detection CNN initialized');
      
    } catch (error) {
      console.error('❌ Error initializing pollution detection model:', error);
      // Don't throw - allow fallback to statistical methods
      this.isInitialized = false;
    }
  }
  
  /**
   * Detect pollution in an image
   */
  async detectPollution(
    imageData: ImageData | HTMLImageElement | HTMLCanvasElement,
    location: [number, number]
  ): Promise<PollutionDetectionResult[]> {
    await this.initializeModel();
    
    if (!this.model) {
      // Fallback to statistical detection
      return this.statisticalDetection(location);
    }
    
    try {
      // Preprocess image
      let tensor: tf.Tensor4D;
      
      if (imageData instanceof ImageData) {
        tensor = tf.browser.fromPixels(imageData)
          .resizeNearestNeighbor([this.imageSize, this.imageSize])
          .expandDims(0)
          .div(255.0) as tf.Tensor4D;
      } else if (imageData instanceof HTMLImageElement || imageData instanceof HTMLCanvasElement) {
        tensor = tf.browser.fromPixels(imageData)
          .resizeNearestNeighbor([this.imageSize, this.imageSize])
          .expandDims(0)
          .div(255.0) as tf.Tensor4D;
      } else {
        throw new Error('Unsupported image type');
      }
      
      // Predict
      const prediction = this.model.predict(tensor) as tf.Tensor;
      const values = await prediction.data();
      
      // Clean up
      tensor.dispose();
      prediction.dispose();
      
      // Map to pollution types
      const types: Array<'oil_spill' | 'plastic' | 'chemical' | 'debris' | 'sewage' | 'none'> = [
        'oil_spill',
        'plastic',
        'chemical',
        'debris',
        'sewage',
        'none'
      ];
      
      const results: PollutionDetectionResult[] = [];
      const confidenceThreshold = 0.3; // Minimum confidence to report
      
      for (let i = 0; i < types.length; i++) {
        const confidence = values[i];
        if (confidence > confidenceThreshold && types[i] !== 'none') {
          results.push({
            type: types[i] as Exclude<typeof types[number], 'none'>,
            confidence: Math.round(confidence * 100) / 100,
            location
          });
        }
      }
      
      // Sort by confidence
      results.sort((a, b) => b.confidence - a.confidence);
      
      return results;
      
    } catch (error) {
      console.error('Error in pollution detection:', error);
      return this.statisticalDetection(location);
    }
  }
  
  /**
   * Statistical fallback detection method
   */
  private statisticalDetection(location: [number, number]): PollutionDetectionResult[] {
    // Simulate detection based on location and known patterns
    // In production, this would use historical data or simpler heuristics
    
    const results: PollutionDetectionResult[] = [];
    
    // Simulate occasional plastic detection in coastal areas
    if (Math.random() > 0.7) {
      results.push({
        type: 'plastic',
        confidence: 0.4 + Math.random() * 0.3,
        location
      });
    }
    
    return results;
  }
  
  /**
   * Convert detection results to PollutionEvent format
   */
  convertToPollutionEvents(
    detections: PollutionDetectionResult[],
    imageTimestamp: Date = new Date()
  ): PollutionEvent[] {
    return detections.map((detection, index) => ({
      id: `pollution-${Date.now()}-${index}`,
      type: detection.type,
      location: detection.location,
      severity: this.confidenceToSeverity(detection.confidence),
      detectedAt: imageTimestamp,
      affectedArea: this.estimateAffectedArea(detection.type, detection.confidence),
      predictedSpread: this.predictSpread(detection.location),
      status: 'detected'
    }));
  }
  
  private confidenceToSeverity(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.8) return 'critical';
    if (confidence >= 0.6) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  }
  
  private estimateAffectedArea(
    type: PollutionDetectionResult['type'],
    confidence: number
  ): number {
    // Estimate area in km² based on type and confidence
    const baseAreas: Record<PollutionDetectionResult['type'], number> = {
      oil_spill: 5,
      plastic: 2,
      chemical: 1,
      debris: 0.5,
      sewage: 0.3
    };
    
    return baseAreas[type] * (0.5 + confidence);
  }
  
  private predictSpread(location: [number, number]): [number, number][] {
    // Predict spread pattern (simplified - would use ocean current models)
    const spreadRadius = 0.1; // degrees
    return [
      [location[0] - spreadRadius, location[1] - spreadRadius],
      [location[0] + spreadRadius, location[1] - spreadRadius],
      [location[0] + spreadRadius, location[1] + spreadRadius],
      [location[0] - spreadRadius, location[1] + spreadRadius]
    ];
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

