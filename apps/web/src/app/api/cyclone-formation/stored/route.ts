/**
 * API endpoint for retrieving stored cyclone formation predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CyclonePredictionStorage } from '../../../../lib/models/cyclonePredictionStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const hours = parseInt(searchParams.get('hours') || '24');
    const region = searchParams.get('region') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    console.log(`📊 Retrieving stored predictions: hours=${hours}, region=${region}, activeOnly=${activeOnly}`);
    
    let result;
    
    if (activeOnly) {
      result = await CyclonePredictionStorage.getActivePredictions(region);
    } else {
      result = await CyclonePredictionStorage.getRecentPredictions(hours, region);
    }
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          message: 'Failed to retrieve stored predictions'
        },
        { status: 500 }
      );
    }
    
    // Convert stored predictions back to FormationPrediction format
    const predictions = result.data?.map(stored => 
      CyclonePredictionStorage.storedToFormationPrediction(stored)
    ) || [];
    
    // Get current system status
    const statusResult = await CyclonePredictionStorage.getCurrentStatus();
    
    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length,
      systemStatus: statusResult.data,
      filters: {
        hours,
        region,
        activeOnly
      },
      timestamp: new Date().toISOString(),
      message: `Retrieved ${predictions.length} stored predictions`
    });

  } catch (error) {
    console.error('❌ Error retrieving stored predictions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve stored predictions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, predictionId, actualFormationDate, actualIntensity } = body;
    
    if (action === 'verify') {
      // Verify a prediction with actual outcome
      if (!predictionId) {
        return NextResponse.json(
          { success: false, error: 'predictionId is required for verification' },
          { status: 400 }
        );
      }
      
      const formationDate = actualFormationDate ? new Date(actualFormationDate) : undefined;
      const intensity = actualIntensity || 'no-formation';
      
      const result = await CyclonePredictionStorage.verifyPrediction(
        predictionId,
        formationDate,
        intensity
      );
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Prediction verified successfully',
        accuracyScore: result.accuracyScore,
        predictionId,
        actualFormationDate,
        actualIntensity: intensity
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Supported actions: verify' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error processing stored prediction request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}