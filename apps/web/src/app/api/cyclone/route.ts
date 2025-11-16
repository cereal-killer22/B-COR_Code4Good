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

    // Calculate wind-radius rings based on wind speed
    // Convert km/h to knots (1 km/h = 0.539957 knots)
    const maxWindKnots = maxWindSpeed * 0.539957;
    
    // Estimate wind radii (in km) based on wind speed
    // These are approximate values - real cyclone data would come from IBTrACS
    const windRadii = [];
    if (maxWindKnots >= 34) {
      windRadii.push({ speed: 34, radius: Math.max(50, maxWindKnots * 2) });
    }
    if (maxWindKnots >= 50) {
      windRadii.push({ speed: 50, radius: Math.max(30, maxWindKnots * 1.5) });
    }
    if (maxWindKnots >= 64) {
      windRadii.push({ speed: 64, radius: Math.max(20, maxWindKnots * 1.2) });
    }

    // Generate realistic forecast track based on pressure gradient and wind patterns
    // In the Southern Hemisphere, cyclones typically move west-southwest initially, then curve southeast
    const forecastTrack: [number, number][] = [[lng, lat]]; // Start at current location
    const forecastWidths: number[] = [20]; // Initial uncertainty
    
    // Calculate pressure gradient direction (cyclones move toward lower pressure)
    // Use pressure trend to determine movement direction
    const pressureTrend = pressureData.length > 1 
      ? pressureData[0] - pressureData[pressureData.length - 1]
      : 0;
    
    // Base direction: typical cyclone movement in Indian Ocean (west-southwest, then curving)
    // Adjust based on pressure gradient
    let baseBearing = 240; // West-southwest (240 degrees)
    
    // If pressure is dropping rapidly, cyclone is intensifying and may move faster
    if (pressureTrend < -5) {
      baseBearing += 10; // Slight southward shift
    } else if (pressureTrend > 5) {
      baseBearing -= 10; // Slight northward shift
    }
    
    // Calculate wind direction trend (cyclones typically move in direction of strongest winds)
    // Use pressure gradient to estimate steering flow direction
    let windDirectionInfluence = 0;
    if (pressureData.length > 2) {
      // Calculate pressure gradient direction
      const pressureGradient = pressureData[0] - pressureData[pressureData.length - 1];
      // In Southern Hemisphere, low pressure systems rotate clockwise
      // Movement is typically toward lower pressure with rightward deflection
      windDirectionInfluence = pressureGradient < -3 ? 15 : pressureGradient > 3 ? -15 : 0;
    }
    
    // Combine base bearing with wind/pressure influence (weighted)
    const adjustedBearing = (baseBearing + windDirectionInfluence) % 360;
    
    // Generate track points with realistic curvature
    const numForecastPoints = 6;
    const baseSpeed = maxWindKnots > 50 ? 25 : maxWindKnots > 34 ? 20 : 15; // km/h movement speed
    
    for (let i = 1; i <= numForecastPoints; i++) {
      const hoursAhead = i * 6; // 6-hour intervals
      const distance = (baseSpeed * hoursAhead) / 111; // Convert km to degrees
      
      // Apply curvature: cyclones in Southern Hemisphere curve to the right (southeast)
      const curvature = i * 2; // Degrees of curvature per point
      const currentBearing = (adjustedBearing + curvature) * Math.PI / 180;
      
      const latOffset = distance * Math.cos(currentBearing);
      const lngOffset = distance * Math.sin(currentBearing) / Math.cos(lat * Math.PI / 180);
      
      const nextLat = forecastTrack[forecastTrack.length - 1][1] + latOffset;
      const nextLng = forecastTrack[forecastTrack.length - 1][0] + lngOffset;
      
      // Ensure we stay within reasonable bounds for Mauritius region
      if (nextLat >= -20.8 && nextLat <= -19.8 && nextLng >= 57.0 && nextLng <= 57.9) {
        forecastTrack.push([nextLng, nextLat]);
        // Uncertainty increases with time (cone widens)
        forecastWidths.push(20 + i * 8 + (i * 2));
      } else {
        break; // Stop if track goes outside reasonable bounds
      }
    }
    
    // If we have a valid track, add it; otherwise use simplified straight-line
    if (forecastTrack.length < 2) {
      // Fallback: simple straight-line track
      const simpleBearing = adjustedBearing * Math.PI / 180;
      for (let i = 1; i <= 5; i++) {
        const distance = (i * 30) / 111;
        const latOffset = distance * Math.cos(simpleBearing);
        const lngOffset = distance * Math.sin(simpleBearing) / Math.cos(lat * Math.PI / 180);
        forecastTrack.push([lng + lngOffset, lat + latOffset]);
        forecastWidths.push(25 + i * 8);
      }
    }

    return NextResponse.json({
      location: { lat, lon: lng },
      observations: {
        minPressure,
        maxWindSpeed,
        maxWindKnots,
        pressureData: pressureData.slice(0, 6),
        windData: windData.slice(0, 6),
      },
      windRadii,
      forecastTrack,
      forecastWidths,
      prediction,
      timestamp: new Date().toISOString(),
      dataSource: 'real-time',
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

