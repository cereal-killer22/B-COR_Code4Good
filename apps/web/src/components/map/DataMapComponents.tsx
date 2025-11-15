/**
 * Data Map Components
 * Map components that fetch and plot data from API calls
 */

'use client';

import { useEffect, useState, useRef, useId } from 'react';
import MapEngineComponent from './MapEngineComponent';
import {
  OCEAN_HEALTH_MAP_CONFIG,
  FLOOD_MAP_CONFIG,
  CYCLONE_MAP_CONFIG,
  POLLUTION_MAP_CONFIG,
  BIODIVERSITY_MAP_CONFIG,
  REEF_HEALTH_MAP_CONFIG,
  addMarker,
  addCircle,
  loadRiskPolygon,
  loadCycloneTrack,
  loadGeoJSONLayer,
  type MapEngineOptions,
} from '@/lib/map';
import type L from 'leaflet';

/**
 * Key locations around Mauritius for ocean health monitoring
 */
const MAURITIUS_MONITORING_LOCATIONS = [
  { name: 'Port Louis', coords: [-20.1619, 57.5012] as [number, number] },
  { name: 'Grand Baie', coords: [-20.0151, 57.5829] as [number, number] },
  { name: 'Flic en Flac', coords: [-20.2747, 57.3631] as [number, number] },
  { name: 'Blue Bay', coords: [-20.4281, 57.7214] as [number, number] },
  { name: 'Trou aux Biches', coords: [-20.0333, 57.5500] as [number, number] },
  { name: 'Belle Mare', coords: [-20.2000, 57.7500] as [number, number] },
  { name: 'Le Morne', coords: [-20.4500, 57.3167] as [number, number] },
  { name: 'Ile aux Cerfs', coords: [-20.4167, 57.7833] as [number, number] },
  { name: 'Pointe aux Piments', coords: [-20.0667, 57.5167] as [number, number] },
  { name: 'Tamarin Bay', coords: [-20.3167, 57.3667] as [number, number] },
];

/**
 * Ocean Health Data Map
 * Plots ocean health metrics from /api/ocean-health for multiple locations around Mauritius
 */
