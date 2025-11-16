'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import BaseMapboxMap from './BaseMapboxMap';
import { 
  addMapboxMarker, 
  addMapboxHeatmap,
  registerMapboxLayer,
  showMapboxLayer,
  hideMapboxLayer,
} from '@/lib/map/MapboxEngine';
import { useLayerToggle } from '@/contexts/LayerToggleContext';
import type { FloodPrediction } from '@climaguard/shared/types/climate';
import type { Map as MapboxMap, Marker, Popup } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

interface FloodMapProps {
  lat?: number;
  lng?: number;
  showStoredPredictions?: boolean;
}

interface StoredFloodPoint {
  location_lat: number;
  location_lng: number;
  risk_level: string;
  probability: number;
  estimated_depth: number;
  confidence: number;
}

export default function FloodMap({ lat = -20.2, lng = 57.5, showStoredPredictions = true }: FloodMapProps) {
  const [prediction, setPrediction] = useState<FloodPrediction | null>(null);
  const [storedPoints, setStoredPoints] = useState<StoredFloodPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const additionalMarkersRef = useRef<Marker[]>([]);
  const layerIdsRef = useRef<string[]>([]);
  const heatmapLayerAdded = useRef(false);
  const containerId = useMemo(() => `flood-map-${Math.random().toString(36).substr(2, 9)}`, []);
  const { layers } = useLayerToggle();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/floodsense?lat=${lat}&lng=${lng}`);
        if (response.ok) {
          const data = await response.json();
          setPrediction(data);
        } else {
          setError('Failed to fetch flood prediction');
        }
      } catch (err) {
        console.error('Error fetching flood prediction:', err);
        setError('Error loading flood data');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 300000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  // Fetch stored grid predictions from Supabase
  useEffect(() => {
    if (!showStoredPredictions) return;

    const fetchStoredPredictions = async () => {
      try {
        const response = await fetch('/api/stored-flood-predictions?hours=24');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setStoredPoints(result.data);
            console.log(`Loaded ${result.data.length} stored flood predictions`);
          }
        }
      } catch (err) {
        console.error('Error fetching stored predictions:', err);
      }
    };

    fetchStoredPredictions();
    const interval = setInterval(fetchStoredPredictions, 600000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, [showStoredPredictions]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Known flood-prone areas in Mauritius (approximate coordinates)
  const FLOOD_PRONE_AREAS: Array<{ lat: number; lng: number; name: string; riskMultiplier: number }> = [
    { lat: -20.15, lng: 57.48, name: 'Port Louis', riskMultiplier: 1.3 },
    { lat: -20.25, lng: 57.52, name: 'Plaine Wilhems', riskMultiplier: 1.2 },
    { lat: -20.30, lng: 57.55, name: 'Central Plateau', riskMultiplier: 1.1 },
    { lat: -20.18, lng: 57.60, name: 'Grand Baie', riskMultiplier: 1.15 },
    { lat: -20.35, lng: 57.50, name: 'Rose Belle', riskMultiplier: 1.25 },
  ];

  const generateRainfallHeatmapPoints = (hourlyData: number[], baseLat: number, baseLng: number, gridSize: number = 0.1): [number, number, number][] => {
    const points: [number, number, number][] = [];
    const maxPrecip = Math.max(...hourlyData, 1);
    const avgPrecip = hourlyData.reduce((a, b) => a + b, 0) / hourlyData.length;
    
    // Create a more realistic distribution based on known flood-prone areas
    // Add points around known flood zones with higher intensity
    FLOOD_PRONE_AREAS.forEach(area => {
      const distanceFromBase = Math.sqrt(
        Math.pow(area.lat - baseLat, 2) + Math.pow(area.lng - baseLng, 2)
      );
      
      // If area is within reasonable range, add enhanced points
      if (distanceFromBase < 0.3) {
        // Create cluster around flood-prone area
        for (let i = -0.05; i <= 0.05; i += 0.01) {
          for (let j = -0.05; j <= 0.05; j += 0.01) {
            const pointLng = area.lng + i;
            const pointLat = area.lat + j;
            const distance = Math.sqrt(i * i + j * j);
            const localIntensity = Math.max(0, 1 - distance / 0.05);
            
            // Use area-specific risk multiplier
            const precipValue = avgPrecip * area.riskMultiplier;
            const normalizedIntensity = Math.min(1.0, (precipValue / maxPrecip) * localIntensity * 1.5);
            
            if (normalizedIntensity > 0.05) {
              points.push([pointLng, pointLat, normalizedIntensity]);
            }
          }
        }
      }
    });
    
    // Add general grid points with realistic distribution
    for (let i = -gridSize; i <= gridSize; i += 0.03) {
      for (let j = -gridSize; j <= gridSize; j += 0.03) {
        const pointLng = baseLng + i;
        const pointLat = baseLat + j;
        const distance = Math.sqrt(i * i + j * j);
        
        // Check if point is near a flood-prone area
        let riskMultiplier = 1.0;
        FLOOD_PRONE_AREAS.forEach(area => {
          const distToArea = Math.sqrt(
            Math.pow(pointLat - area.lat, 2) + Math.pow(pointLng - area.lng, 2)
          );
          if (distToArea < 0.1) {
            riskMultiplier = Math.max(riskMultiplier, area.riskMultiplier * (1 - distToArea / 0.1));
          }
        });
        
        const intensity = Math.max(0, 1 - distance / gridSize);
        const precipIndex = Math.floor((distance / (gridSize * 2)) * hourlyData.length);
        const precipValue = (hourlyData[Math.min(precipIndex, hourlyData.length - 1)] || avgPrecip) * riskMultiplier;
        const normalizedIntensity = Math.min(1.0, (precipValue / maxPrecip) * intensity);
        
        if (normalizedIntensity > 0.02) {
          points.push([pointLng, pointLat, normalizedIntensity]);
        }
      }
    }
    
    return points;
  };

  const updateLayers = (map: MapboxMap) => {
    if (!prediction) return;

    // Clear existing layers
    layerIdsRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);
    });
    layerIdsRef.current = [];

    // Add rainfall now heatmap if enabled
    if (layers.flood.rainfallNow && prediction.rainfall.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        prediction.rainfall.hourlyPrecip.slice(0, 24),
        lat,
        lng,
        0.15
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'rainfall-now',
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
        layerIdsRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfallNow', layerId);
      }
    }

    // Add 24h forecast heatmap if enabled
    if (layers.flood.rainfall24h && prediction.rainfall.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        prediction.rainfall.hourlyPrecip,
        lat,
        lng,
        0.2
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'rainfall-24h',
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
        layerIdsRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfall24h', layerId);
      }
    }

    // Add 72h forecast heatmap if enabled
    if (layers.flood.rainfall72h && prediction.rainfall.hourlyPrecip) {
      const points = generateRainfallHeatmapPoints(
        prediction.rainfall.hourlyPrecip,
        lat,
        lng,
        0.25
      );
      if (points.length > 0) {
        const layerId = addMapboxHeatmap(map, points, {
          layerId: 'rainfall-72h',
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
        layerIdsRef.current.push(layerId);
        registerMapboxLayer(map, 'rainfall72h', layerId);
      }
    }
  };

  const updateMarker = (map: MapboxMap) => {
    if (!prediction) return;

    // Remove all existing markers
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    // Remove additional markers
    additionalMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    additionalMarkersRef.current = [];

    const color = getRiskColor(prediction.prediction.riskLevel);
    
    // Add primary marker at requested location
    const popupHTML = `
      <div style="width:320px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌊 Flood Risk Assessment</h3>
        <div style="space-y:8px;font-size:14px;">
          <div>
            <span style="font-weight:600;">Risk Level:</span>{' '}
            <span style="text-transform:uppercase;color:${color};font-weight:700;">
              ${prediction.prediction.riskLevel}
            </span>
          </div>
          <div>
            <span style="font-weight:600;">Probability:</span>{' '}
            ${(prediction.prediction.probability * 100).toFixed(1)}%
          </div>
          <div>
            <span style="font-weight:600;">24h Rainfall:</span>{' '}
            ${prediction.rainfall.precip24h.toFixed(1)} mm
          </div>
          <div>
            <span style="font-weight:600;">72h Rainfall:</span>{' '}
            ${prediction.rainfall.precip72h.toFixed(1)} mm
          </div>
          ${prediction.rainfall.soilMoisture !== undefined ? `
          <div>
            <span style="font-weight:600;">Soil Moisture:</span>{' '}
            ${(prediction.rainfall.soilMoisture * 100).toFixed(0)}%
          </div>
          ` : ''}
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#666;">
            ${prediction.prediction.explanation}
          </div>
        </div>
      </div>
    `;

    markerRef.current = addMapboxMarker(
      map,
      [lng, lat],
      {
        color,
        size: 24,
      },
      popupHTML
    );

    // Add additional markers for high-risk flood-prone areas if risk is moderate or higher
    if (['moderate', 'high', 'severe'].includes(prediction.prediction.riskLevel)) {
      FLOOD_PRONE_AREAS.forEach((area, index) => {
        const distance = Math.sqrt(
          Math.pow(area.lat - lat, 2) + Math.pow(area.lng - lng, 2)
        );
        
        // Only add markers for areas within reasonable range
        if (distance < 0.2) {
          const areaRisk = prediction.prediction.riskLevel === 'severe' ? 'high' :
                          prediction.prediction.riskLevel === 'high' ? 'moderate' : 'low';
          const areaColor = getRiskColor(areaRisk);
          
          const areaPopupHTML = `
            <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:14px;">
              <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">📍 ${area.name}</h3>
              <div style="space-y:6px;font-size:13px;">
                <div>
                  <span style="font-weight:600;">Local Risk:</span>{' '}
                  <span style="text-transform:uppercase;color:${areaColor};font-weight:700;">
                    ${areaRisk}
                  </span>
                </div>
                <div>
                  <span style="font-weight:600;">24h Rainfall:</span>{' '}
                  ${(prediction.rainfall.precip24h * area.riskMultiplier).toFixed(1)} mm
                </div>
                <div style="font-size:11px;color:#666;margin-top:8px;">
                  Known flood-prone area
                </div>
              </div>
            </div>
          `;

          // Use setTimeout to avoid marker conflicts
          setTimeout(() => {
            const marker = addMapboxMarker(
              map,
              [area.lng, area.lat],
              {
                color: areaColor,
                size: 18,
              },
              areaPopupHTML
            );
            additionalMarkersRef.current.push(marker);
          }, index * 50);
        }
      });
    }
  };

  const handleMapReady = (map: MapboxMap | null) => {
    if (!map) return;
    mapRef.current = map;

    if (prediction) {
      updateMarker(map);
      updateLayers(map);
    }

    // Add heatmap layer for stored predictions
    if (showStoredPredictions && storedPoints.length > 0) {
      addHeatmapLayer(map, storedPoints);
    }

    // Resize after data loads
    setTimeout(() => {
      map.resize();
    }, 100);
  };

  const addHeatmapLayer = (map: MapboxMap, points: StoredFloodPoint[]) => {
    if (heatmapLayerAdded.current || !map || !map.loaded() || points.length === 0) return;

    // Create GeoJSON from stored points
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: points.map(p => ({
        type: 'Feature',
        properties: {
          probability: p.probability,
          risk_level: p.risk_level,
          depth: p.estimated_depth,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.location_lng, p.location_lat]
        }
      }))
    };

    try {
      // Add source if it doesn't exist
      if (!map.getSource('flood-heatmap')) {
        map.addSource('flood-heatmap', {
          type: 'geojson',
          data: geojson
        });
      }

      // Add heatmap layer if it doesn't exist
      if (!map.getLayer('flood-heatmap-layer')) {
        map.addLayer({
          id: 'flood-heatmap-layer',
          type: 'heatmap',
          source: 'flood-heatmap',
          maxzoom: 15,
          paint: {
            // Increase weight as probability increases
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'probability'],
              0, 0,
              1, 1
            ],
            // Increase intensity as zoom level increases
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.5,
              15, 1.5
            ],
            // Color ramp for heatmap (blue → yellow → red)
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            // Adjust radius by zoom level
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              15, 20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 0.8,
              15, 0
            ]
          }
        });
      }

      // Add circle layer for individual points at high zoom
      if (!map.getLayer('flood-points-layer')) {
        map.addLayer({
          id: 'flood-points-layer',
          type: 'circle',
          source: 'flood-heatmap',
          minzoom: 8,  // Show points starting at zoom 8 instead of 12
          paint: {
            // Size circle by probability
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'probability'],
              0, 4,    // Increased from 3
              1, 12    // Increased from 10
            ],
            // Color by risk level
            'circle-color': [
              'match',
              ['get', 'risk_level'],
              'severe', '#dc2626',
              'high', '#ea580c',
              'medium', '#eab308',
              'moderate', '#eab308',
              'low', '#22c55e',
              '#6b7280' // default gray
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 2,  // Increased from 1
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 0.6,   // Start showing at zoom 8 with 60% opacity
              10, 0.9   // Full opacity at zoom 10
            ]
          }
        });

        // Add click handler for popups
        map.on('click', 'flood-points-layer', (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const props = feature.properties;
          
          if (!props) return;

          const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const riskLevel = props.risk_level || 'unknown';
          const probability = ((props.probability || 0) * 100).toFixed(1);
          const depth = (props.depth || 0).toFixed(2);
          
          const getRiskColor = (level: string) => {
            switch (level) {
              case 'severe': return '#dc2626';
              case 'high': return '#ea580c';
              case 'medium': return '#eab308';
              case 'moderate': return '#eab308';
              case 'low': return '#22c55e';
              default: return '#6b7280';
            }
          };

          const popupHTML = `
            <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;padding:12px;">
              <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">🌊 Flood Risk Prediction</h3>
              <div style="font-size:13px;line-height:1.6;">
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">Risk Level:</span>
                  <span style="text-transform:uppercase;color:${getRiskColor(riskLevel)};font-weight:600;margin-left:4px;">
                    ${riskLevel}
                  </span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">Probability:</span>
                  <span style="margin-left:4px;">${probability}%</span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">Estimated Depth:</span>
                  <span style="margin-left:4px;">${depth} meters</span>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
                  Location: ${coordinates[1].toFixed(4)}°, ${coordinates[0].toFixed(4)}°
                </div>
              </div>
            </div>
          `;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupHTML)
            .addTo(map);
        });

        // Change cursor on hover
        map.on('mouseenter', 'flood-points-layer', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'flood-points-layer', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      heatmapLayerAdded.current = true;
      console.log(`Added heatmap layer with ${points.length} points`);
    } catch (err) {
      console.error('Error adding heatmap layer:', err);
    }
  };

  useEffect(() => {
    if (mapRef.current && prediction && mapRef.current.loaded()) {
      updateMarker(mapRef.current);
      updateLayers(mapRef.current);
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [prediction, lat, lng, layers.flood]);

  // Update heatmap when stored points change
  useEffect(() => {
    if (mapRef.current && storedPoints.length > 0 && showStoredPredictions) {
      console.log(`Updating heatmap with ${storedPoints.length} points`);
      // Update existing source data if heatmap already added
      const source = mapRef.current.getSource('flood-heatmap') as mapboxgl.GeoJSONSource;
      if (source) {
        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: storedPoints.map(p => ({
            type: 'Feature',
            properties: {
              probability: p.probability,
              risk_level: p.risk_level,
              depth: p.estimated_depth,
            },
            geometry: {
              type: 'Point',
              coordinates: [p.location_lng, p.location_lat]
            }
          }))
        };
        source.setData(geojson);
        console.log('Updated heatmap source data');
      } else if (!heatmapLayerAdded.current) {
        // Add heatmap if not yet added
        console.log('Adding heatmap layer for first time');
        addHeatmapLayer(mapRef.current, storedPoints);
      }
    }
  }, [storedPoints, showStoredPredictions]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!mapRef.current) return;

    ['rainfallNow', 'rainfall24h', 'rainfall72h'].forEach(layerKey => {
      const isVisible = layers.flood[layerKey as keyof typeof layers.flood];
      if (isVisible) {
        showMapboxLayer(mapRef.current!, layerKey);
      } else {
        hideMapboxLayer(mapRef.current!, layerKey);
      }
    });
  }, [layers.flood.rainfallNow, layers.flood.rainfall24h, layers.flood.rainfall72h]);

  if (loading) {
    return (
      <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading flood prediction...</div>
      </div>
    );
  }

  // Still render map even if main prediction fails - stored predictions can still be shown
  const showMap = true; // Always show map to display stored predictions heatmap

  return (
    <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden border border-gray-300 relative">
      {error && !prediction && (
        <div className="absolute top-4 left-4 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm">
          ⚠️ Live prediction unavailable. Showing stored predictions only.
        </div>
      )}
      <BaseMapboxMap
        containerId={containerId}
        center={[lng, lat]}
        zoom={10}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
        onMapReady={handleMapReady}
      />
    </div>
  );
}
