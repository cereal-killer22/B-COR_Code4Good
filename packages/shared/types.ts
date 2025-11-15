// Climate data types
export interface ClimateData {
  temperature: number;
  humidity: number;
  pressure: number;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

// Sensor types
export interface Sensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'air_quality';
  location: string;
  isActive: boolean;
  lastReading?: ClimateData;
}

// Alert types
export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
  sensorId?: string;
  acknowledged: boolean;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

// Export ocean types
export * from './types/ocean';