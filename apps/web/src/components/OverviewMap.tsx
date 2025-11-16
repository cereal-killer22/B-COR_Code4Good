'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import BaseMapboxMap from './BaseMapboxMap';
import { 
  addMapboxMarker, 
  addMapboxPolygon,
  addMapboxHeatmap,
  registerMapboxLayer,
} from '@/lib/map/MapboxEngine';
import { useLayerToggle } from '@/contexts/LayerToggleContext';
import type { FloodPrediction } from '@climaguard/shared/types/climate';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';

interface OverviewMapProps {
  lat?: number;
  lng?: number;
}

interface RegionData {
  location: { lat: number; lon: number };
  bounds: [[number, number], [number, number]];
  rawData: {
    sst: number;
    hotspot: number;
    dhw: number;
    turbidity?: number;
    chlorophyll?: number;
    ph?: number;
    dissolvedOxygen?: number;
  };
  metrics: {
    waterQuality: {
      pH: number;
      temperature: number;
      salinity: number;
      dissolvedOxygen: number;
      turbidity: number;
      chlorophyll: number;
      score: number;
    };
    pollution: {
      plasticDensity: number;
      oilSpillRisk: number;
      chemicalPollution: number;
      overallIndex: number;
    };
    biodiversity: {
      speciesCount: number;
      endangeredSpecies: number;
      biodiversityIndex: number;
    };
    reefHealth: {
      bleachingRisk: string;
      healthIndex: number;
      temperature: number;
      pH: number;
      coverage: number;
    };
  };
  prediction: {
    score: number;
    riskLevel: string;
  };
}

interface StoredFloodPoint {
  location_lat: number;
  location_lng: number;
  risk_level: string;
  probability: number;
  estimated_depth: number;
  confidence: number;
}

const FLOOD_PRONE_AREAS = [
  { name: 'Port Louis', lat: -20.1619, lng: 57.4989 },
  { name: 'Beau Bassin', lat: -20.2333, lng: 57.4667 },
  { name: 'Curepipe', lat: -20.3167, lng: 57.5167 },
  { name: 'Quatre Bornes', lat: -20.2667, lng: 57.4833 },
  { name: 'Rose Hill', lat: -20.2333, lng: 57.4667 },
  { name: 'Vacoas', lat: -20.3000, lng: 57.4833 },
  { name: 'Grand Baie', lat: -20.0167, lng: 57.5833 },
  { name: 'Mahebourg', lat: -20.4081, lng: 57.7000 },
];

