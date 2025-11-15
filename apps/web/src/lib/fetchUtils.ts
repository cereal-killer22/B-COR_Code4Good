/**
 * Enhanced fetch utilities with timeout handling and error management
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch with timeout and retry capabilities
 */
export async function fetchWithTimeout(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 5000,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'User-Agent': 'ClimaGuard/1.0',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Log retry attempt
      console.log(`🔄 Fetch attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}

/**
 * Fetch weather data with proper error handling and fallback
 */
export async function fetchWeatherData(
  lat: number, 
  lng: number, 
  apiKey: string
): Promise<any> {
  try {
    const response = await fetchWithTimeout(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
      {
        timeout: 5000,
        retries: 0, // No retries - fall back to simulated data quickly
        retryDelay: 1000,
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
      console.warn(`⏰ Weather API timeout for ${lat},${lng}`);
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
      console.warn(`🌐 Network error for weather data at ${lat},${lng}`);
    } else {
      console.warn(`❌ Weather API error for ${lat},${lng}:`, errorMessage);
    }
    
    throw error;
  }
}

/**
 * Fetch NOAA data with extended timeout
 */
export async function fetchNOAAData(url: string): Promise<Response> {
  return fetchWithTimeout(url, {
    timeout: 10000, // Longer timeout for NOAA
    retries: 1,
    retryDelay: 2000,
  });
}

/**
 * Create fallback environmental conditions when API fails
 */
export function createFallbackConditions(lat: number, lng: number) {
  const month = new Date().getMonth();
  const isWarmSeason = month >= 10 || month <= 3; // Nov-Mar in Southern Hemisphere
  
  return {
    lat,
    lng,
    seaTemp: isWarmSeason ? 28.5 + Math.random() * 2 : 25.5 + Math.random() * 2,
    windShear: 5 + Math.random() * 10, // Low to moderate wind shear
    pressure: 1010 + Math.random() * 15, // Typical pressure range
    humidity: 70 + Math.random() * 25, // 70-95% humidity
    vorticity: -0.5 + Math.random() * 1, // Slight negative to positive vorticity
    divergence: -2 + Math.random() * 4, // Slight convergence to divergence
    timestamp: Date.now()
  };
}