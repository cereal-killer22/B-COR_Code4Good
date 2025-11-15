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

export interface CyclonePrediction {
  location: { lat: number; lon: number };
  observations: {
    minPressure: number; // hPa
    maxWindSpeed: number; // km/h
    pressureData: number[];
    windData: number[];
  };
  prediction: {
    probability: number; // 0-1
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    explanation: string;
  };
  timestamp: string;
  dataSource: string;
}

export interface FloodPrediction {
  location: { lat: number; lon: number };
  rainfall: {
    precip24h: number; // mm
    precip72h: number; // mm
    soilMoisture?: number; // 0-1
    hourlyPrecip: number[];
  };
  prediction: {
    probability: number; // 0-1
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    explanation: string;
  };
  timestamp: string;
  dataSource: string;
}

export interface OceanHealth {
  location: { lat: number; lon: number };
  rawData: {
    sst: number; // Sea Surface Temperature (°C)
    hotspot: number; // HotSpot value
    dhw: number; // Degree Heating Weeks
  };
  prediction: {
    score: number; // 0-100
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    explanation: string;
  };
  timestamp: string;
  dataSource: string;
}

