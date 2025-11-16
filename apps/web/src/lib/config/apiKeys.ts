/**
 * API Keys Configuration
 * Centralized configuration for all API keys used in ClimaGuard
 * 
 * To add API keys:
 * 1. Add them to your .env.local file (or environment variables)
 * 2. Update the corresponding key name below
 * 3. Restart your development server
 * 
 * Note: All FREE APIs (Open-Meteo, NOAA, NASA GIBS, Microsoft Planetary Computer)
 * do not require API keys and are already configured.
 */

/**
 * API Keys Configuration Interface
 */
export interface APIKeysConfig {
  // Weather & Climate APIs
  openWeather: string; // OpenWeatherMap API key (optional - we use Open-Meteo which is free)
  
  // Marine & Ocean APIs
  copernicusMarine: string; // Copernicus Marine Service API key
  oceanAcidification: string; // Ocean Acidification API key (if available)
  globalFishingWatch: string; // Global Fishing Watch API key
  
  // Satellite & Imagery APIs
  nasa: string; // NASA API key (optional - GIBS is free, but some services may require key)
  sentinelHub: string; // Sentinel Hub API key (optional - we use Microsoft Planetary Computer which is free)
  
  // Cyclone & Weather APIs
  noaa: string; // NOAA API key (optional - most NOAA services are free)
  jtwc: string; // Joint Typhoon Warning Center API key (if available)
  
  // Database & Storage
  supabaseUrl: string; // Supabase project URL
  supabaseAnonKey: string; // Supabase anonymous key (client-side)
  supabaseServiceRoleKey: string; // Supabase service role key (server-side only - NEVER expose to client)
  
  // AI/ML Services (if using external services)
  openai: string; // OpenAI API key (if using GPT models)
  anthropic: string; // Anthropic API key (if using Claude models)
  
  // Other Services
  mapbox: string; // Mapbox API key (optional - we use OpenStreetMap which is free)
  googleMaps: string; // Google Maps API key (optional)
}

/**
 * Get API keys from environment variables
 * Returns configuration object with all API keys
 */
export function getAPIKeys(): APIKeysConfig {
  return {
    // Weather & Climate APIs
    openWeather: process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
    
    // Marine & Ocean APIs
    copernicusMarine: process.env.COPERNICUS_MARINE_API_KEY || process.env.NEXT_PUBLIC_COPERNICUS_MARINE_API_KEY || '',
    oceanAcidification: process.env.OCEAN_ACIDIFICATION_API_KEY || process.env.NEXT_PUBLIC_OCEAN_ACIDIFICATION_API_KEY || '',
    globalFishingWatch: process.env.GLOBAL_FISHING_WATCH_API_KEY || process.env.NEXT_PUBLIC_GLOBAL_FISHING_WATCH_API_KEY || '',
    
    // Satellite & Imagery APIs
    nasa: process.env.NASA_API_KEY || process.env.NEXT_PUBLIC_NASA_API_KEY || '',
    sentinelHub: process.env.SENTINEL_HUB_API_KEY || process.env.NEXT_PUBLIC_SENTINEL_HUB_API_KEY || '',
    
    // Cyclone & Weather APIs
    noaa: process.env.NOAA_API_KEY || process.env.NEXT_PUBLIC_NOAA_API_KEY || '',
    jtwc: process.env.JTWC_API_KEY || process.env.NEXT_PUBLIC_JTWC_API_KEY || '',
    
    // Database & Storage
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Server-side only - NEVER use NEXT_PUBLIC_ prefix
    
    // AI/ML Services
    openai: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
    
    // Other Services
    mapbox: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_APIKEY || process.env.MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '',
    googleMaps: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  };
}

/**
 * Check if an API key is configured
 */
export function hasAPIKey(key: keyof APIKeysConfig): boolean {
  const keys = getAPIKeys();
  const value = keys[key];
  return value !== undefined && value !== null && value.length >= 10;
}

/**
 * Get API key status for all services
 * Useful for debugging and status displays
 */
export function getAPIKeyStatus(): Record<string, '✅ Configured' | '❌ Missing'> {
  const keys = getAPIKeys();
  return {
    openWeather: hasAPIKey('openWeather') ? '✅ Configured' : '❌ Missing',
    copernicusMarine: hasAPIKey('copernicusMarine') ? '✅ Configured' : '❌ Missing',
    oceanAcidification: hasAPIKey('oceanAcidification') ? '✅ Configured' : '❌ Missing',
    globalFishingWatch: hasAPIKey('globalFishingWatch') ? '✅ Configured' : '❌ Missing',
    nasa: hasAPIKey('nasa') ? '✅ Configured' : '❌ Missing',
    sentinelHub: hasAPIKey('sentinelHub') ? '✅ Configured' : '❌ Missing',
    noaa: hasAPIKey('noaa') ? '✅ Configured' : '❌ Missing',
    jtwc: hasAPIKey('jtwc') ? '✅ Configured' : '❌ Missing',
    supabaseUrl: hasAPIKey('supabaseUrl') ? '✅ Configured' : '❌ Missing',
    supabaseAnonKey: hasAPIKey('supabaseAnonKey') ? '✅ Configured' : '❌ Missing',
    supabaseServiceRoleKey: hasAPIKey('supabaseServiceRoleKey') ? '✅ Configured' : '❌ Missing',
    openai: hasAPIKey('openai') ? '✅ Configured' : '❌ Missing',
    anthropic: hasAPIKey('anthropic') ? '✅ Configured' : '❌ Missing',
    mapbox: hasAPIKey('mapbox') ? '✅ Configured' : '❌ Missing',
    googleMaps: hasAPIKey('googleMaps') ? '✅ Configured' : '❌ Missing',
  };
}

/**
 * FREE APIs that don't require keys (for reference)
 */
export const FREE_APIS = {
  openMeteo: 'https://api.open-meteo.com/v1/forecast',
  openMeteoMarine: 'https://marine-api.open-meteo.com/v1/marine',
  noaaERDDAP: 'https://oceanwatch.pifsc.noaa.gov/erddap',
  noaaActiveStorms: 'https://www.nhc.noaa.gov/CurrentStorms.json',
  nasaGIBS: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
  microsoftPlanetaryComputer: 'https://planetarycomputer.microsoft.com/api/stac/v1',
} as const;


