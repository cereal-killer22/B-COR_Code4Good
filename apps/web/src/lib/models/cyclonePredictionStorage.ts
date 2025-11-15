import { createClient } from '@supabase/supabase-js';
import type { FormationPrediction } from './cycloneFormationPredictor';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface StoredPrediction {
  id: string;
  prediction_id: string;
  created_at: string;
  updated_at: string;
  location_lat: number;
  location_lng: number;
  formation_probability: number;
  time_to_formation: number;
  expected_formation_date: string;
  expected_intensity: string;
  confidence: number;
  region: string;
  sea_temp_favorable: boolean;
  low_wind_shear: boolean;
  sufficient_moisture: boolean;
  atmospheric_instability: boolean;
  prediction_method: string;
  model_version?: string;
  is_verified: boolean;
  actual_formation_date?: string;
  actual_intensity: string;
  accuracy_score?: number;
}

export interface PredictionStatus {
  id: string;
  created_at: string;
  updated_at: string;
  last_prediction_run: string;
  active_predictions_count: number;
  high_probability_count: number;
  regions_monitored: string[];
  prediction_system_status: 'healthy' | 'degraded' | 'offline';
  last_error_message?: string;
  last_error_time?: string;
  average_prediction_time_ms?: number;
  total_api_calls_today: number;
  is_current: boolean;
}

export interface AccuracyMetrics {
  id: string;
  created_at: string;
  period_start: string;
  period_end: string;
  total_predictions: number;
  verified_predictions: number;
  correct_formations: number;
  false_positives: number;
  false_negatives: number;
  accuracy_rate?: number;
  precision_rate?: number;
  recall_rate?: number;
  f1_score?: number;
  intensity_accuracy_rate?: number;
  timing_accuracy_hours?: number;
  region: string;
  prediction_method: string;
}

