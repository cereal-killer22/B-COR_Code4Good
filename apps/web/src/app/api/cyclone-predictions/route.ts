import { NextRequest, NextResponse } from 'next/server';
import { cycloneLSTM, CycloneDataPoint } from '@/lib/models/browserModels';
import { dataPipeline } from '@/lib/dataPipeline';

// Sample active cyclone data (in production, this would come from real-time feeds)
const activeCyclones = [
  {
    id: 'AL142023',
    name: 'TAMMY',
    currentPosition: { lat: 25.4, lng: -65.2 },
    intensity: 'Category 2',
    windSpeed: 105, // kt
    pressure: 970, // hPa
    movement: { direction: 'NNE', speed: 12 },
    status: 'active'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursAhead = parseInt(searchParams.get('hours') || '72');
    
    // Fetch real-time cyclone data for Southwest Indian Ocean (Mauritius region)
    // Mauritius: -20.348404, 57.552152 (expand region for cyclone tracking)
    const region = { 
      minLat: -30,   // South of Mauritius 
      maxLat: -10,   // North of Mauritius
      minLng: 40,    // West of Mauritius  
      maxLng: 80     // East of Mauritius
    };
    const historicalData = await dataPipeline.fetchCycloneData(region);
    
    if (historicalData.length < 24) {
      return NextResponse.json({
        message: 'Insufficient historical data for ML prediction',
        cyclones: [],
        timestamp: new Date().toISOString(),
        modelInfo: cycloneLSTM.getModelInfo()
      });
    }

    // Get predictions using LSTM model
    const predictions = await Promise.all(
      activeCyclones.map(async (cyclone) => {
        try {
          const prediction = await cycloneLSTM.predict(historicalData);
          return {
            cycloneId: cyclone.id,
            cycloneName: cyclone.name,
            currentStatus: cyclone,
            prediction,
            modelInfo: cycloneLSTM.getModelInfo()
          };
        } catch (error) {
          console.error(`Error predicting ${cyclone.name}:`, error);
          return null;
        }
      })
    );

    const validPredictions = predictions.filter(p => p !== null);

    return NextResponse.json({
      predictions: validPredictions,
      modelInfo: cycloneLSTM.getModelInfo(),
      timestamp: new Date().toISOString(),
      message: `Generated LSTM predictions for ${validPredictions.length} active cyclone(s)`,
      dataSource: 'IBTrACS + NASA GPM + NOAA',
      confidence: validPredictions.length > 0 ? 
        validPredictions.reduce((sum, p) => sum + (p?.prediction.confidence || 0), 0) / validPredictions.length : 0
    });

  } catch (error) {
    console.error('CycloneLSTM API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate LSTM cyclone predictions',
        message: 'Neural network model temporarily unavailable',
        modelInfo: cycloneLSTM.getModelInfo()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cycloneData, hoursAhead } = body;

    // Validate input data
    if (!cycloneData || !Array.isArray(cycloneData.historicalPoints)) {
      return NextResponse.json(
        { error: 'Invalid cyclone data format. Expected { historicalPoints: CycloneDataPoint[] }' },
        { status: 400 }
      );
    }

    // Ensure we have enough historical data points
    if (cycloneData.historicalPoints.length < 24) {
      return NextResponse.json(
        { error: 'Need at least 24 hours of historical cyclone data for LSTM prediction' },
        { status: 400 }
      );
    }

    // Generate prediction using real LSTM model
    const prediction = await cycloneLSTM.predict(cycloneData.historicalPoints);

    return NextResponse.json({
      prediction,
      modelInfo: cycloneLSTM.getModelInfo(),
      inputDataPoints: cycloneData.historicalPoints.length,
      timestamp: new Date().toISOString(),
      message: 'Custom cyclone prediction generated using LSTM neural network'
    });

  } catch (error) {
    console.error('Custom CycloneLSTM Prediction Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process custom cyclone prediction',
        message: error instanceof Error ? error.message : 'Unknown neural network error',
        modelInfo: cycloneLSTM.getModelInfo()
      },
      { status: 500 }
    );
  }
}