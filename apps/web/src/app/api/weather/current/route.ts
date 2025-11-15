/**
 * Current Weather API Route
 * Returns real-time weather data from Open-Meteo
 */

import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/integrations/weather';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');

    const weatherService = new WeatherService();
    const weather = await weatherService.getCurrentWeather(lat, lng);

    return NextResponse.json({
      weather,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch real-time weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

