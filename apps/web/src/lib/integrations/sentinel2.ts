/**
 * Sentinel-2 Satellite Imagery Integration
 * Fetches and processes Sentinel-2 satellite data for pollution detection
 */

export interface Sentinel2Image {
  id: string;
  location: [number, number];
  timestamp: Date;
  cloudCoverage: number; // 0-100
  url?: string;
  bands?: {
    B02?: string; // Blue
    B03?: string; // Green
    B04?: string; // Red
    B08?: string; // NIR
  };
}

export interface PollutionDetectionRequest {
  location: [number, number];
  radius: number; // km
  startDate?: Date;
  endDate?: Date;
}

export class Sentinel2Service {
  private username: string;
  private password: string;
  private baseUrl = 'https://scihub.copernicus.eu/dhus';
  private useMockData: boolean;
  
  constructor() {
    this.username = process.env.COPERNICUS_OPEN_ACCESS_HUB_USERNAME || '';
    this.password = process.env.COPERNICUS_OPEN_ACCESS_HUB_PASSWORD || '';
    this.useMockData = !this.username || !this.password;
    
    if (this.useMockData) {
      console.warn('⚠️ Copernicus Open Access Hub credentials not configured - using mock data');
    }
  }
  
  /**
   * Search for Sentinel-2 images in a region
   */
  async searchImages(
    location: [number, number],
    radius: number = 0.1, // degrees
    startDate?: Date,
    endDate?: Date
  ): Promise<Sentinel2Image[]> {
    if (this.useMockData) {
      return this.getMockImages(location);
    }
    
    try {
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
      const end = endDate || new Date();
      
      const query = this.buildSearchQuery(location, radius, start, end);
      
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
            'Accept': 'application/json',
            'User-Agent': 'ClimaGuard/1.0'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return (data.feed?.entry || []).map((entry: any) => ({
        id: entry.id,
        location,
        timestamp: new Date(entry.date),
        cloudCoverage: entry.cloudCoverage || 0,
        url: entry.link?.find((l: any) => l.rel === 'alternative')?.href
      }));
      
    } catch (error) {
      console.error('Error searching Sentinel-2 images:', error);
      return this.getMockImages(location);
    }
  }
  
  /**
   * Get image URL for download
   */
  async getImageUrl(imageId: string): Promise<string | null> {
    if (this.useMockData) {
      return null; // No real image available
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/odata/v1/Products('${imageId}')/$value`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
            'User-Agent': 'ClimaGuard/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Return the download URL (would need to handle actual download)
      return response.url;
      
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
   * Build OpenSearch query for Sentinel-2
   */
  private buildSearchQuery(
    location: [number, number],
    radius: number,
    startDate: Date,
    endDate: Date
  ): string {
    const [lat, lng] = location;
    const footprint = `footprint:"Intersects(${lat},${lng})"`;
    const platform = 'platformname:Sentinel-2';
    const productType = 'producttype:S2MSI2A'; // Level-2A (atmospherically corrected)
    const cloudCoverage = 'cloudcoverpercentage:[0 TO 30]'; // Low cloud coverage
    const dateRange = `beginPosition:[${startDate.toISOString()} TO ${endDate.toISOString()}]`;
    
    return `${footprint} AND ${platform} AND ${productType} AND ${cloudCoverage} AND ${dateRange}`;
  }
  
  /**
   * Mock data generators
   */
  private getMockImages(location: [number, number]): Sentinel2Image[] {
    // Generate 2-3 mock images
    const count = 2 + Math.floor(Math.random() * 2);
    const images: Sentinel2Image[] = [];
    
    for (let i = 0; i < count; i++) {
      images.push({
        id: `S2A_MSIL2A_${Date.now()}_${i}`,
        location,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Days ago
        cloudCoverage: Math.random() * 20, // 0-20%
        bands: {
          B02: `mock://band2/${i}`,
          B03: `mock://band3/${i}`,
          B04: `mock://band4/${i}`,
          B08: `mock://band8/${i}`
        }
      });
    }
    
    return images;
  }
}

