/**
 * Cyclone Prediction API Route
 * Fetches real-time pressure and wind data from Open-Meteo
 * Returns cyclone risk prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { cycloneRiskFromObservations } from '@/lib/predictors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    // Fetch hourly pressure and wind data from Open-Meteo
    // Open-Meteo requires multiple query params for daily/hourly variables (not comma-separated)
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('forecast_days', '3');
    
    // Add hourly parameters separately (multi-value)
    url.searchParams.append('hourly', 'pressure_msl');
    url.searchParams.append('hourly', 'windspeed_10m');

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

    if (!hourly || !hourly.pressure_msl || !hourly.windspeed_10m) {
      throw new Error('Invalid data structure from Open-Meteo');
    }

    // Get last 24 hours of data (or available data if less)
    const pressureData = hourly.pressure_msl.slice(0, 24);
    const windData = hourly.windspeed_10m.slice(0, 24);

    // Calculate min pressure and max wind (convert m/s to km/h)
    const minPressure = Math.min(...pressureData);
    const maxWindSpeedMs = Math.max(...windData);
    const maxWindSpeed = maxWindSpeedMs * 3.6; // Convert m/s to km/h

    // Get prediction
    const prediction = cycloneRiskFromObservations(minPressure, maxWindSpeed);

    return NextResponse.json({
      location: { lat, lon: lng },
      observations: {
        minPressure,
        maxWindSpeed,
        pressureData: pressureData.slice(0, 6), // Return first 6 hours for reference
        windData: windData.slice(0, 6)
      },
      prediction,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching cyclone prediction:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cyclone prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