export class CyclonePredictionStorage {
  /**
   * Save a formation prediction to Supabase
   */
  static async savePrediction(
    prediction: FormationPrediction,
    method: 'statistical' | 'neural-network' | 'hybrid' = 'statistical',
    modelVersion?: string
  ): Promise<{ success: boolean; error?: string; data?: StoredPrediction }> {
    try {
      const predictionData = {
        prediction_id: prediction.id,
        location_lat: prediction.location.lat,
        location_lng: prediction.location.lng,
        formation_probability: prediction.formationProbability,
        time_to_formation: prediction.timeToFormation,
        expected_formation_date: prediction.expectedFormationDateStr,
        expected_intensity: prediction.expectedIntensity,
        confidence: prediction.confidence,
        region: prediction.region,
        sea_temp_favorable: prediction.environmentalFactors.seaTempFavorable,
        low_wind_shear: prediction.environmentalFactors.lowWindShear,
        sufficient_moisture: prediction.environmentalFactors.sufficientMoisture,
        atmospheric_instability: prediction.environmentalFactors.atmosphericInstability,
        prediction_method: method,
        model_version: modelVersion,
        actual_intensity: 'no-formation', // Default until verified
      };

      const { data, error } = await supabase
        .from('cyclone_formation_predictions')
        .insert(predictionData)
        .select()
        .single();

      if (error) {
        console.error('Error saving prediction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error saving prediction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save multiple predictions in batch
   */
  static async savePredictions(
    predictions: FormationPrediction[],
    method: 'statistical' | 'neural-network' | 'hybrid' = 'statistical',
    modelVersion?: string
  ): Promise<{ success: boolean; error?: string; saved: number; failed: number }> {
    let saved = 0;
    let failed = 0;

    for (const prediction of predictions) {
      const result = await this.savePrediction(prediction, method, modelVersion);
      if (result.success) {
        saved++;
      } else {
        failed++;
        console.error(`Failed to save prediction ${prediction.id}:`, result.error);
      }
    }

    return {
      success: failed === 0,
      saved,
      failed,
      error: failed > 0 ? `Failed to save ${failed} predictions` : undefined
    };
  }

  /**
   * Get recent predictions from the database
   */
  static async getRecentPredictions(
    hours: number = 24,
    region?: string
  ): Promise<{ success: boolean; error?: string; data?: StoredPrediction[] }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);

      let query = supabase
        .from('cyclone_formation_predictions')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching predictions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active predictions (expected formation date in the future)
   */
  static async getActivePredictions(
    region?: string
  ): Promise<{ success: boolean; error?: string; data?: StoredPrediction[] }> {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('cyclone_formation_predictions')
        .select('*')
        .gte('expected_formation_date', now)
        .order('formation_probability', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching active predictions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching active predictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update prediction status in the database
   */
  static async updatePredictionStatus(
    predictionCount: number,
    highProbCount: number,
    regions: string[],
    systemStatus: 'healthy' | 'degraded' | 'offline' = 'healthy',
    errorMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_prediction_status', {
        prediction_count: predictionCount,
        high_prob_count: highProbCount,
        regions: regions,
        system_status: systemStatus,
        error_msg: errorMessage || null
      });

      if (error) {
        console.error('Error updating prediction status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating prediction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current prediction system status
   */
  static async getCurrentStatus(): Promise<{ 
    success: boolean; 
    error?: string; 
    data?: PredictionStatus 
  }> {
    try {
      const { data, error } = await supabase
        .from('cyclone_prediction_status')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) {
        console.error('Error fetching prediction status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching prediction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify a prediction with actual outcome
   */
  static async verifyPrediction(
    predictionId: string,
    actualFormationDate?: Date,
    actualIntensity: 'no-formation' | 'tropical-depression' | 'tropical-storm' | 'category-1' | 'category-2+' = 'no-formation'
  ): Promise<{ success: boolean; error?: string; accuracyScore?: number }> {
    try {
      // Get the original prediction
      const { data: prediction, error: fetchError } = await supabase
        .from('cyclone_formation_predictions')
        .select('*')
        .eq('prediction_id', predictionId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Calculate accuracy score using the database function
      const { data: accuracyResult, error: accuracyError } = await supabase
        .rpc('calculate_prediction_accuracy', {
          predicted_formation: prediction.expected_formation_date,
          actual_formation: actualFormationDate?.toISOString(),
          predicted_intensity: prediction.expected_intensity,
          actual_intensity: actualIntensity,
          prediction_probability: prediction.formation_probability
        });

      if (accuracyError) {
        return { success: false, error: accuracyError.message };
      }

      const accuracyScore = accuracyResult;

      // Update the prediction with verification data
      const { error: updateError } = await supabase
        .from('cyclone_formation_predictions')
        .update({
          is_verified: true,
          actual_formation_date: actualFormationDate?.toISOString(),
          actual_intensity: actualIntensity,
          accuracy_score: accuracyScore
        })
        .eq('prediction_id', predictionId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, accuracyScore };
    } catch (error) {
      console.error('Error verifying prediction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert stored prediction back to FormationPrediction format
   */
  static storedToFormationPrediction(stored: StoredPrediction): FormationPrediction {
    return {
      id: stored.prediction_id,
      location: {
        lat: stored.location_lat,
        lng: stored.location_lng
      },
      formationProbability: stored.formation_probability,
      timeToFormation: stored.time_to_formation,
      expectedFormationDate: new Date(stored.expected_formation_date),
      expectedFormationDateStr: stored.expected_formation_date,
      expectedIntensity: stored.expected_intensity as FormationPrediction['expectedIntensity'],
      confidence: stored.confidence,
      environmentalFactors: {
        seaTempFavorable: stored.sea_temp_favorable,
        lowWindShear: stored.low_wind_shear,
        sufficientMoisture: stored.sufficient_moisture,
        atmosphericInstability: stored.atmospheric_instability
      },
      region: stored.region,
      createdAt: new Date(stored.created_at)
    };
  }

  /**
   * Get accuracy metrics for a time period
   */
  static async getAccuracyMetrics(
    startDate: Date,
    endDate: Date,
    region?: string
  ): Promise<{ success: boolean; error?: string; data?: AccuracyMetrics[] }> {
    try {
      let query = supabase
        .from('prediction_accuracy_metrics')
        .select('*')
        .gte('period_start', startDate.toISOString())
        .lte('period_end', endDate.toISOString())
        .order('period_start', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching accuracy metrics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching accuracy metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}