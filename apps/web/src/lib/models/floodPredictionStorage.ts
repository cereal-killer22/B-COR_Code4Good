import { createClient } from '@supabase/supabase-js';
import type { FloodPrediction } from './floodCNN';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface StoredFloodPoint {
  id?: string;
  prediction_id?: string;
  created_at?: string;
  location_lat: number;
  location_lng: number;
  risk_level: string;
  probability: number;
  estimated_depth: number;
  time_to_flood: number;
  confidence: number;
  risk_factors: any; // JSON
  model_version?: string;
  prediction_method?: string;
}

export class FloodPredictionStorage {
  static async saveGridPoints(
    points: Array<{ lat: number; lng: number; risk: any }>,
    modelVersion: string = 'CNN-v1.0',
    method: string = 'cnn'
  ): Promise<{ success: boolean; saved?: number; error?: string }> {
    try {
      if (!points || points.length === 0) {
        return { success: true, saved: 0 };
      }

      // Map to rows compatible with Supabase table `flood_risk_predictions`
      const rows = points.map((p, idx) => ({
        prediction_id: `flood-${Date.now()}-${idx}`,
        location_lat: p.lat,
        location_lng: p.lng,
        risk_level: p.risk.riskLevel || p.risk.risk_level || 'unknown',
        probability: p.risk.probability ?? 0,
        estimated_depth: p.risk.estimatedDepth ?? 0,
        time_to_flood: p.risk.timeToFlood ?? -1,
        confidence: p.risk.confidence ?? 0,
        risk_factors: p.risk.riskFactors || p.risk.risk_factors || [],
        model_version: modelVersion,
        prediction_method: method,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('flood_risk_predictions')
        .insert(rows)
        .select();

      if (error) {
        console.error('Error inserting flood predictions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, saved: (data || []).length };
    } catch (err) {
      console.error('FloodPredictionStorage.saveGridPoints error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }

  static async getRecentPredictions(hours: number = 24): Promise<{ success: boolean; data?: StoredFloodPoint[]; error?: string }> {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hours);

      const { data, error } = await supabase
        .from('flood_risk_predictions')
        .select('*')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stored flood predictions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as StoredFloodPoint[] };
    } catch (err) {
      console.error('FloodPredictionStorage.getRecentPredictions error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }
}

export default FloodPredictionStorage;
