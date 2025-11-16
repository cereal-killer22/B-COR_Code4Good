import { NextResponse } from 'next/server';
import FloodPredictionStorage from '@/lib/models/floodPredictionStorage';

/**
 * Quick test endpoint to verify Supabase storage is working
 */
export async function GET() {
  try {
    // Create a few test points
    const testPoints = [
      {
        lat: -20.16,
        lng: 57.50,
        risk: {
          riskLevel: 'medium',
          probability: 0.65,
          estimatedDepth: 0.8,
          timeToFlood: 6,
          confidence: 0.75,
          riskFactors: ['high_rainfall', 'low_elevation']
        }
      },
      {
        lat: -20.20,
        lng: 57.55,
        risk: {
          riskLevel: 'low',
          probability: 0.25,
          estimatedDepth: 0.2,
          timeToFlood: -1,
          confidence: 0.8,
          riskFactors: []
        }
      },
      {
        lat: -20.30,
        lng: 57.60,
        risk: {
          riskLevel: 'high',
          probability: 0.85,
          estimatedDepth: 1.5,
          timeToFlood: 3,
          confidence: 0.7,
          riskFactors: ['high_rainfall', 'river_proximity', 'poor_drainage']
        }
      }
    ];

    // Save test points
    const result = await FloodPredictionStorage.saveGridPoints(
      testPoints,
      'test-v1.0',
      'test'
    );

    return NextResponse.json({
      success: result.success,
      saved: result.saved,
      error: result.error,
      testPoints: testPoints.length
    });
  } catch (error) {
    console.error('Test storage error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
