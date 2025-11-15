/**
 * API endpoint for cyclone formation prediction
 * Predicts WHERE and WHEN new cyclones will form
 */

import { NextRequest, NextResponse } from 'next/server';
import { cycloneFormationPredictor } from '../../../lib/models/cycloneFormationPredictor';
import { CyclonePredictionStorage } from '../../../lib/models/cyclonePredictionStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse region parameters (default to Southwest Indian Ocean/Mauritius region)
    const minLat = parseFloat(searchParams.get('minLat') || '-30');
    const maxLat = parseFloat(searchParams.get('maxLat') || '-10');
    const minLng = parseFloat(searchParams.get('minLng') || '40');
    const maxLng = parseFloat(searchParams.get('maxLng') || '80');
    const forecastDays = parseInt(searchParams.get('days') || '7');
    
    const region = { minLat, maxLat, minLng, maxLng };
    
    console.log(`🌀 Generating cyclone formation forecast for region: ${minLat},${minLng} to ${maxLat},${maxLng}`);
    
    // Generate formation predictions
    const forecast = await cycloneFormationPredictor.predictFormation(region, forecastDays);
    
    // Save predictions to Supabase (temporarily disabled - database tables not set up)
    let savedCount = 0;
    let saveError = null;
    
    // TODO: Enable Supabase storage once database tables are created
    // Run the SQL schema in cyclone-prediction-schema.sql to enable storage
    /*
    if (forecast.predictions.length > 0) {
      const saveResult = await CyclonePredictionStorage.savePredictions(
        forecast.predictions,
        cycloneFormationPredictor.getModelInfo().loaded ? 'neural-network' : 'statistical',
        cycloneFormationPredictor.getModelInfo().loaded ? 'v1.0' : undefined
      );
      
      savedCount = saveResult.saved;
      saveError = saveResult.error;
      
      // Update prediction status
      const highProbCount = forecast.predictions.filter(p => p.formationProbability > 0.7).length;
      const regions = [...new Set(forecast.predictions.map(p => p.region))];
      
      await CyclonePredictionStorage.updatePredictionStatus(
        forecast.predictions.length,
        highProbCount,
        regions,
        saveError ? 'degraded' : 'healthy',
        saveError
      );
    }
    */
    
    // Add additional insights
    const insights = {
      hotspots: forecast.predictions.filter(p => p.formationProbability > 0.6),
      nearTermRisk: forecast.predictions.filter(p => p.timeToFormation < 72), // Next 3 days
      seasonalOutlook: forecast.overallActivity,
      recommendedActions: generateRecommendations(forecast),
      storage: {
        status: 'disabled',
        message: 'Database storage temporarily disabled - predictions working in memory',
        note: 'To enable: Run cyclone-prediction-schema.sql in Supabase'
      }
    };
    
    return NextResponse.json({
      success: true,
      forecast,
      insights,
      modelInfo: cycloneFormationPredictor.getModelInfo(),
      timestamp: new Date().toISOString(),
      message: `Generated ${forecast.predictions.length} formation predictions for ${forecastDays}-day forecast`,
      region: {
        name: getRegionName(region),
        bounds: region,
        gridPoints: Math.ceil((maxLat - minLat) / 0.5) * Math.ceil((maxLng - minLng) / 0.5)
      }
    });

  } catch (error) {
    console.error('❌ Formation prediction error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate cyclone formation predictions',
        message: error instanceof Error ? error.message : 'Unknown formation prediction error',
        modelInfo: cycloneFormationPredictor.getModelInfo()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region, forecastDays, environmentalData } = body;
    
    // Validate input
    if (!region || !region.minLat || !region.maxLat || !region.minLng || !region.maxLng) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid region parameters. Expected: { minLat, maxLat, minLng, maxLng }' 
        },
        { status: 400 }
      );
    }
    
    console.log(`🌀 Custom formation prediction for region:`, region);
    
    // Generate custom formation forecast
    const forecast = await cycloneFormationPredictor.predictFormation(
      region, 
      forecastDays || 7
    );
    
    // Save custom predictions to Supabase (temporarily disabled - database tables not set up)
    let savedCount = 0;
    let saveError = null;
    
    // TODO: Enable Supabase storage once database tables are created
    /*
    if (forecast.predictions.length > 0) {
      const saveResult = await CyclonePredictionStorage.savePredictions(
        forecast.predictions,
        cycloneFormationPredictor.getModelInfo().loaded ? 'neural-network' : 'statistical',
        cycloneFormationPredictor.getModelInfo().loaded ? 'v1.0-custom' : undefined
      );
      
      savedCount = saveResult.saved;
      saveError = saveResult.error;
    }
    */
    
    // Detailed analysis for custom requests
    const detailedAnalysis = {
      environmentalFactors: analyzeEnvironmentalConditions(forecast.predictions),
      formationTimeline: createFormationTimeline(forecast.predictions),
      riskAssessment: assessFormationRisk(forecast),
      confidenceMetrics: calculateConfidenceMetrics(forecast.predictions),
      storage: {
        status: 'disabled',
        message: 'Database storage temporarily disabled - predictions working in memory'
      }
    };
    
    return NextResponse.json({
      success: true,
      forecast,
      analysis: detailedAnalysis,
      modelInfo: cycloneFormationPredictor.getModelInfo(),
      timestamp: new Date().toISOString(),
      message: 'Custom cyclone formation analysis completed'
    });

  } catch (error) {
    console.error('❌ Custom formation prediction error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process custom formation prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on formation forecast
 */
function generateRecommendations(forecast: any): string[] {
  const recommendations: string[] = [];
  
  if (forecast.overallActivity === 'very-high' || forecast.overallActivity === 'high') {
    recommendations.push('🚨 Enhanced monitoring recommended - increased cyclone formation potential');
    recommendations.push('🛡️ Review emergency preparedness plans for coastal areas');
  }
  
  if (forecast.predictions.some((p: any) => p.timeToFormation < 72)) {
    recommendations.push('⏰ Near-term formation possible - monitor satellite imagery closely');
    recommendations.push('📡 Increase frequency of weather balloon releases');
  }
  
  if (forecast.predictions.some((p: any) => p.formationProbability > 0.7)) {
    recommendations.push('🎯 High-probability formation zones identified - focus resources');
  }
  
  if (forecast.predictions.length === 0) {
    recommendations.push('✅ Low formation risk - normal monitoring protocols sufficient');
  }
  
  return recommendations;
}

/**
 * Analyze environmental conditions across predictions
 */
function analyzeEnvironmentalConditions(predictions: any[]): any {
  if (predictions.length === 0) return null;
  
  const conditions = {
    favorableSeaTemp: predictions.filter(p => p.environmentalFactors.seaTempFavorable).length,
    lowWindShear: predictions.filter(p => p.environmentalFactors.lowWindShear).length,
    sufficientMoisture: predictions.filter(p => p.environmentalFactors.sufficientMoisture).length,
    atmosphericInstability: predictions.filter(p => p.environmentalFactors.atmosphericInstability).length
  };
  
  const total = predictions.length;
  
  return {
    ...conditions,
    percentages: {
      favorableSeaTemp: (conditions.favorableSeaTemp / total) * 100,
      lowWindShear: (conditions.lowWindShear / total) * 100,
      sufficientMoisture: (conditions.sufficientMoisture / total) * 100,
      atmosphericInstability: (conditions.atmosphericInstability / total) * 100
    }
  };
}

/**
 * Create formation timeline from predictions
 */
function createFormationTimeline(predictions: any[]): any[] {
  const timeline = [];
  const timeSlots = [24, 48, 72, 120, 168]; // 1, 2, 3, 5, 7 days
  
  for (const hours of timeSlots) {
    const formationsInPeriod = predictions.filter(p => p.timeToFormation <= hours);
    timeline.push({
      timeframe: `${hours}h`,
      count: formationsInPeriod.length,
      averageProbability: formationsInPeriod.length > 0 
        ? formationsInPeriod.reduce((sum, p) => sum + p.formationProbability, 0) / formationsInPeriod.length 
        : 0
    });
  }
  
  return timeline;
}

/**
 * Assess overall formation risk
 */
function assessFormationRisk(forecast: any): any {
  const highRisk = forecast.predictions.filter((p: any) => p.formationProbability > 0.6).length;
  const nearTerm = forecast.predictions.filter((p: any) => p.timeToFormation < 72).length;
  
  let riskLevel = 'low';
  if (highRisk >= 2 || nearTerm >= 3) riskLevel = 'high';
  else if (highRisk >= 1 || nearTerm >= 1) riskLevel = 'moderate';
  
  return {
    level: riskLevel,
    highProbabilityFormations: highRisk,
    nearTermFormations: nearTerm,
    totalPredictions: forecast.predictions.length
  };
}

/**
 * Calculate confidence metrics
 */
function calculateConfidenceMetrics(predictions: any[]): any {
  if (predictions.length === 0) return { average: 0, high: 0, moderate: 0, low: 0 };
  
  const confidences = predictions.map(p => p.confidence);
  const average = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  
  const high = predictions.filter(p => p.confidence > 0.7).length;
  const moderate = predictions.filter(p => p.confidence > 0.4 && p.confidence <= 0.7).length;
  const low = predictions.filter(p => p.confidence <= 0.4).length;
  
  return { average, high, moderate, low };
}

/**
 * Get region name for display
 */
function getRegionName(region: any): string {
  // Mauritius/Southwest Indian Ocean region
  if (region.minLat >= -30 && region.maxLat <= -10 && region.minLng >= 40 && region.maxLng <= 80) {
    return 'Southwest Indian Ocean (Mauritius Region)';
  }
  
  // Add more regions as needed
  return `Custom Region (${region.minLat}°S-${region.maxLat}°S, ${region.minLng}°E-${region.maxLng}°E)`;
}