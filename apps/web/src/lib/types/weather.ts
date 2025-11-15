/**
 * Weather and Rainfall Types
 */

export interface RainfallPoint {
  lat: number;
  lon: number;
  value: number; // mm/hr
}

export interface RainfallGrid {
  timestamp: string;
  points: RainfallPoint[];
}

export interface RainfallForecast {
  now: RainfallGrid;
  next24h: RainfallGrid;
  next72h: RainfallGrid;
}

