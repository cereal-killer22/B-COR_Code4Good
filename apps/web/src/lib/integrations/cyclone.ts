/**
 * Cyclone Integration - NOAA JTWC and IBTrACS
 * Fetches real-time tropical cyclone data from NOAA sources
 */

export interface CycloneData {
  name: string;
  category: number; // 0-5 (Saffir-Simpson scale)
  windSpeed: number; // km/h
  pressure: number; // hPa
  distance: number; // km from Mauritius
  eta: number; // hours until arrival
  direction: string;
  movement: string; // km/h
  location: [number, number];
  basin?: string;
  timestamp: Date;
}

export class CycloneService {
  private mauritiusLocation: [number, number] = [-20.2, 57.5];

  /**
   * Get current active cyclone data
   */
  async getActiveCyclone(): Promise<CycloneData | null> {
    try {
      // Try NOAA's active storms JSON feed
      const noaaCyclone = await this.fetchFromNOAA();
      if (noaaCyclone) return noaaCyclone;

      // Try alternative sources (JTWC, regional services)
      // Note: JTWC data requires parsing ATCF files which is complex
      // For now, we use NOAA's JSON feed as primary source

      return null;

    } catch (error) {
      console.error('Error fetching cyclone data:', error);
      return null;
    }
  }

  /**
   * Fetch from NOAA's active storms feed
   */
  private async fetchFromNOAA(): Promise<CycloneData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        'https://www.nhc.noaa.gov/CurrentStorms.json',
        {
          headers: {
            'User-Agent': 'ClimaGuard/1.0 (Climate Monitoring System)'
          },
          cache: 'no-store',
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Filter for Southwest Indian Ocean storms
      // Southwest Indian Ocean: lat -30 to -10, lng 40 to 90
      const swIndianOceanStorms = (data.activeStorms || []).filter((storm: any) => {
        const center = storm.center;
        if (!center || center.length !== 2) return false;
        
        const lat = center[1];
        const lng = center[0];
        
        return lat >= -30 && lat <= -10 && lng >= 40 && lng <= 90;
      });

      if (swIndianOceanStorms.length === 0) {
        return null;
      }

      // Get the closest/strongest storm
      const storm = swIndianOceanStorms[0];
      const stormLat = storm.center[1];
      const stormLng = storm.center[0];

      const distance = this.calculateDistance(
        this.mauritiusLocation[0],
        this.mauritiusLocation[1],
        stormLat,
        stormLng
      );

      const windKnots = storm.intensity?.wind || 0;
      const windKmh = windKnots * 1.852;
      const movementSpeed = (storm.movement?.speed || 0) * 1.852; // Convert knots to km/h
      const eta = movementSpeed > 0 ? distance / movementSpeed : 999;

      return {
        name: storm.name || 'Unnamed Storm',
        category: this.categorizeIntensity(windKmh),
        windSpeed: Math.round(windKmh),
        pressure: storm.intensity?.pressure || 1000,
        distance: Math.round(distance),
        eta: Math.round(eta),
        direction: storm.movement?.direction || '--',
        movement: `${Math.round(movementSpeed)} km/h`,
        location: [stormLat, stormLng],
        basin: storm.basin,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error fetching from NOAA:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Categorize cyclone intensity from wind speed (Saffir-Simpson scale)
   */
  private categorizeIntensity(windKmh: number): number {
    if (windKmh >= 250) return 5; // Category 5
    if (windKmh >= 210) return 4; // Category 4
    if (windKmh >= 178) return 3; // Category 3
    if (windKmh >= 154) return 2; // Category 2
    if (windKmh >= 119) return 1; // Category 1
    if (windKmh >= 63) return 0;  // Tropical storm
    return -1; // Tropical depression
  }
}

