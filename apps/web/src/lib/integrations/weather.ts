/**
 * Weather Integration - Open-Meteo API
 * Fetches real-time weather data including temperature, humidity, pressure, wind, and precipitation
 */

export interface WeatherData {
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

export class WeatherService {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Get current weather data for a location
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('latitude', lat.toString());
      url.searchParams.set('longitude', lng.toString());
      url.searchParams.set('hourly', 'temperature_2m,relativehumidity_2m,pressure_msl,windspeed_10m,windgusts_10m,precipitation');
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('forecast_days', '7');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClimaGuard/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Get current hour's data (index 0)
      const hourly = data.hourly;
      const currentIndex = 0;

      const weather: WeatherData = {
        location: [lat, lng],
        timestamp: new Date(),
        temperature: hourly.temperature_2m[currentIndex] || 0,
        humidity: hourly.relativehumidity_2m[currentIndex] || 0,
        pressure: hourly.pressure_msl[currentIndex] || 1013,
        windSpeed: hourly.windspeed_10m[currentIndex] || 0,
        windGusts: hourly.windgusts_10m[currentIndex] || 0,
        precipitation: hourly.precipitation[currentIndex] || 0,
        daily: (data.daily?.time || []).map((date: string, index: number) => ({
          date,
          tempMax: data.daily.temperature_2m_max[index] || 0,
          tempMin: data.daily.temperature_2m_min[index] || 0,
          precipitationSum: data.daily.precipitation_sum[index] || 0
        }))
      };

      return weather;

    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get daily forecast for next 7 days
   */
  async getDailyForecast(lat: number, lng: number, days: number = 7): Promise<WeatherData['daily']> {
    const weather = await this.getCurrentWeather(lat, lng);
    return weather.daily.slice(0, days);
  }
}

