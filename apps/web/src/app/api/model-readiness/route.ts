/**
 * Model readiness API endpoint
 * Check model status and initialize if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { modelInitializer } from '../../../lib/training/smartInitializer';

export async function GET() {
  try {
    // Get current model readiness status
    const readiness = await modelInitializer.getModelReadiness();
    
    return NextResponse.json({
      success: true,
      readiness,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking model readiness:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      readiness: {
        isReady: false,
        hasTrained: false,
        needsTraining: true,
        statusMessage: 'Error checking model status'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'initialize':
        console.log('🚀 Manual model initialization requested');
        await modelInitializer.initializeModels();
        
        const readiness = await modelInitializer.getModelReadiness();
        return NextResponse.json({
          success: true,
          message: 'Models initialized successfully',
          readiness,
          timestamp: new Date().toISOString()
        });

      case 'start_continuous_learning':
        console.log('🔄 Starting continuous learning');
        await modelInitializer.startContinuousLearning();
        
        return NextResponse.json({
          success: true,
          message: 'Continuous learning started',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: initialize or start_continuous_learning'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Model initialization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}