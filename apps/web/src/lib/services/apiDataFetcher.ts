/**
 * API Data Fetcher Service
 * Fetches data from external APIs and prepares it for storage
 */

export interface FetchConfig {
  apiUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: any;
  dataType: 'weather' | 'cyclone' | 'flood' | 'ocean' | 'alert' | 'custom';
  locationName?: string;
  latitude?: number;
  longitude?: number;
  sourceApi: string; // e.g., 'openweathermap', 'mauritius_met'
}

export interface FetchedData {
  dataContent: any;
  searchKeywords: string[];
  summary: string;
  expiresAt?: Date;
}

/**
 * Fetch data from an external API
 */
export async function fetchApiData(config: FetchConfig): Promise<FetchedData> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (config.apiKey) {
      // Support different API key formats
      if (config.sourceApi === 'openweathermap') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else {
        // Default: add as query parameter or header based on API
        headers['X-API-Key'] = config.apiKey;
      }
    }

    const fetchOptions: RequestInit = {
      method: config.method || 'GET',
      headers,
    };

    if (config.method === 'POST' && config.body) {
      fetchOptions.body = JSON.stringify(config.body);
    }

    // Add API key to URL if needed (for some APIs)
    let url = config.apiUrl;
    if (config.apiKey && config.sourceApi === 'openweathermap') {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}appid=${config.apiKey}`;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract keywords and create summary based on data type
    const { searchKeywords, summary, expiresAt } = processFetchedData(data, config);

    return {
      dataContent: data,
      searchKeywords,
      summary,
      expiresAt,
    };
  } catch (error) {
    console.error('Error fetching API data:', error);
    throw new Error(`Failed to fetch data from ${config.sourceApi}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process fetched data to extract keywords and create summary
 */
function processFetchedData(data: any, config: FetchConfig): {
  searchKeywords: string[];
  summary: string;
  expiresAt?: Date;
} {
  const keywords: string[] = [config.dataType, config.sourceApi];
  let summary = '';
  let expiresAt: Date | undefined;

  switch (config.dataType) {
    case 'weather':
      if (data.weather && Array.isArray(data.weather)) {
        keywords.push(...data.weather.map((w: any) => w.main?.toLowerCase() || ''));
      }
      if (data.main) {
        keywords.push('temperature', 'humidity', 'pressure');
        summary = `Weather: ${data.main.temp}°C, ${data.weather?.[0]?.description || 'N/A'}`;
      }
      // Weather data typically expires after 1 hour
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      break;

    case 'cyclone':
      keywords.push('cyclone', 'storm', 'tropical', 'warning');
      if (data.name) keywords.push(data.name.toLowerCase());
      summary = `Cyclone information: ${data.name || 'N/A'}`;
      // Cyclone data expires after 6 hours
      expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
      break;

    case 'flood':
      keywords.push('flood', 'water', 'rainfall', 'warning');
      summary = `Flood information: ${data.status || 'N/A'}`;
      // Flood data expires after 3 hours
      expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
      break;

    case 'ocean':
      keywords.push('ocean', 'marine', 'water quality', 'coral', 'reef');
      summary = `Ocean health data: ${data.status || 'N/A'}`;
      // Ocean data expires after 12 hours
      expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      break;

    case 'alert':
      keywords.push('alert', 'warning', 'emergency');
      if (data.severity) keywords.push(data.severity.toLowerCase());
      summary = `Alert: ${data.message || 'N/A'}`;
      // Alert data expires after 24 hours
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      break;

    default:
      // Generic processing
      if (data.name) keywords.push(data.name.toLowerCase());
      if (data.title) keywords.push(data.title.toLowerCase());
      summary = `Data from ${config.sourceApi}`;
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 24 hours
  }

  // Add location keywords
  if (config.locationName) {
    keywords.push(config.locationName.toLowerCase());
  }

  return {
    searchKeywords: [...new Set(keywords)], // Remove duplicates
    summary: summary || `Data from ${config.sourceApi}`,
    expiresAt,
  };
}

/**
 * Example: Fetch weather data from OpenWeatherMap
 */
export async function fetchWeatherData(
  apiKey: string,
  location: { lat: number; lon: number; name?: string }
): Promise<FetchedData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric`;
  
  return fetchApiData({
    apiUrl: url,
    apiKey,
    dataType: 'weather',
    sourceApi: 'openweathermap',
    locationName: location.name || 'Mauritius',
    latitude: location.lat,
    longitude: location.lon,
  });
}

