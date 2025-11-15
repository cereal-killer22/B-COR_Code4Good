/**
 * Daily Weather Forecast API Route
 * Returns 7-day forecast from Open-Meteo
 */

import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/integrations/weather';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    const days = parseInt(searchParams.get('days') || '7');

    const weatherService = new WeatherService();
    const forecast = await weatherService.getDailyForecast(lat, lng, days);

    return NextResponse.json({
      forecast,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time'
    });

  } catch (error) {
    console.error('Error fetching daily forecast:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch daily forecast',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

