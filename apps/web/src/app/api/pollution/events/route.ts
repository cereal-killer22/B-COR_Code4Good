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
      id: `pollution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  // Mock data - would query database in production
  const mockEvents: PollutionEvent[] = [
    {
      id: 'poll-1',
      type: 'plastic',
      location: [-20.0, 57.5],
      severity: 'medium',
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      affectedArea: 1.5,
      predictedSpread: [
        [-20.1, 57.4],
        [-20.1, 57.6],
        [-19.9, 57.6],
        [-19.9, 57.4]
      ],
      status: 'detected',
      source: 'Sentinel-2 satellite imagery'
    },
    {
      id: 'poll-2',
      type: 'oil_spill',
      location: [-20.2, 57.7],
      severity: 'high',
      detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      affectedArea: 3.2,
      predictedSpread: [
        [-20.3, 57.6],
        [-20.3, 57.8],
        [-20.1, 57.8],
        [-20.1, 57.6]
      ],
      status: 'confirmed',
      source: 'Automated detection system'
    }
  ];
  
  // Filter by location if provided
  let filtered = mockEvents;
  if (lat !== undefined && lng !== undefined) {
    filtered = filtered.filter(event => {
      const [eventLat, eventLng] = event.location;
      const distance = Math.sqrt(
        Math.pow(eventLat - lat, 2) + Math.pow(eventLng - lng, 2)
      );
      return distance <= radius;
    });
  }
  
  // Filter by status if provided
  if (status) {
    filtered = filtered.filter(event => event.status === status);
  }
  
  return filtered;
}

