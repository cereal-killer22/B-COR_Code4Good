import { NextRequest, NextResponse } from 'next/server';
import { floodCNN, FloodRiskInput } from '@/lib/models/browserModels';
import { dataPipeline } from '@/lib/dataPipeline';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '25.7617');
    const lng = parseFloat(searchParams.get('lng') || '-80.1918'); // Miami default
    const radius = parseFloat(searchParams.get('radius') || '0.1'); // 0.1 degrees ~11km
    
    // Fetch real-time flood data for the region
    const floodData = await dataPipeline.fetchFloodData({ lat, lng }, radius);
    
    if (floodData.length === 0) {
      return NextResponse.json({
        message: 'No flood risk data available for this location',
        predictions: [],
        timestamp: new Date().toISOString(),
        modelInfo: floodCNN.getModelInfo()
      });
    }

    // Generate CNN-based flood predictions
    const floodPrediction = await floodCNN.predictGrid(floodData);

    return NextResponse.json({
      prediction: floodPrediction,
      modelInfo: floodCNN.getModelInfo(),
      timestamp: new Date().toISOString(),
      message: `CNN flood risk analysis completed for ${floodData.length} grid points`,
      dataSource: 'USGS + NASA + OpenWeather',
      location: { lat, lng, radius }
    });

  } catch (error) {
    console.error('FloodCNN API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate CNN flood predictions',
        message: 'Neural network model temporarily unavailable',
        modelInfo: floodCNN.getModelInfo()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { floodInputs } = body;

    // Validate input data
    if (!floodInputs || !Array.isArray(floodInputs)) {
      return NextResponse.json(
        { error: 'Invalid input format. Expected { floodInputs: FloodRiskInput[] }' },
        { status: 400 }
      );
    }

    // Validate each flood input
    const validInputs = floodInputs.filter((input: any) => 
      input.coordinates?.lat && input.coordinates?.lng && 
      typeof input.elevation === 'number' && 
      typeof input.rainfall === 'number'
    );

    if (validInputs.length === 0) {
      return NextResponse.json(
        { error: 'No valid flood risk inputs found' },
        { status: 400 }
      );
    }

    // Generate CNN-based flood predictions
    const prediction = await floodCNN.predictGrid(validInputs);

    return NextResponse.json({
      prediction,
      modelInfo: floodCNN.getModelInfo(),
      inputPoints: validInputs.length,
      timestamp: new Date().toISOString(),
      message: 'Custom flood risk analysis completed using CNN model'
    });

  } catch (error) {
    console.error('Custom flood analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process flood analysis request',
        message: 'Invalid input parameters' 
      },
      { status: 400 }
    );
  }
}