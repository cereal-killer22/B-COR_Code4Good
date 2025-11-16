import { NextRequest, NextResponse } from 'next/server';
import { WeatherDataPipeline } from '@/lib/dataPipeline';
import { floodCNN } from '@/lib/models/floodCNN';
import FloodPredictionStorage from '@/lib/models/floodPredictionStorage';

/**
 * Generate flood predictions across Mauritius and store them in Supabase
 * - Grid bounds are tuned for Mauritius
 */
export async function GET(request: NextRequest) {
  try {
    // Mauritius bounding box (approx)
    const minLat = -20.6;
    const maxLat = -19.9;
    const minLng = 57.2;
    const maxLng = 57.9;

    // Grid resolution in degrees (~0.02 ~ ~2.2km)
    const latStep = 0.02;
    const lngStep = 0.02;

    const pipeline = new WeatherDataPipeline();

    const allPoints: Array<{ lat: number; lng: number; risk: any }> = [];

    // Iterate grid and produce predictions
    for (let lat = minLat; lat <= maxLat; lat += latStep) {
      for (let lng = minLng; lng <= maxLng; lng += lngStep) {
        // Fetch flood inputs for this cell (small radius)
        const inputs = await pipeline.fetchFloodData({ lat, lng }, 0.02);

        // If no inputs returned, create a minimal input for the cell
        const cellInputs = (inputs && inputs.length > 0) ? inputs : [{
          coordinates: { lat, lng },
          elevation: 10,
          rainfall: 0,
          riverLevel: 0,
          soilSaturation: 20,
          urbanization: 30,
          drainageCapacity: 0.5,
          historicalFlooding: false
        }];

        // Run CNN grid prediction for this small cell
        // Skip CNN since it fails on server - use deterministic heuristic instead
        const prediction = {
          gridPredictions: cellInputs.map(inp => {
            // Deterministic heuristic based on rainfall and elevation
            const rainFactor = inp.rainfall / 100; // 0-1 scale
            const elevationFactor = Math.max(0, (50 - inp.elevation) / 50); // Lower elevation = higher risk
            const soilFactor = inp.soilSaturation / 100;
            
            // Combined risk score
            const riskScore = (rainFactor * 0.5) + (elevationFactor * 0.3) + (soilFactor * 0.2);
            
            let riskLevel = 'low';
            if (riskScore > 0.7) riskLevel = 'high';
            else if (riskScore > 0.5) riskLevel = 'medium';
            else if (riskScore > 0.3) riskLevel = 'moderate';
            
            return {
              lat: inp.coordinates.lat,
              lng: inp.coordinates.lng,
              risk: {
                riskLevel,
                probability: Math.min(0.95, riskScore),
                estimatedDepth: Math.max(0, riskScore * 2), // 0-2 meters
                timeToFlood: riskScore > 0.6 ? Math.floor(4 - riskScore * 2) : -1,
                confidence: 0.75,
                riskFactors: [
                  ...(rainFactor > 0.5 ? ['high_rainfall'] : []),
                  ...(elevationFactor > 0.5 ? ['low_elevation'] : []),
                  ...(soilFactor > 0.5 ? ['saturated_soil'] : [])
                ]
              }
            };
          }),
          evacuationZones: [],
          confidence: 0.75,
          modelVersion: 'heuristic-v1',
          lastUpdated: new Date().toISOString()
        };

        // Collect grid points
        for (const gp of prediction.gridPredictions) {
          allPoints.push({ lat: gp.lat, lng: gp.lng, risk: gp.risk });
        }
      }
    }

    // Save all points to Supabase
    const saveResult = await FloodPredictionStorage.saveGridPoints(allPoints, 'heuristic-v1', 'heuristic');

    return NextResponse.json({ 
      success: saveResult.success, 
      saved: saveResult.saved || 0, 
      points: allPoints.length,
      message: `Generated ${allPoints.length} predictions using deterministic heuristic model`
    });

  } catch (error) {
    console.error('Error generating flood predictions:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
