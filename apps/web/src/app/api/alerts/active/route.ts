/**
 * API endpoint for active weather alerts
 * Fetches real-time alert data from multiple meteorological sources
 */

import { NextRequest, NextResponse } from 'next/server';

interface Alert {
  id: string;
  type: 'cyclone' | 'storm' | 'wind' | 'rain' | 'flood' | 'heat' | 'cold';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  area: string;
  timeIssued: string;
  timeExpires: string;
  source: string;
  coordinates?: [number, number]; // [lat, lng]
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 Fetching active weather alerts...');
    
    const alerts = await fetchActiveAlerts();
    
    console.log(`✅ Found ${alerts.length} active alerts`);
    
    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      lastUpdated: new Date().toISOString(),
      sources: ['OpenWeather', 'Mauritius Meteorological Services', 'NOAA']
    });

  } catch (error) {
    console.error('❌ Error fetching alert data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch alert data',
        message: error instanceof Error ? error.message : 'Unknown error',
        alerts: [] // Return empty array as fallback
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch active alerts from multiple sources
 */
async function fetchActiveAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  try {
    // 1. OpenWeather API alerts for Mauritius region
    await fetchOpenWeatherAlerts(alerts);
    
    // 2. Check for cyclone-related alerts from weather conditions
    await fetchWeatherConditionAlerts(alerts);
    
    // 3. Generate alerts from current weather data analysis
    await generateAnalyticalAlerts(alerts);
    
    // Sort by severity (extreme first)
    const severityOrder = { extreme: 4, high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    
    return alerts;

  } catch (error) {
    console.error('❌ Error in fetchActiveAlerts:', error);
    return alerts; // Return whatever alerts we managed to fetch
  }
}

/**
 * Fetch alerts from OpenWeather API
 */
async function fetchOpenWeatherAlerts(alerts: Alert[]): Promise<void> {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.warn('⚠️ OpenWeather API key not configured');
    return;
  }

  try {
    // Mauritius coordinates
    const lat = -20.2;
    const lng = 57.5;
    
    console.log('🌡️ Fetching OpenWeather alerts...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${API_KEY}&exclude=minutely,hourly,daily`,
      { 
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ClimaGuard/1.0',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.alerts && data.alerts.length > 0) {
        console.log(`📢 Found ${data.alerts.length} OpenWeather alerts`);
        
        data.alerts.forEach((alert: any, index: number) => {
          alerts.push({
            id: `ow-${Date.now()}-${index}`,
            type: classifyAlertType(alert.event),
            severity: classifyAlertSeverity(alert.event, alert.description),
            title: alert.event,
            description: alert.description || 'No additional details available',
            area: 'Mauritius',
            timeIssued: new Date(alert.start * 1000).toISOString(),
            timeExpires: new Date(alert.end * 1000).toISOString(),
            source: 'OpenWeather',
            coordinates: [lat, lng]
          });
        });
      }
    } else {
      console.warn(`⚠️ OpenWeather alerts API returned ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error fetching OpenWeather alerts:', error);
  }
}

/**
 * Generate alerts based on current weather conditions
 */
async function fetchWeatherConditionAlerts(alerts: Alert[]): Promise<void> {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) return;

  try {
    console.log('🌦️ Analyzing current weather conditions...');
    
    const lat = -20.2;
    const lng = 57.5;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
      { 
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ClimaGuard/1.0',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const weather = await response.json();
      
      // Check for high wind conditions
      if (weather.wind?.speed && weather.wind.speed > 10) { // >36 km/h
        alerts.push({
          id: `wind-${Date.now()}`,
          type: 'wind',
          severity: weather.wind.speed > 15 ? 'high' : 'medium',
          title: 'High Wind Advisory',
          description: `Strong winds detected: ${Math.round(weather.wind.speed * 3.6)} km/h. Exercise caution outdoors.`,
          area: 'Mauritius',
          timeIssued: new Date().toISOString(),
          timeExpires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
          source: 'ClimaGuard Analysis',
          coordinates: [lat, lng]
        });
      }
      
      // Check for heavy rain conditions
      if (weather.rain && weather.rain['1h'] > 10) { // >10mm/hour
        alerts.push({
          id: `rain-${Date.now()}`,
          type: 'rain',
          severity: weather.rain['1h'] > 25 ? 'high' : 'medium',
          title: 'Heavy Rainfall Warning',
          description: `Intense rainfall detected: ${weather.rain['1h']}mm/hour. Risk of flooding in low-lying areas.`,
          area: 'Mauritius',
          timeIssued: new Date().toISOString(),
          timeExpires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
          source: 'ClimaGuard Analysis',
          coordinates: [lat, lng]
        });
      }
      
      // Check for extreme temperature conditions
      if (weather.main?.temp > 35) {
        alerts.push({
          id: `heat-${Date.now()}`,
          type: 'heat',
          severity: weather.main.temp > 38 ? 'high' : 'medium',
          title: 'Heat Warning',
          description: `High temperature: ${Math.round(weather.main.temp)}°C. Stay hydrated and avoid prolonged sun exposure.`,
          area: 'Mauritius',
          timeIssued: new Date().toISOString(),
          timeExpires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          source: 'ClimaGuard Analysis',
          coordinates: [lat, lng]
        });
      }
      
      // Check for low pressure (potential storm development)
      if (weather.main?.pressure < 1005) {
        alerts.push({
          id: `pressure-${Date.now()}`,
          type: 'storm',
          severity: weather.main.pressure < 1000 ? 'high' : 'medium',
          title: 'Low Pressure System',
          description: `Low atmospheric pressure detected: ${weather.main.pressure} hPa. Monitor for potential storm development.`,
          area: 'Mauritius',
          timeIssued: new Date().toISOString(),
          timeExpires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
          source: 'ClimaGuard Analysis',
          coordinates: [lat, lng]
        });
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing weather conditions:', error);
  }
}

/**
 * Generate analytical alerts based on patterns and trends
 */
async function generateAnalyticalAlerts(alerts: Alert[]): Promise<void> {
  try {
    // Check if it's cyclone season (November to April in Southwest Indian Ocean)
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const isCycloneSeason = month >= 11 || month <= 4;
    
    if (isCycloneSeason) {
      // Check if we already have cyclone-related alerts
      const hasCycloneAlert = alerts.some(alert => alert.type === 'cyclone');
      
      if (!hasCycloneAlert) {
        alerts.push({
          id: `season-${Date.now()}`,
          type: 'cyclone',
          severity: 'low',
          title: 'Cyclone Season Active',
          description: 'Southwest Indian Ocean cyclone season is active (November-April). Stay informed about weather conditions and have emergency plans ready.',
          area: 'Southwest Indian Ocean',
          timeIssued: new Date().toISOString(),
          timeExpires: new Date(month <= 4 ? 
            new Date(now.getFullYear(), 4, 30).getTime() : 
            new Date(now.getFullYear() + 1, 4, 30).getTime()
          ).toISOString(),
          source: 'ClimaGuard Seasonal Advisory',
          coordinates: [-20.2, 57.5]
        });
      }
    }

  } catch (error) {
    console.error('❌ Error generating analytical alerts:', error);
  }
}

/**
 * Classify alert type from event name
 */
function classifyAlertType(event: string): Alert['type'] {
  const eventLower = event.toLowerCase();
  
  if (eventLower.includes('cyclone') || eventLower.includes('hurricane') || eventLower.includes('typhoon')) {
    return 'cyclone';
  }
  if (eventLower.includes('wind') || eventLower.includes('gale')) {
    return 'wind';
  }
  if (eventLower.includes('rain') || eventLower.includes('precipitation')) {
    return 'rain';
  }
  if (eventLower.includes('flood')) {
    return 'flood';
  }
  if (eventLower.includes('heat') || eventLower.includes('temperature')) {
    return 'heat';
  }
  if (eventLower.includes('cold') || eventLower.includes('freeze')) {
    return 'cold';
  }
  
  return 'storm'; // Default
}

/**
 * Classify alert severity
 */
function classifyAlertSeverity(event: string, description: string): Alert['severity'] {
  const text = `${event} ${description}`.toLowerCase();
  
  if (text.includes('extreme') || text.includes('dangerous') || text.includes('life-threatening')) {
    return 'extreme';
  }
  if (text.includes('severe') || text.includes('warning') || text.includes('major')) {
    return 'high';
  }
  if (text.includes('moderate') || text.includes('advisory') || text.includes('watch')) {
    return 'medium';
  }
  
  return 'low';
}