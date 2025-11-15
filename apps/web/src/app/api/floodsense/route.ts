/**
 * FloodSense Prediction API Route
 * Fetches real-time precipitation data from Open-Meteo
 * Returns flood risk prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { floodRiskFromPrecip } from '@/lib/predictors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    // Fetch hourly precipitation data from Open-Meteo
    // Open-Meteo requires multiple query params for daily/hourly variables (not comma-separated)
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('forecast_days', '3');
    
    // Add hourly parameters separately (multi-value)
    url.searchParams.append('hourly', 'precipitation');
    url.searchParams.append('hourly', 'soil_moisture_0_to_10cm');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClimaGuard/1.0'
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const hourly = data.hourly;

    if (!hourly || !hourly.precipitation) {
      throw new Error('Invalid data structure from Open-Meteo');
    }

    // Calculate 24h and 72h precipitation totals
    const precip24h = hourly.precipitation.slice(0, 24).reduce((sum: number, val: number) => sum + (val || 0), 0);
    const precip72h = hourly.precipitation.slice(0, 72).reduce((sum: number, val: number) => sum + (val || 0), 0);

    // Get hourly precipitation for intensity layer (next 24 hours)
    const hourlyPrecip24h = hourly.precipitation.slice(0, 24);
    const hourlyPrecip72h = hourly.precipitation.slice(0, 72);

    // Get soil moisture if available
    const soilMoisture = hourly.soil_moisture_0_to_10cm?.[0];

    // Get prediction
    const prediction = floodRiskFromPrecip(precip24h, precip72h, soilMoisture);

    // Calculate forecast precipitation (24h and 72h ahead)
    const forecast24h = hourly.precipitation.slice(24, 48).reduce((sum: number, val: number) => sum + (val || 0), 0);
    const forecast72h = hourly.precipitation.slice(24, 96).reduce((sum: number, val: number) => sum + (val || 0), 0);

    return NextResponse.json({
      location: { lat, lon: lng },
      rainfall: {
        precip24h,
        precip72h,
        forecast24h,
        forecast72h,
        soilMoisture,
        hourlyPrecip: hourly.precipitation.slice(0, 24), // Current/real-time hourly
        hourlyPrecip24h, // Next 24 hours hourly
        hourlyPrecip72h, // Next 72 hours hourly
        currentIntensity: hourly.precipitation[0] || 0 // Current hour intensity
      },
      prediction,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching flood prediction:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch flood prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