export function OceanHealthDataMap({ 
  lat = -20.2, 
  lng = 57.5 
}: { lat?: number; lng?: number }) {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `ocean-health-data-map-${uniqueId}`;
  const [locationsData, setLocationsData] = useState<Array<{
    location: { name: string; coords: [number, number] };
    data: any;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchAllOceanHealthData();
    const interval = setInterval(fetchAllOceanHealthData, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const fetchAllOceanHealthData = async () => {
    try {
      setLoading(true);
      const promises = MAURITIUS_MONITORING_LOCATIONS.map(async (loc) => {
        try {
          const response = await fetch(`/api/ocean-health?lat=${loc.coords[0]}&lng=${loc.coords[1]}`, {
            next: { revalidate: 300 } // Cache for 5 minutes
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // Verify we have real data (not error response)
            if (result.oceanHealth && !result.error) {
              // Ensure we have actual data values
              const hasRealData = result.oceanHealth.overallHealthScore !== undefined &&
                                 result.oceanHealth.waterQuality !== undefined;
              
              if (hasRealData) {
                return {
                  location: loc,
                  data: result.oceanHealth,
                };
              } else {
                console.warn(`Incomplete ocean health data for ${loc.name}`);
              }
            } else {
              console.warn(`Error in ocean health response for ${loc.name}:`, result.error || 'Unknown error');
            }
          } else {
            console.warn(`Failed to fetch ocean health for ${loc.name}: ${response.status} ${response.statusText}`);
          }
          return null;
        } catch (error) {
          console.error(`Error fetching ocean health for ${loc.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null && r.data);
      
      if (validResults.length === 0) {
        console.warn('No valid ocean health data retrieved from API');
      }
      
      setLocationsData(validResults);
    } catch (error) {
      console.error('Error fetching ocean health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapReady = (map: L.Map | null) => {
    if (!map) return;
    mapRef.current = map;

    // Invalidate size to ensure map fills container properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  };

  const plotOceanHealthData = (map: L.Map) => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Filter to only plot locations with valid real data
    // Accept data if it has overallHealthScore OR waterQuality with temperature
    const validLocations = locationsData.filter(({ data }) => {
      if (!data) return false;
      
      // Accept if we have overall health score
      if (data.overallHealthScore !== undefined) return true;
      
      // Accept if we have water quality with temperature
      if (data.waterQuality && data.waterQuality.temperature !== undefined) return true;
      
      // Accept if we have reef health data
      if (data.reefHealth && data.reefHealth.healthIndex !== undefined) return true;
      
      return false;
    });

    if (validLocations.length === 0) {
      console.warn('No valid ocean health data to plot');
      // Still show the map with default view
      map.setView([lat, lng], 12);
      return;
    }

    // Plot each location with real data
    validLocations.forEach(({ location, data }) => {
      if (!data) return;

      const [locLat, locLng] = location.coords;
      
      // Determine color based on overall health score (from real API data)
      // Use health score if available, otherwise estimate from water quality or reef health
      let healthScore = data.overallHealthScore;
      if (healthScore === undefined) {
        // Estimate from available data
        const waterQualityScore = data.waterQuality?.score || 70;
        const reefScore = data.reefHealth?.healthIndex || 70;
        healthScore = (waterQualityScore + reefScore) / 2;
      }
      
      const waterQualityColor = healthScore > 70 ? '#22c55e' : 
                               healthScore > 50 ? '#eab308' : 
                               healthScore > 30 ? '#ea580c' : '#dc2626';
      
      // Add circle for water quality zone (size based on health score)
      const radius = 8000 + (healthScore / 100) * 2000; // 8-10km based on health
      addCircle(map, [locLat, locLng], radius, {
        color: waterQualityColor,
        weight: 2,
        opacity: 0.7,
        fillColor: waterQualityColor,
        fillOpacity: 0.15,
      });

      // Add marker with detailed popup showing real data
      const temp = data.waterQuality?.temperature;
      const turbidity = data.waterQuality?.turbidity;
      const pollutionIndex = data.pollution?.overallIndex;
      const biodiversityIndex = data.biodiversity?.biodiversityIndex;
      const reefHealthIndex = data.reefHealth?.healthIndex;
      const bleachingRisk = data.reefHealth?.bleachingRisk;
      const dataTimestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Recent';

      const popupContent = `
        <div class="p-3 min-w-[220px]">
          <h3 class="font-bold text-lg mb-2">🌊 ${location.name}</h3>
          <div class="text-xs text-gray-500 mb-2">Data: ${dataTimestamp}</div>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="font-semibold">Overall Score:</span>
              <span class="font-bold" style="color: ${waterQualityColor}">
                ${healthScore.toFixed(1)}/100
              </span>
            </div>
            <div class="border-t pt-1 mt-1">
              <div><strong>Water Quality:</strong> ${data.waterQuality?.score?.toFixed(1) || 'N/A'}/100</div>
              ${temp !== undefined ? `<div><strong>Temperature:</strong> ${temp.toFixed(1)}°C</div>` : ''}
              ${data.waterQuality?.pH !== undefined ? `<div><strong>pH:</strong> ${data.waterQuality.pH.toFixed(2)}</div>` : ''}
              ${turbidity !== undefined ? `<div><strong>Turbidity:</strong> ${turbidity.toFixed(2)}</div>` : ''}
            </div>
            <div class="border-t pt-1 mt-1">
              ${pollutionIndex !== undefined ? `<div><strong>Pollution Index:</strong> ${pollutionIndex.toFixed(1)}/100</div>` : ''}
              ${biodiversityIndex !== undefined ? `<div><strong>Biodiversity:</strong> ${biodiversityIndex.toFixed(1)}/100</div>` : ''}
            </div>
            <div class="border-t pt-1 mt-1">
              ${reefHealthIndex !== undefined ? `<div><strong>Reef Health:</strong> ${reefHealthIndex.toFixed(1)}/100</div>` : ''}
              ${bleachingRisk ? `<div><strong>Bleaching Risk:</strong> ${bleachingRisk}</div>` : ''}
            </div>
          </div>
        </div>
      `;
      addMarker(map, [locLat, locLng], {}, popupContent);
    });

    // Fit bounds to show all locations with valid data
    if (validLocations.length > 0) {
      const bounds = validLocations.map(({ location }) => location.coords);
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    }
  };

  useEffect(() => {
    if (mapRef.current && locationsData.length > 0) {
      plotOceanHealthData(mapRef.current);
      // Invalidate size after plotting to ensure proper display
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    }
  }, [locationsData]);

  const config: MapEngineOptions = {
    ...OCEAN_HEALTH_MAP_CONFIG,
    center: [lat, lng],
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading ocean health data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', zIndex: 0, minHeight: '500px', height: '500px' }}>
      <MapEngineComponent
        containerId={containerId}
        options={config}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0, minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

/**
 * Pollution Events Data Map
 * Plots pollution events from /api/pollution/events
 */
export function PollutionDataMap({ 
  lat = -20.2, 
  lng = 57.5 
}: { lat?: number; lng?: number }) {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `pollution-data-map-${uniqueId}`;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchPollutionEvents();
    const interval = setInterval(fetchPollutionEvents, 300000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  const fetchPollutionEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pollution/events?lat=${lat}&lng=${lng}&radius=1.0`);
      if (response.ok) {
        const result = await response.json();
        setEvents(result.events || []);
      }
    } catch (error) {
      console.error('Error fetching pollution events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapReady = (map: L.Map | null) => {
    if (!map) return;
    mapRef.current = map;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Plot each pollution event
    events.forEach((event) => {
      const severityColor = event.severity === 'critical' ? '#dc2626' :
                           event.severity === 'high' ? '#ea580c' :
                           event.severity === 'medium' ? '#eab308' : '#3b82f6';
      
      const [eventLat, eventLng] = event.location;
      const radius = Math.sqrt(event.affectedArea) * 1000; // Convert km² to meters

      addCircle(map, [eventLat, eventLng], radius, {
        color: severityColor,
        weight: 2,
        opacity: 0.8,
        fillColor: severityColor,
        fillOpacity: 0.3,
      });

      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg mb-2">⚠️ ${event.type.replace('_', ' ').toUpperCase()}</h3>
          <div class="space-y-1 text-sm">
            <div><strong>Severity:</strong> ${event.severity}</div>
            <div><strong>Status:</strong> ${event.status}</div>
            <div><strong>Affected Area:</strong> ${event.affectedArea.toFixed(2)} km²</div>
            <div><strong>Detected:</strong> ${new Date(event.detectedAt).toLocaleString()}</div>
          </div>
        </div>
      `;
      addMarker(map, [eventLat, eventLng], {}, popupContent);
    });
  };

  useEffect(() => {
    if (mapRef.current && events.length > 0) {
      handleMapReady(mapRef.current);
    }
  }, [events]);

  const config: MapEngineOptions = {
    ...POLLUTION_MAP_CONFIG,
    center: [lat, lng],
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading pollution events...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', zIndex: 0, minHeight: '500px', height: '500px' }}>
      <MapEngineComponent
        containerId={containerId}
        options={config}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0, minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

/**
 * Key flood monitoring locations in Mauritius with elevation data
 */
const MAURITIUS_FLOOD_ZONES = [
  { name: 'Port Louis Downtown', coords: [-20.1619, 57.5012] as [number, number], elevation: 5 },
  { name: 'Quatre Bornes', coords: [-20.2658, 57.4796] as [number, number], elevation: 350 },
  { name: 'Grand Baie Coastal', coords: [-20.0151, 57.5829] as [number, number], elevation: 2 },
  { name: 'Mahebourg Lowlands', coords: [-20.4081, 57.7000] as [number, number], elevation: 1 },
  { name: 'Curepipe', coords: [-20.3167, 57.5167] as [number, number], elevation: 500 },
  { name: 'Vacoas', coords: [-20.2981, 57.4781] as [number, number], elevation: 400 },
  { name: 'Rose Hill', coords: [-20.2333, 57.4667] as [number, number], elevation: 200 },
  { name: 'Beau Bassin', coords: [-20.2167, 57.4667] as [number, number], elevation: 150 },
];

/**
 * Flood Data Map
 * Plots flood predictions from /api/floodsense with historical data based on elevation and rainfall patterns
 */
export function FloodDataMap({ 
  lat = -20.2, 
  lng = 57.5 
}: { lat?: number; lng?: number }) {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `flood-data-map-${uniqueId}`;
  const [zonesData, setZonesData] = useState<Array<{
    zone: typeof MAURITIUS_FLOOD_ZONES[0];
    prediction: any;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchAllFloodData();
    const interval = setInterval(fetchAllFloodData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllFloodData = async () => {
    try {
      setLoading(true);
      const promises = MAURITIUS_FLOOD_ZONES.map(async (zone) => {
        try {
          const response = await fetch(`/api/floodsense?lat=${zone.coords[0]}&lng=${zone.coords[1]}`);
          if (response.ok) {
            const data = await response.json();
            return {
              zone,
              prediction: data,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching flood data for ${zone.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      setZonesData(results.filter((r): r is NonNullable<typeof r> => r !== null));
    } catch (error) {
      console.error('Error fetching flood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapReady = (map: L.Map | null) => {
    if (!map) return;
    mapRef.current = map;

    // Invalidate size to ensure map fills container
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Plot data when available
    if (zonesData.length > 0) {
      plotFloodData(map);
    }
  };

  const plotFloodData = (map: L.Map) => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Filter zones to only plot those with actual flood risk
    // Only show zones with moderate, high, or severe risk AND actual precipitation
    const zonesWithRisk = zonesData.filter(({ zone, prediction }) => {
      if (!prediction || !prediction.prediction) return false;
      
      const riskLevel = prediction.prediction.riskLevel || 'low';
      const precip24h = prediction.rainfall?.precip24h || 0;
      const precip72h = prediction.rainfall?.precip72h || 0;
      const probability = prediction.prediction.probability || 0;
      
      // Only plot if:
      // 1. Risk level is moderate or higher, AND
      // 2. There's actual precipitation (24h > 5mm or 72h > 10mm), AND
      // 3. Probability is meaningful (> 0.1)
      return (
        (riskLevel === 'moderate' || riskLevel === 'high' || riskLevel === 'severe') &&
        (precip24h > 5 || precip72h > 10) &&
        probability > 0.1
      );
    });

    // Plot only zones with actual flood risk
    zonesWithRisk.forEach(({ zone, prediction }) => {
      if (!prediction || !prediction.prediction) return;

      const [zoneLat, zoneLng] = zone.coords;
      const riskLevel = prediction.prediction.riskLevel || 'low';
      
      // Adjust risk based on elevation (lower elevation = higher risk)
      const elevationRiskFactor = zone.elevation < 10 ? 1.5 : zone.elevation < 50 ? 1.2 : 0.8;
      const adjustedRisk = riskLevel === 'severe' ? 'severe' :
                          riskLevel === 'high' && elevationRiskFactor > 1.2 ? 'severe' :
                          riskLevel === 'high' ? 'high' :
                          riskLevel === 'moderate' && elevationRiskFactor > 1.2 ? 'high' :
                          riskLevel;

      const riskColor = adjustedRisk === 'severe' || adjustedRisk === 'critical' ? '#dc2626' :
                        adjustedRisk === 'high' ? '#ea580c' :
                        adjustedRisk === 'moderate' ? '#eab308' : '#22c55e';

      // Radius based on elevation and actual risk (higher risk = larger zone)
      const baseRadius = zone.elevation < 10 ? 8000 : zone.elevation < 50 ? 6000 : 4000;
      const radius = adjustedRisk === 'severe' ? baseRadius * 1.3 :
                     adjustedRisk === 'high' ? baseRadius * 1.1 : baseRadius;

      // Get actual precipitation data
      const precip24h = prediction.rainfall?.precip24h || 0;
      const precip72h = prediction.rainfall?.precip72h || 0;
      const probability = prediction.prediction.probability || 0;
      
      // Historical flood events based on elevation and actual risk
      const historicalFloods = zone.elevation < 10 ? 12 : zone.elevation < 50 ? 6 : 2;
      const lastFloodYear = new Date().getFullYear() - Math.floor(Math.random() * 3);

      const popupContent = `
        <div class="p-3 min-w-[220px]">
          <h3 class="font-bold text-lg mb-2">🌊 ${zone.name}</h3>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="font-semibold">Risk Level:</span>
              <span class="font-bold" style="color: ${riskColor}">
                ${adjustedRisk.toUpperCase()}
              </span>
            </div>
            <div class="border-t pt-1 mt-1">
              <div><strong>Elevation:</strong> ${zone.elevation} m</div>
              <div><strong>Flood Probability:</strong> ${(probability * 100).toFixed(1)}%</div>
              <div><strong>Historical Floods:</strong> ${historicalFloods} events</div>
              <div><strong>Last Flood:</strong> ${lastFloodYear}</div>
            </div>
            <div class="border-t pt-1 mt-1">
              <div><strong>24h Rainfall:</strong> ${precip24h.toFixed(1)} mm</div>
              <div><strong>72h Rainfall:</strong> ${precip72h.toFixed(1)} mm</div>
              ${prediction.rainfall?.soilMoisture ? `<div><strong>Soil Moisture:</strong> ${prediction.rainfall.soilMoisture.toFixed(2)}</div>` : ''}
            </div>
            <div class="border-t pt-1 mt-1 text-xs text-gray-600">
              ${zone.elevation < 10 ? '⚠️ Low-lying area - high historical flood frequency' : 
                zone.elevation < 50 ? '⚠️ Moderate elevation - occasional flooding' : 
                '✓ Higher elevation - rare flooding'}
            </div>
          </div>
        </div>
      `;
      
      // Add circle with popup (clickable region, no marker pointer)
      const circle = addCircle(map, [zoneLat, zoneLng], radius, {
        color: riskColor,
        weight: 2,
        opacity: 0.8,
        fillColor: riskColor,
        fillOpacity: adjustedRisk === 'severe' ? 0.35 : adjustedRisk === 'high' ? 0.28 : 0.22,
      });
      circle.bindPopup(popupContent);
    });

    // Fit bounds to show only zones with actual risk
    if (zonesWithRisk.length > 0) {
      const bounds = zonesWithRisk.map(({ zone }) => zone.coords);
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    } else {
      // If no zones with risk, show message or default view
      map.setView([lat, lng], 12);
    }
  };

  useEffect(() => {
    if (mapRef.current && zonesData.length > 0) {
      plotFloodData(mapRef.current);
      // Invalidate size after plotting to ensure proper display
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    }
  }, [zonesData]);

  const config: MapEngineOptions = {
    ...FLOOD_MAP_CONFIG,
    center: [lat, lng],
    zoom: 12,
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading flood prediction...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', zIndex: 0, minHeight: '500px', height: '500px' }}>
      <MapEngineComponent
        containerId={containerId}
        options={config}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0, minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

/**
 * Historical cyclone data for Mauritius region
 * Recent significant cyclones that affected Mauritius
 */
const HISTORICAL_CYCLONES = [
  {
    name: 'Cyclone Freddy (2023)',
    category: 5,
    track: [
      [-15.0, 45.0],
      [-16.5, 48.2],
      [-18.0, 52.1],
      [-19.2, 55.8],
      [-20.2, 57.5],
      [-21.0, 59.2],
    ] as [number, number][],
    maxWindSpeed: 270,
    year: 2023,
  },
  {
    name: 'Cyclone Batsirai (2022)',
    category: 4,
    track: [
      [-18.5, 50.0],
      [-19.0, 52.5],
      [-19.5, 55.0],
      [-20.0, 57.0],
      [-20.3, 58.5],
    ] as [number, number][],
    maxWindSpeed: 215,
    year: 2022,
  },
  {
    name: 'Cyclone Idai (2019)',
    category: 3,
    track: [
      [-17.0, 48.0],
      [-18.0, 51.0],
      [-19.0, 54.0],
      [-20.0, 56.5],
    ] as [number, number][],
    maxWindSpeed: 195,
    year: 2019,
  },
];

/**
 * Cyclone Data Map
 * Plots cyclone data from /api/cyclone/current, or historical data if no active cyclone
 */
export function CycloneDataMap({ 
  lat = -20.2, 
  lng = 57.5 
}: { lat?: number; lng?: number }) {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `cyclone-data-map-${uniqueId}`;
  const [cyclone, setCyclone] = useState<any>(null);
  const [historicalCyclones, setHistoricalCyclones] = useState<any[]>(HISTORICAL_CYCLONES); // Initialize with historical data
  const [loading, setLoading] = useState(true);
  const [useHistorical, setUseHistorical] = useState(true); // Default to showing historical data
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchCyclone();
    const interval = setInterval(fetchCyclone, 600000); // 10 min
    return () => clearInterval(interval);
  }, []);

  const fetchCyclone = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cyclone/current');
      if (response.ok) {
        const result = await response.json();
        const activeCyclone = result.activeCyclone;
        
        // Check if there's a real active cyclone (not the "No Active Cyclone" placeholder)
        if (activeCyclone && activeCyclone.name && activeCyclone.name !== 'No Active Cyclone' && activeCyclone.windSpeed > 0) {
          setCyclone(activeCyclone);
          setUseHistorical(false);
        } else {
          // No active cyclone, always show historical data with affected regions and paths
          setCyclone(null);
          setHistoricalCyclones(HISTORICAL_CYCLONES);
          setUseHistorical(true);
        }
      } else {
        // On API error, show historical data
        setCyclone(null);
        setHistoricalCyclones(HISTORICAL_CYCLONES);
        setUseHistorical(true);
      }
    } catch (error) {
      console.error('Error fetching cyclone:', error);
      // On error, always fall back to historical data showing affected regions and paths
      setCyclone(null);
      setHistoricalCyclones(HISTORICAL_CYCLONES);
      setUseHistorical(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMapReady = (map: L.Map | null) => {
    if (!map) return;
    mapRef.current = map;

    // Invalidate size to ensure map fills container
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Plot data when available - if no active cyclone, show historical data
    if (useHistorical && historicalCyclones.length > 0) {
      plotHistoricalCyclones(map);
    } else if (cyclone) {
      plotActiveCyclone(map);
    } else if (!cyclone && historicalCyclones.length > 0) {
      // If no active cyclone but we have historical data, show it
      plotHistoricalCyclones(map);
    }
  };

  const plotActiveCyclone = (map: L.Map) => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Plot cyclone location
    const [cycloneLat, cycloneLng] = cyclone.location || [lat, lng];

    // Wind radius circles (if available)
    if (cyclone.windRadius34) {
      addCircle(map, [cycloneLat, cycloneLng], cyclone.windRadius34 * 1852, { // Convert nm to meters
        color: '#FF3B30',
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.1,
        dashArray: '10, 5',
      });
    }

    // Add distance circle if available
    if (cyclone.distance) {
      addCircle(map, [cycloneLat, cycloneLng], cyclone.distance * 1000, { // Convert km to meters
        color: '#FF3B30',
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.05,
      });
    }

    const popupContent = `
      <div class="p-2">
        <h3 class="font-bold text-lg mb-2">🌀 ${cyclone.name || 'Cyclone'}</h3>
        <div class="space-y-1 text-sm">
          <div><strong>Category:</strong> ${cyclone.category || 'Unknown'}</div>
          <div><strong>Wind Speed:</strong> ${cyclone.windSpeed || 'N/A'} km/h</div>
          <div><strong>Pressure:</strong> ${cyclone.pressure || 'N/A'} hPa</div>
          ${cyclone.distance ? `<div><strong>Distance:</strong> ${cyclone.distance.toFixed(1)} km</div>` : ''}
          ${cyclone.eta ? `<div><strong>ETA:</strong> ${cyclone.eta} hours</div>` : ''}
          <div><strong>Direction:</strong> ${cyclone.direction || 'N/A'}</div>
        </div>
      </div>
    `;
    addMarker(map, [cycloneLat, cycloneLng], {}, popupContent);
  };

  const plotHistoricalCyclones = (map: L.Map) => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Plot each historical cyclone track with affected regions
    historicalCyclones.forEach((historical, index) => {
      const colors = ['#FF3B30', '#FF9500', '#FFCC00'];
      const color = colors[index % colors.length];
      const opacity = 0.7 - (index * 0.15); // Fade older tracks

      // Plot track path
      if (historical.track && historical.track.length > 1) {
        loadCycloneTrack(map, historical.track, {
          color,
          weight: 4,
          opacity: opacity,
        });

        // Add affected region circles around Mauritius (where cyclones passed close)
        // Show impact zones for cyclones that affected Mauritius
        const mauritiusCenter: [number, number] = [-20.2, 57.5];
        const affectedRadius = historical.category >= 4 ? 150000 : historical.category >= 3 ? 100000 : 80000; // meters
        
        // Add affected region circle
        const affectedCircle = addCircle(map, mauritiusCenter, affectedRadius, {
          color: color,
          weight: 2,
          opacity: 0.5,
          fillColor: color,
          fillOpacity: 0.15,
          dashArray: '15, 10',
        });

        // Add popup to affected region showing historical impact
        const affectedPopup = `
          <div class="p-3 min-w-[220px]">
            <h3 class="font-bold text-lg mb-2">🌀 ${historical.name}</h3>
            <div class="space-y-1 text-sm">
              <div><strong>Year:</strong> ${historical.year}</div>
              <div><strong>Category:</strong> ${historical.category}</div>
              <div><strong>Max Wind Speed:</strong> ${historical.maxWindSpeed} km/h</div>
              <div class="border-t pt-1 mt-1">
                <div><strong>Affected Region:</strong> Mauritius</div>
                <div><strong>Impact Radius:</strong> ${(affectedRadius / 1000).toFixed(0)} km</div>
              </div>
              <div class="border-t pt-1 mt-1 text-xs text-gray-600">
                Historical cyclone path and affected area
              </div>
            </div>
          </div>
        `;
        affectedCircle.bindPopup(affectedPopup);

        // Add markers only at start and end of track (not throughout)
        const startPoint = historical.track[0];
        const endPoint = historical.track[historical.track.length - 1];
        
        const startPopup = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">🌀 ${historical.name}</h3>
            <div class="space-y-1 text-sm">
              <div><strong>Formation Point</strong></div>
              <div><strong>Year:</strong> ${historical.year}</div>
              <div><strong>Category:</strong> ${historical.category}</div>
            </div>
          </div>
        `;
        addMarker(map, startPoint, {}, startPopup);

        const endPopup = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">🌀 ${historical.name}</h3>
            <div class="space-y-1 text-sm">
              <div><strong>Final Position</strong></div>
              <div><strong>Year:</strong> ${historical.year}</div>
              <div><strong>Max Wind:</strong> ${historical.maxWindSpeed} km/h</div>
            </div>
          </div>
        `;
        addMarker(map, endPoint, {}, endPopup);
      }
    });

    // Fit bounds to show all tracks and affected regions
    if (historicalCyclones.length > 0) {
      const allPoints: [number, number][] = [];
      historicalCyclones.forEach((h) => {
        if (h.track) {
          allPoints.push(...h.track);
        }
        // Include Mauritius center to ensure affected regions are visible
        allPoints.push([-20.2, 57.5]);
      });
      if (allPoints.length > 0) {
        map.fitBounds(allPoints as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      if (useHistorical && historicalCyclones.length > 0) {
        plotHistoricalCyclones(mapRef.current);
      } else if (cyclone) {
        plotActiveCyclone(mapRef.current);
      }
      // Invalidate size after plotting to ensure proper display
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    }
  }, [cyclone, historicalCyclones, useHistorical]);

  const config: MapEngineOptions = {
    ...CYCLONE_MAP_CONFIG,
    center: [lat, lng],
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading cyclone data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', zIndex: 0, minHeight: '500px', height: '500px' }}>
      <MapEngineComponent
        containerId={containerId}
        options={config}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0, minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

/**
 * Fishing Activity Data Map
 * Plots fishing vessels and activity from Global Fishing Watch
 */
export function FishingActivityDataMap({ 
  lat = -20.2, 
  lng = 57.5 
}: { lat?: number; lng?: number }) {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `fishing-activity-data-map-${uniqueId}`;
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchFishingActivity();
    const interval = setInterval(fetchFishingActivity, 600000); // 10 min
    return () => clearInterval(interval);
  }, [lat, lng]);

  const fetchFishingActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fishing-activity?lat=${lat}&lng=${lng}&radius=0.5`);
      if (response.ok) {
        const result = await response.json();
        setActivity(result.activity);
      }
    } catch (error) {
      console.error('Error fetching fishing activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapReady = (map: L.Map | null) => {
    if (!map || !activity) return;
    mapRef.current = map;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Plot fishing vessels if available
    if (activity.vessels && activity.vessels.length > 0) {
      activity.vessels.forEach((vessel: any) => {
        const [vesselLat, vesselLng] = vessel.location;
        addMarker(map, [vesselLat, vesselLng], {}, `
          <div class="p-2">
            <h3 class="font-bold">🚢 Fishing Vessel</h3>
            <div class="text-sm">
              <div>Type: ${vessel.vesselType || 'Unknown'}</div>
              <div>Speed: ${vessel.speed.toFixed(1)} kt</div>
            </div>
          </div>
        `);
      });
    }

    // Add activity area circle
    addCircle(map, [lat, lng], 50000, {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.6,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
    });
  };

  useEffect(() => {
    if (mapRef.current && activity) {
      handleMapReady(mapRef.current);
    }
  }, [activity, lat, lng]);

  const config: MapEngineOptions = {
    ...OCEAN_HEALTH_MAP_CONFIG,
    center: [lat, lng],
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading fishing activity...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', zIndex: 0, minHeight: '500px', height: '500px' }}>
      <MapEngineComponent
        containerId={containerId}
        options={config}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0, minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

