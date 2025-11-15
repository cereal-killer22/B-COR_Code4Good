/**
 * Pollution Events API Route
 * Returns list of pollution events
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PollutionEvent } from '@climaguard/shared/types/ocean';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '1.0');
    const status = searchParams.get('status'); // Filter by status
    
    // Fetch pollution events (would query database in production)
    const events = await fetchPollutionEvents(
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radius,
      status as PollutionEvent['status'] | null
    );
    
    return NextResponse.json({
      events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching pollution events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pollution events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event: Partial<PollutionEvent> = body;
    
    // Validate required fields
    if (!event.type || !event.location || !event.severity) {
      return NextResponse.json(
        { error: 'Missing required fields: type, location, severity' },
        { status: 400 }
      );
    }
    
    // Create new pollution event (would save to database in production)
    const newEvent: PollutionEvent = {
      id: `pollution-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      type: event.type,
      location: event.location,
      severity: event.severity,
      detectedAt: event.detectedAt ? new Date(event.detectedAt) : new Date(),
      affectedArea: event.affectedArea || 0,
      predictedSpread: event.predictedSpread || [],
      source: event.source,
      status: event.status || 'detected'
    };
    
    // In production: await db.insert('pollution_events').values(newEvent);
    
    return NextResponse.json({
      event: newEvent,
      message: 'Pollution event created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating pollution event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create pollution event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchPollutionEvents(
  lat?: number,
  lng?: number,
  radius: number = 1.0,
  status?: PollutionEvent['status'] | null
): Promise<PollutionEvent[]> {
  // Fetch real pollution events from Sentinel-2 detection
  const { Sentinel2Service } = await import('@/lib/integrations/sentinel2');
  const { PollutionDetector } = await import('@/lib/models/pollutionDetector');
  
  const events: PollutionEvent[] = [];
  
  // If location provided, detect pollution in that area
  if (lat !== undefined && lng !== undefined) {
    try {
      const sentinel2 = new Sentinel2Service();
      const detector = new PollutionDetector();
      
      // Search for recent Sentinel-2 images
      const images = await sentinel2.searchImages([lat, lng], radius);
      
      // Detect pollution in each image
      for (const image of images.slice(0, 5)) { // Limit to 5 most recent
        if (image.cloudCoverage < 30) { // Only use low cloud coverage images
          try {
            const detections = await detector.detectPollutionFromSentinel2(image, [lat, lng]);
            const imageEvents = detector.convertToPollutionEvents(detections, image.timestamp);
            events.push(...imageEvents);
          } catch (error) {
            console.warn('Error detecting pollution in image:', error);
          }
        }
      }
      
      detector.dispose();
    } catch (error) {
      console.error('Error fetching pollution events from Sentinel-2:', error);
      // Return empty array - no mock data
    }
  }
  
  // Filter by status if provided
  if (status) {
    return events.filter(event => event.status === status);
  }
  
  return events;
}

