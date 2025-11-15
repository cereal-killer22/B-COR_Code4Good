// Temperature conversion utilities
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
};

// Date formatting utilities
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Data validation utilities
export const isValidTemperature = (temp: number): boolean => {
  return temp >= -50 && temp <= 60; // Reasonable range in Celsius
};

export const isValidHumidity = (humidity: number): boolean => {
  return humidity >= 0 && humidity <= 100;
};

// API response helpers
export const createApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  timestamp: new Date(),
});

export const createErrorResponse = (message: string, code?: string) => ({
  success: false,
  error: {
    message,
    code,
  },
  timestamp: new Date(),
});