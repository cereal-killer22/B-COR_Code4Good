/**
 * Pollution Detection API Route
 * Detects pollution in satellite imagery using CNN model
 */

import { NextRequest, NextResponse } from 'next/server';
import { PollutionDetector } from '@/lib/models/pollutionDetector';
import { Sentinel2Service } from '@/lib/integrations/sentinel2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, location, imageData } = body;
    
    if (!location || !Array.isArray(location) || location.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid location. Expected [lat, lng]' },
        { status: 400 }
      );
    }
    
    const [lat, lng] = location;
    
    // Initialize pollution detector
    const detector = new PollutionDetector();
    
    // If imageData is provided, use it directly
    // Otherwise, fetch from Sentinel-2
    let detectionResults;
    
    if (imageData) {
      // Convert base64 or ImageData to ImageData
      const img = await loadImageFromData(imageData);
      detectionResults = await detector.detectPollution(img, [lat, lng]);
    } else if (imageUrl) {
      // Load image from URL
      const img = await loadImageFromUrl(imageUrl);
      detectionResults = await detector.detectPollution(img, [lat, lng]);
    } else {
      // Fetch latest Sentinel-2 image
      const sentinel2 = new Sentinel2Service();
      const latestImage = await sentinel2.getLatestImage([lat, lng]);
      
      if (!latestImage || !latestImage.url) {
        return NextResponse.json(
          { error: 'No satellite imagery available for this location' },
          { status: 404 }
        );
      }
      
      // Load and detect
      const img = await loadImageFromUrl(latestImage.url);
      detectionResults = await detector.detectPollution(img, [lat, lng]);
    }
    
    // Convert to pollution events
    const events = detector.convertToPollutionEvents(detectionResults);
    
    // Clean up
    detector.dispose();
    
    return NextResponse.json({
      detections: detectionResults,
      events,
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

/**
 * Load image from URL
 */
async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Load image from base64 or ImageData
 */
async function loadImageFromData(data: string | ImageData): Promise<HTMLImageElement | ImageData> {
  if (data instanceof ImageData) {
    return data;
  }
  
  // Assume base64 string
  return loadImageFromUrl(data);
}

