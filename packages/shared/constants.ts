// App constants
export const APP_NAME = 'ClimaGuard';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.climaguard.com' 
  : 'http://localhost:3001';

// Temperature thresholds
export const TEMPERATURE_THRESHOLDS = {
  HOT: 30, // Celsius
  COLD: 5,
  CRITICAL_HOT: 40,
  CRITICAL_COLD: -10,
} as const;

// Humidity thresholds
export const HUMIDITY_THRESHOLDS = {
  LOW: 30,
  HIGH: 70,
  CRITICAL_LOW: 20,
  CRITICAL_HIGH: 85,
} as const;

// Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6D6D70',
} as const;

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  REAL_TIME: 5000,
  FREQUENT: 30000,
  NORMAL: 60000,
  SLOW: 300000,
} as const;