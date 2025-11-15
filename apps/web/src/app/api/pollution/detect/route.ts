/**
 * Pollution Detection API Route
 * Uses Microsoft Planetary Computer Sentinel-2 data for pollution detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { PollutionDetector } from '@/lib/models/pollutionDetector';
import { Sentinel2Service } from '@/lib/integrations/sentinel2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, location, imageData, radius } = body;
    
    if (!location || !Array.isArray(location) || location.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid location. Expected [lat, lng]' },
        { status: 400 }
      );
    }
    
    const [lat, lng] = location;
    const searchRadius = radius || 0.1; // degrees
    
    // Initialize services
    const detector = new PollutionDetector();
    const sentinel2 = new Sentinel2Service();
    
    // Fetch latest Sentinel-2 image from Microsoft Planetary Computer
    const latestImage = await sentinel2.getLatestImage([lat, lng]);
    
    if (!latestImage) {
      return NextResponse.json(
        { 
          error: 'No satellite imagery available for this location',
          message: 'Try again later or check if the location is covered by Sentinel-2'
        },
        { status: 404 }
      );
    }
    
    // For server-side, we use Sentinel-2 metadata for detection
    // The detector will use statistical/heuristic methods based on Sentinel-2 bands
    let detectionResults;
    
    if (imageData) {
      // Client-side detection with image data (would need to be handled client-side)
      // For now, use statistical detection with Sentinel-2 metadata
      detectionResults = await detector.detectPollutionFromSentinel2(
        latestImage,
        [lat, lng]
      );
    } else if (imageUrl) {
      // Use provided image URL (client-side would handle this)
      detectionResults = await detector.detectPollutionFromSentinel2(
        latestImage,
        [lat, lng]
      );
    } else {
      // Use Sentinel-2 metadata for server-side detection
      detectionResults = await detector.detectPollutionFromSentinel2(
        latestImage,
        [lat, lng]
      );
    }
    
    // Convert to pollution events
    const events = detector.convertToPollutionEvents(detectionResults, latestImage.timestamp);
    
    // Clean up
    detector.dispose();
    
    return NextResponse.json({
      detections: detectionResults,
      events,
      satelliteImage: {
        id: latestImage.id,
        timestamp: latestImage.timestamp,
        cloudCoverage: latestImage.cloudCoverage,
        url: latestImage.tileUrl || latestImage.url
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in pollution detection:', error);
    return NextResponse.json(
      { 
        error: 'Pollution detection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