export default function OverviewMap({ lat = -20.2, lng = 57.5 }: OverviewMapProps) {
  // Ocean Health State
  const [regions, setRegions] = useState<Record<string, RegionData>>({});
  const [coralReefs, setCoralReefs] = useState<any[]>([]);
  
  // Flood State
  const [floodPrediction, setFloodPrediction] = useState<FloodPrediction | null>(null);
  const [storedFloodPoints, setStoredFloodPoints] = useState<StoredFloodPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map Refs
  const mapRef = useRef<MapboxMap | null>(null);
  const oceanMarkersRef = useRef<Marker[]>([]);
  const floodMarkersRef = useRef<Marker[]>([]);
  const regionLayersRef = useRef<string[]>([]);
  const floodLayersRef = useRef<string[]>([]);
  const containerId = useMemo(() => `overview-map-${Math.random().toString(36).substr(2, 9)}`, []);
  const { layers } = useLayerToggle();

  // Fetch Ocean Health Data
  useEffect(() => {
    const fetchOceanHealth = async () => {
      try {
        const response = await fetch(`/api/oceanhealth?lat=${lat}&lng=${lng}`);
        if (response.ok) {
          const data = await response.json();
          if (data.regions) {
            setRegions(data.regions);
            console.log('OverviewMap: Loaded regions', Object.keys(data.regions));
          }
        }
      } catch (err) {
        console.error('Error fetching ocean health:', err);
      }
    };

    fetchOceanHealth();
    const interval = setInterval(fetchOceanHealth, 300000); // 5 min
    return () => clearInterval(interval);
  }, [lat, lng]);

  // Fetch Coral Reef Data
  useEffect(() => {
    const fetchCoralReefs = async () => {
      try {
        const response = await fetch('/api/coral-reef-health');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCoralReefs(result.data);
          }
        }
      } catch (err) {
        console.error('Error fetching coral reef data:', err);
      }
    };

    fetchCoralReefs();
    const interval = setInterval(fetchCoralReefs, 1800000); // 30 min
    return () => clearInterval(interval);
  }, []);

  // Fetch Flood Data
  useEffect(() => {
    const fetchFloodData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [predictionRes, storedRes] = await Promise.allSettled([
          fetch(`/api/floodsense?lat=${lat}&lng=${lng}`),
          fetch('/api/stored-flood-predictions')
        ]);

        if (predictionRes.status === 'fulfilled' && predictionRes.value.ok) {
          const predictionData = await predictionRes.value.json();
          setFloodPrediction(predictionData);
        }

        if (storedRes.status === 'fulfilled' && storedRes.value.ok) {
          const storedData = await storedRes.value.json();
          if (storedData.success && storedData.data) {
            setStoredFloodPoints(storedData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching flood data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch flood data');
      } finally {
        setLoading(false);
      }
    };

    fetchFloodData();
    const interval = setInterval(fetchFloodData, 300000); // 5 min
    return () => clearInterval(interval);
  }, [lat, lng]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#ea580c';
    return '#dc2626';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const generateRainfallHeatmapPoints = (hourlyPrecip: number[], centerLat: number, centerLng: number, spread: number): [number, number, number][] => {
    const points: [number, number, number][] = [];
    hourlyPrecip.forEach((precip, hour) => {
      if (precip > 0) {
        const angle = (hour / 24) * Math.PI * 2;
        const distance = spread * (0.3 + Math.random() * 0.7);
        points.push([
          centerLng + distance * Math.sin(angle) * 0.01, // lng first
          centerLat + distance * Math.cos(angle) * 0.01, // lat second
          Math.min(1, precip / 50), // intensity third
        ]);
      }
    });
    return points;
  };

  const updateOceanHealthLayers = (map: MapboxMap) => {
    if (!map.loaded() || !map.getContainer()) {
      map.once('load', () => {
        if (mapRef.current) {
          updateOceanHealthLayers(mapRef.current);
        }
      });
      return;
    }

    // Clear existing ocean markers
    oceanMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    oceanMarkersRef.current = [];

    // Clear existing region layers
    regionLayersRef.current.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(`${layerId}-stroke`)) map.removeLayer(`${layerId}-stroke`);
        if (map.getSource(layerId)) map.removeSource(layerId);
      } catch (e) {
        // Ignore errors
      }
    });
    regionLayersRef.current = [];

    // Add coral reef regions if enabled
    if (layers.oceanHealth.coastalSegments && Object.keys(regions).length > 0) {
      Object.entries(regions).forEach(([regionKey, regionData]) => {
        try {
          const bounds = regionData.bounds;
          const polygon: [number, number][] = [
            [bounds[0][0], bounds[0][1]],
            [bounds[1][0], bounds[0][1]],
            [bounds[1][0], bounds[1][1]],
            [bounds[0][0], bounds[1][1]],
            [bounds[0][0], bounds[0][1]],
          ];

          const score = regionData.prediction.score;
          const color = getScoreColor(score);
          const layerId = `overview-region-${regionKey}`;

          addMapboxPolygon(map, polygon, {
            layerId,
            color,
            fillOpacity: 0.2,
            strokeColor: color,
            strokeWidth: 2,
          });

          regionLayersRef.current.push(layerId);
          registerMapboxLayer(map, `region${regionKey}`, layerId);

          // Add click handler
          map.on('click', layerId, (e) => {
            if (e.originalEvent) {
              e.originalEvent.stopPropagation();
            }
            
            const Mapbox = require('mapbox-gl').default;
            const popup = new Mapbox.Popup({ 
              offset: 24,
              closeOnClick: false,
              closeButton: true,
            });
            
            const metrics = regionData.metrics || {};
            const wq = metrics.waterQuality || {};
            const reef = metrics.reefHealth || {};

            popup.setHTML(`
              <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;padding:14px;">
                <h3 style="margin:0 0 10px;font-size:18px;font-weight:600;color:#222;">🪸 ${regionKey} Region</h3>
                <div style="margin-bottom:12px;padding:10px;background:${color}15;border-radius:6px;">
                  <div style="font-size:12px;color:#666;margin-bottom:4px;">Health Score</div>
                  <div style="font-size:24px;font-weight:700;color:${color};">
                    ${score}/100
                  </div>
                </div>
                <div style="font-size:13px;space-y:6px;">
                  <div><strong>Water Quality:</strong> ${wq.score || 0}/100</div>
                  <div><strong>Reef Health:</strong> ${reef.healthIndex || 0}/100</div>
                  <div><strong>Bleaching Risk:</strong> ${reef.bleachingRisk || 'low'}</div>
                </div>
              </div>
            `);
            
            popup.setLngLat(e.lngLat).addTo(map);
          });
        } catch (e) {
          console.error(`Error adding region ${regionKey}:`, e);
        }
      });
    }

    // Add coral reef markers if enabled
    if (layers.oceanHealth.reefHealth && coralReefs.length > 0) {
      coralReefs.forEach((reef) => {
        try {
          const color = getRiskColor(reef.bleaching_severity || 'low');
          const popupHTML = `
            <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;padding:12px;">
              <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">🪸 ${reef.reef_name}</h3>
              <div style="font-size:13px;space-y:4px;">
                <div><strong>Health:</strong> ${reef.health_status}</div>
                <div><strong>Coral Cover:</strong> ${reef.coral_cover_percentage}%</div>
                <div><strong>Bleaching:</strong> ${reef.bleaching_severity}</div>
              </div>
            </div>
          `;

          const marker = addMapboxMarker(
            map,
            [reef.location_lng, reef.location_lat],
            { color, size: 16 },
            popupHTML
          );
          oceanMarkersRef.current.push(marker);
        } catch (e) {
          console.error('Error adding coral reef marker:', e);
        }
      });
    }
  };

  const updateFloodLayers = (map: MapboxMap) => {
    if (!map.loaded() || !map.getContainer()) {
      map.once('load', () => {
        if (mapRef.current) {
          updateFloodLayers(mapRef.current);
        }
      });
      return;
    }

    // Clear existing flood markers
    floodMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    floodMarkersRef.current = [];

    // Clear existing flood layers
    floodLayersRef.current.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      } catch (e) {
        // Ignore errors
      }
    });
    floodLayersRef.current = [];

    if (!floodPrediction) return;

    // Add rainfall heatmaps if enabled
    if (layers.flood.rainfallNow && floodPrediction.rainfall?.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        floodPrediction.rainfall.hourlyPrecip,
        lat,
        lng,
        0.15
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'overview-rainfall-now',
          radius: 30,
          maxIntensity: 1.0,
          colorStops: [
            [0, 'rgba(59, 130, 246, 0)'],
            [0.2, 'rgba(59, 130, 246, 0.3)'],
            [0.5, 'rgba(34, 197, 94, 0.5)'],
            [0.7, 'rgba(234, 179, 8, 0.7)'],
            [1.0, 'rgba(220, 38, 38, 0.9)'],
          ],
        });
        floodLayersRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfallNow', layerId);
      }
    }

    if (layers.flood.rainfall24h && floodPrediction.rainfall?.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        floodPrediction.rainfall.hourlyPrecip,
        lat,
        lng,
        0.2
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'overview-rainfall-24h',
          radius: 35,
          maxIntensity: 1.0,
          colorStops: [
            [0, 'rgba(234, 88, 12, 0)'],
            [0.2, 'rgba(234, 88, 12, 0.3)'],
            [0.5, 'rgba(234, 88, 12, 0.5)'],
            [0.7, 'rgba(234, 88, 12, 0.7)'],
            [1.0, 'rgba(220, 38, 38, 0.9)'],
          ],
        });
        floodLayersRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfall24h', layerId);
      }
    }

    if (layers.flood.rainfall72h && floodPrediction.rainfall?.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        floodPrediction.rainfall.hourlyPrecip,
        lat,
        lng,
        0.25
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'overview-rainfall-72h',
          radius: 40,
          maxIntensity: 1.0,
          colorStops: [
            [0, 'rgba(234, 179, 8, 0)'],
            [0.2, 'rgba(234, 179, 8, 0.3)'],
            [0.5, 'rgba(234, 179, 8, 0.5)'],
            [0.7, 'rgba(234, 88, 12, 0.7)'],
            [1.0, 'rgba(220, 38, 38, 0.9)'],
          ],
        });
        floodLayersRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfall72h', layerId);
      }
    }

    // Add flood risk markers if enabled
    if (layers.flood.floodZones && floodPrediction?.prediction) {
      const color = getRiskColor(floodPrediction.prediction.riskLevel);
      const popupHTML = `
        <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;padding:14px;">
          <h3 style="margin:0 0 10px;font-size:18px;font-weight:600;color:#222;">🌊 Flood Risk</h3>
          <div style="font-size:13px;space-y:6px;">
            <div><strong>Risk Level:</strong> <span style="color:${color};font-weight:700;">${floodPrediction.prediction.riskLevel.toUpperCase()}</span></div>
            <div><strong>Probability:</strong> ${(floodPrediction.prediction.probability * 100).toFixed(1)}%</div>
            <div><strong>24h Rainfall:</strong> ${floodPrediction.rainfall?.precip24h?.toFixed(1) || 0} mm</div>
            <div><strong>72h Rainfall:</strong> ${floodPrediction.rainfall?.precip72h?.toFixed(1) || 0} mm</div>
          </div>
        </div>
      `;

      const marker = addMapboxMarker(
        map,
        [lng, lat],
        { color, size: 20 },
        popupHTML
      );
      floodMarkersRef.current.push(marker);

      // Add markers for flood-prone areas
      if (['moderate', 'high', 'severe'].includes(floodPrediction.prediction.riskLevel)) {
        FLOOD_PRONE_AREAS.forEach((area) => {
          const distance = Math.sqrt(
            Math.pow(area.lat - lat, 2) + Math.pow(area.lng - lng, 2)
          );
          
          if (distance < 0.2) {
            const areaRisk = floodPrediction.prediction.riskLevel === 'severe' ? 'high' :
                            floodPrediction.prediction.riskLevel === 'high' ? 'moderate' : 'low';
            const areaColor = getRiskColor(areaRisk);
            
            const areaMarker = addMapboxMarker(
              map,
              [area.lng, area.lat],
              { color: areaColor, size: 14 },
              `<div style="width:200px;padding:10px;"><strong>${area.name}</strong><br/>Local Risk: ${areaRisk}</div>`
            );
            floodMarkersRef.current.push(areaMarker);
          }
        });
      }
    }
  };

  const handleMapReady = (map: MapboxMap | null) => {
    if (!map) return;
    mapRef.current = map;
    console.log('OverviewMap: Map ready', { regions: Object.keys(regions).length, coralReefs: coralReefs.length, floodPrediction: !!floodPrediction });
    
    // Initial layer updates
    setTimeout(() => {
      updateOceanHealthLayers(map);
      updateFloodLayers(map);
    }, 500);
  };

  // Update layers when data or toggles change
  useEffect(() => {
    if (mapRef.current) {
      console.log('OverviewMap: Updating layers', { 
        regionsCount: Object.keys(regions).length, 
        coralReefsCount: coralReefs.length, 
        hasFloodData: !!floodPrediction,
        coastalSegments: layers.oceanHealth.coastalSegments,
        reefHealth: layers.oceanHealth.reefHealth,
        floodZones: layers.flood.floodZones
      });
      updateOceanHealthLayers(mapRef.current);
      updateFloodLayers(mapRef.current);
    }
  }, [regions, coralReefs, floodPrediction, layers]);

  // Don't block rendering - show map even while loading

  return (
    <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden">
      <BaseMapboxMap
        containerId={containerId}
        center={[lng, lat]}
        zoom={10}
        onMapReady={handleMapReady}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

