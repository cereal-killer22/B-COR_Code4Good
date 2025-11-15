/**
 * API endpoint for cyclone prediction model training
 */

import { NextRequest, NextResponse } from 'next/server';
import { cycloneTrainer } from '../../../lib/training/cycloneTrainer';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start_training':
        console.log('🚀 Manual training initiated via API');
        await cycloneTrainer.trainModel();
        return NextResponse.json({ 
          success: true, 
          message: 'Model training completed successfully',
          timestamp: new Date().toISOString()
        });

      case 'start_continuous_learning':
        console.log('🔄 Starting continuous learning system');
        cycloneTrainer.startContinuousLearning();
        return NextResponse.json({ 
          success: true, 
          message: 'Continuous learning system activated',
          timestamp: new Date().toISOString()
        });

      case 'get_training_status':
        const stats = cycloneTrainer.getTrainingStats();
        return NextResponse.json({ 
          success: true, 
          stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: start_training, start_continuous_learning, or get_training_status' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Training API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = cycloneTrainer.getTrainingStats();
    return NextResponse.json({ 
      success: true, 
      stats,
      message: 'Training system status retrieved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting training status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}