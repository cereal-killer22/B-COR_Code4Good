import { NextRequest, NextResponse } from 'next/server';
import type { RainfallGrid } from '@/lib/types/weather';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.2');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('forecast_days', '1');
    url.searchParams.append('hourly', 'precipitation');
    
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 }
    });
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    const hourly = data.hourly;
    
    if (!hourly || !hourly.precipitation) {
      throw new Error('Invalid data structure from Open-Meteo');
    }
    
    const points: Array<{ lat: number; lon: number; value: number }> = [];
    const gridSize = 0.1;
    
    for (let i = 0; i < 24; i++) {
      const precip = hourly.precipitation[i] || 0;
      if (precip > 0) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            points.push({
              lat: lat + dx * gridSize,
              lon: lng + dy * gridSize,
              value: precip
            });
          }
        }
      }
    }
    
    const grid: RainfallGrid = {
      timestamp: new Date().toISOString(),
      points: points
    };
    
    return NextResponse.json(grid);
  } catch (error) {
    console.error('Error fetching current rainfall:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rainfall data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

