/**
 * Sentinel-2 Satellite Imagery Integration (FREE - NO API KEY REQUIRED)
 * Uses Microsoft Planetary Computer STAC API
 * 
 * Endpoint: https://planetarycomputer.microsoft.com/api/stac/v1/search
 * 
 * Provides:
 * - Sentinel-2 L2A (atmospherically corrected) imagery
 * - RGB + NIR bands for pollution detection
 * - Real-time tile URLs
 */

export interface Sentinel2Image {
  id: string;
  location: [number, number];
  timestamp: Date;
  cloudCoverage: number; // 0-100
  url?: string;
  tileUrl?: string; // Direct tile URL for visualization
  bands?: {
    B02?: string; // Blue
    B03?: string; // Green
    B04?: string; // Red
    B08?: string; // NIR
  };
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface PollutionDetectionRequest {
  location: [number, number];
  radius: number; // km
  startDate?: Date;
  endDate?: Date;
}

export interface STACItem {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  bbox: number[];
  properties: {
    datetime: string;
    'eo:cloud_cover': number;
    'sentinel:utm_zone': number;
    'sentinel:latitude_band': string;
    'sentinel:grid_square': string;
  };
  assets: {
    [key: string]: {
      href: string;
      type: string;
      title?: string;
    };
  };
  links: Array<{
    rel: string;
    href: string;
  }>;
}

export class Sentinel2Service {
  private stacBaseUrl = 'https://planetarycomputer.microsoft.com/api/stac/v1';
  private collectionId = 'sentinel-2-l2a';
  
  constructor() {
    // No API key needed - Microsoft Planetary Computer is free
  }
  
  /**
   * Search for Sentinel-2 images using Microsoft Planetary Computer STAC API
   */
  async searchImages(
    location: [number, number],
    radius: number = 0.1, // degrees
    startDate?: Date,
    endDate?: Date
  ): Promise<Sentinel2Image[]> {
    try {
      const [lat, lng] = location;
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      
      // Build bounding box from location and radius
      const bbox: [number, number, number, number] = [
        lng - radius, // minLng
        lat - radius, // minLat
        lng + radius, // maxLng
        lat + radius  // maxLat
      ];
      
      // STAC search request
      const searchBody = {
        collections: [this.collectionId],
        bbox,
        datetime: `${start.toISOString()}/${end.toISOString()}`,
        limit: 10,
        query: {
          'eo:cloud_cover': { lt: 30 } // Prefer low cloud coverage
        }
      };
      
      const response = await fetch(`${this.stacBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        body: JSON.stringify(searchBody),
        next: { revalidate: 3600 }
      });
      
      if (!response.ok) {
        throw new Error(`STAC API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert STAC items to Sentinel2Image format
      return (data.features || []).map((item: STACItem) => {
        const visualAsset = item.assets['visual'] || item.assets['rendered_preview'];
        const tileUrl = visualAsset?.href || this.getTileUrlFromAsset(item);
        
        return {
          id: item.id,
          location,
          timestamp: new Date(item.properties.datetime),
          cloudCoverage: item.properties['eo:cloud_cover'] || 0,
          url: visualAsset?.href,
          tileUrl,
          bbox: item.bbox as [number, number, number, number],
          bands: {
            B02: item.assets['B02']?.href,
            B03: item.assets['B03']?.href,
            B04: item.assets['B04']?.href,
            B08: item.assets['B08']?.href
          }
        };
      });
      
    } catch (error) {
      console.error('Error searching Sentinel-2 images:', error);
      // Return empty array instead of mock data
      console.warn('Sentinel-2 API unavailable, returning empty results');
      return [];
    }
  }
  
  /**
   * Get tile URL from STAC asset
   */
  private getTileUrlFromAsset(item: STACItem): string | undefined {
    // Try to get visual/rendered asset first
    const visual = item.assets['visual'] || item.assets['rendered_preview'];
    if (visual?.href) return visual.href;
    
    // Fallback to RGB composite from individual bands
    const b04 = item.assets['B04']?.href; // Red
    const b03 = item.assets['B03']?.href; // Green
    const b02 = item.assets['B02']?.href; // Blue
    
    if (b04 && b03 && b02) {
      // Return red band as fallback (can be used for visualization)
      return b04;
    }
    
    return undefined;
  }
  
  /**
   * Get image URL for a specific STAC item
   */
  async getImageUrl(imageId: string, location?: [number, number]): Promise<string | null> {
    try {
      // Search for the specific image
      const images = location 
        ? await this.searchImages(location, 0.1)
        : await this.searchImages([-20.0, 57.5], 0.5);
      
      const image = images.find(img => img.id === imageId);
      return image?.tileUrl || image?.url || null;
      
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  }
  
  /**
   * Get latest image for a location
   */
  async getLatestImage(location: [number, number]): Promise<Sentinel2Image | null> {
    const images = await this.searchImages(location, 0.1);
    
    if (images.length === 0) return null;
    
    // Sort by timestamp and return most recent with low cloud coverage
    const sorted = images
      .filter(img => img.cloudCoverage < 30) // Prefer low cloud coverage
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return sorted[0] || images[0];
  }
  
  /**
   * Get tile URL for visualization (for map overlays)
   */
  getTileUrl(image: Sentinel2Image, zoom: number, x: number, y: number): string | null {
    if (!image.tileUrl) return null;
    
    // For Microsoft Planetary Computer, tiles are typically accessed via signed URLs
    // This is a simplified version - in production, you'd use the tile service
    return image.tileUrl;
  }
  
  /**
   * REMOVED: getMockImages
   * No mock data generators allowed - all data must come from real APIs
   */
}

