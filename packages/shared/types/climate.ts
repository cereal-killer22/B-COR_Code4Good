/**
 * Climate Data Types
 * Shared types for weather, cyclone, flood, and storm surge data
 */

export interface WeatherMetrics {
  location: [number, number];
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // Percentage (0-100)
  pressure: number; // hPa
  windSpeed: number; // km/h
  windGusts: number; // km/h
  precipitation: number; // mm
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
  }[];
}

export interface CycloneData {
  name: string;
  category: number; // 0-5 (Saffir-Simpson scale)
  windSpeed: number; // km/h
  pressure: number; // hPa
  distance: number; // km from reference point
  eta: number; // hours until arrival
  direction: string;
  movement: string; // km/h
  location: [number, number];
  basin?: string;
  timestamp: Date;
}

export interface FloodRisk {
  location: [number, number];
  timestamp: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0-100
  precipitation: number; // mm (current)
  precipitation24h: number; // mm (last 24 hours)
  soilMoisture: number; // 0-1 scale
  alerts: FloodAlert[];
}

export interface FloodAlert {
  level: 'low' | 'moderate' | 'high' | 'severe';
  message: string;
  area: string;
}

export interface StormSurgeRisk {
  location: [number, number];
  timestamp: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0-100
  waveHeightMax: number; // meters
  windSpeedMax: number; // km/h
  swellHeight: number; // meters
  alerts: StormSurgeAlert[];
}

export interface StormSurgeAlert {
  level: 'low' | 'moderate' | 'high' | 'severe';
  message: string;
  area: string;
}

