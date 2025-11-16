'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import BaseMapboxMap from './BaseMapboxMap';
import { 
  addMapboxMarker, 
  addMapboxPolygon,
  registerMapboxLayer,
} from '@/lib/map/MapboxEngine';
import { useLayerToggle } from '@/contexts/LayerToggleContext';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

interface OceanHealthMapProps {
  lat?: number;
  lng?: number;
  showCoralReefs?: boolean;
}

interface CoralReefPoint {
  id: number;
  reef_id: string;
  location_lat: number;
  location_lng: number;
  reef_name: string;
  reef_zone: string;
  depth_meters: number;
  health_status: string;
  coral_cover_percentage: number;
  bleaching_severity: string;
  water_temperature_celsius: number;
  ph_level: number;
  fish_abundance: string;
  pollution_level: string;
  threats: string[];
  last_survey_date: string;
  confidence_score: number;
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
    salinity?: number;
    pollutionIndex?: number;
  };
  prediction: {
    score: number;
    riskLevel: string;
    explanation: string;
  };
  metrics?: {
    waterQuality?: any;
    pollution?: any;
    biodiversity?: any;
    reefHealth?: any;
  };
}

export default function OceanHealthMap({ lat = -20.2, lng = 57.5, showCoralReefs = true }: OceanHealthMapProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [regions, setRegions] = useState<Record<string, RegionData>>({});
  const [coralReefs, setCoralReefs] = useState<CoralReefPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const regionMarkersRef = useRef<Marker[]>([]);
  const regionLayersRef = useRef<string[]>([]);
  const coralReefLayerAdded = useRef(false);
  const containerId = useMemo(() => `ocean-health-map-${Math.random().toString(36).substr(2, 9)}`, []);
  const { layers } = useLayerToggle();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/oceanhealth?lat=${lat}&lng=${lng}&region=all`);
        if (response.ok) {
          const data = await response.json();
          setPrediction(data);
          if (data.regions) {
            setRegions(data.regions);
          }
        } else {
          setError('Failed to fetch ocean health prediction');
        }
      } catch (err) {
        console.error('Error fetching ocean health prediction:', err);
        setError('Error loading ocean health data');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [lat, lng]);

  // Fetch coral reef health data from Supabase
  useEffect(() => {
    if (!showCoralReefs) return;

    const fetchCoralReefs = async () => {
      try {
        const response = await fetch('/api/coral-reef-health');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCoralReefs(result.data);
            console.log(`Loaded ${result.data.length} coral reef points`);
          }
        }
      } catch (err) {
        console.error('Error fetching coral reef data:', err);
      }
    };

    fetchCoralReefs();
    const interval = setInterval(fetchCoralReefs, 1800000); // Update every 30 minutes
    return () => clearInterval(interval);
  }, [showCoralReefs]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#ea580c';
    return '#dc2626';
  };

  const updateRegionalLayers = (map: MapboxMap) => {
    if (!map.loaded() || !map.getContainer()) {
      map.once('load', () => {
        if (mapRef.current) {
          updateRegionalLayers(mapRef.current);
        }
      });
      return;
    }

    // Clear existing region markers
    regionMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    regionMarkersRef.current = [];

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

    // Always show regions if data is available (not dependent on toggle)
    if (Object.keys(regions).length === 0) {
      return;
    }

    // Add polygon and marker for each region
    Object.entries(regions).forEach(([regionKey, regionData]) => {
      try {
        const bounds = regionData.bounds;
        const polygon: [number, number][] = [
          [bounds[0][0], bounds[0][1]], // SW
          [bounds[1][0], bounds[0][1]], // SE
          [bounds[1][0], bounds[1][1]], // NE
          [bounds[0][0], bounds[1][1]], // NW
          [bounds[0][0], bounds[0][1]], // Close
        ];

        const score = regionData.prediction.score;
        const color = getScoreColor(score);
        const layerId = `region-${regionKey}`;

        addMapboxPolygon(map, polygon, {
          layerId,
          color,
          fillOpacity: 0.25,
          strokeColor: color,
          strokeWidth: 3,
        });

        regionLayersRef.current.push(layerId);
        registerMapboxLayer(map, `region${regionKey}`, layerId);

        // Add click handler for region
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
          const pol = metrics.pollution || {};
          const bio = metrics.biodiversity || {};
          const reef = metrics.reefHealth || {};

          popup.setHTML(`
            <div style="width:380px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:18px;">
              <h3 style="margin:0 0 14px;font-size:20px;font-weight:600;color:#222;">🌊 ${regionKey.toUpperCase()} Region</h3>
              
              <div style="margin-bottom:16px;padding:12px;background:${color}15;border-radius:8px;border-left:4px solid ${color};">
                <div style="font-size:14px;color:#666;margin-bottom:4px;">Overall Health Score</div>
                <div style="font-size:28px;font-weight:700;color:${color};">
                  ${score}/100
                </div>
                <div style="font-size:12px;color:#666;margin-top:4px;text-transform:uppercase;">
                  ${regionData.prediction.riskLevel} Risk
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                <div style="padding:10px;background:#f0f9ff;border-radius:6px;">
                  <div style="font-size:11px;color:#666;margin-bottom:4px;">Water Quality</div>
                  <div style="font-size:18px;font-weight:600;color:#0284c7;">
                    ${wq.score || 0}/100
                  </div>
                </div>
                <div style="padding:10px;background:#fef2f2;border-radius:6px;">
                  <div style="font-size:11px;color:#666;margin-bottom:4px;">Pollution Index</div>
                  <div style="font-size:18px;font-weight:600;color:${pol.overallIndex < 30 ? '#059669' : pol.overallIndex < 50 ? '#d97706' : '#dc2626'};">
                    ${pol.overallIndex || 0}/100
                  </div>
                </div>
                <div style="padding:10px;background:#f0fdf4;border-radius:6px;">
                  <div style="font-size:11px;color:#666;margin-bottom:4px;">Biodiversity</div>
                  <div style="font-size:18px;font-weight:600;color:#16a34a;">
                    ${bio.biodiversityIndex || 0}/100
                  </div>
                </div>
                <div style="padding:10px;background:#faf5ff;border-radius:6px;">
                  <div style="font-size:11px;color:#666;margin-bottom:4px;">Reef Health</div>
                  <div style="font-size:18px;font-weight:600;color:#9333ea;">
                    ${reef.healthIndex || 0}/100
                  </div>
                </div>
              </div>

              <div style="border-top:1px solid #eee;padding-top:14px;margin-top:14px;">
                <div style="font-size:13px;font-weight:600;color:#222;margin-bottom:10px;">Key Parameters</div>
                <div style="space-y:6px;font-size:12px;">
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">Sea Surface Temp:</span>
                    <span style="font-weight:600;">${regionData.rawData.sst.toFixed(1)}°C</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">pH:</span>
                    <span style="font-weight:600;">${(regionData.rawData.ph || 8.1).toFixed(2)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">Dissolved O₂:</span>
                    <span style="font-weight:600;">${(regionData.rawData.dissolvedOxygen || 0).toFixed(1)} mg/L</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">Turbidity:</span>
                    <span style="font-weight:600;">${(regionData.rawData.turbidity || 0).toFixed(2)} NTU</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">Chlorophyll:</span>
                    <span style="font-weight:600;">${(regionData.rawData.chlorophyll || 0).toFixed(2)} mg/m³</span>
                  </div>
                  ${regionData.rawData.dhw !== undefined ? `
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#666;">Degree Heating Weeks:</span>
                    <span style="font-weight:600;">${regionData.rawData.dhw.toFixed(1)}</span>
                  </div>
                  ` : ''}
                  ${reef.bleachingRisk ? `
                  <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
                    <span style="color:#666;">Bleaching Risk:</span>
                    <span style="font-weight:600;text-transform:uppercase;color:${getRiskColor(reef.bleachingRisk)};">
                      ${reef.bleachingRisk}
                    </span>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div style="margin-top:14px;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#666;">
                ${regionData.prediction.explanation}
              </div>
            </div>
          `);
          
          popup.setLngLat(e.lngLat).addTo(map);
        });

        // Add center marker with popup
        const centerPopupHTML = `
          <div style="width:320px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
            <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌊 ${regionKey.toUpperCase()} Region</h3>
            <div style="space-y:8px;font-size:14px;">
              <div>
                <span style="font-weight:600;">Health Score:</span>{' '}
                <span style="font-weight:700;color:${color};">
                  ${score}/100
                </span>
              </div>
              <div>
                <span style="font-weight:600;">Risk Level:</span>{' '}
                <span style="text-transform:uppercase;color:${color};">
                  ${regionData.prediction.riskLevel}
                </span>
              </div>
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#666;">
                Click region polygon for detailed metrics
              </div>
            </div>
          </div>
        `;

        const marker = addMapboxMarker(
          map,
          [regionData.location.lon, regionData.location.lat],
          {
            color,
            size: 20,
          },
          centerPopupHTML
        );
        regionMarkersRef.current.push(marker);
      } catch (error) {
        console.error(`Error adding region ${regionKey}:`, error);
      }
    });
  };

  const updateMarker = (map: MapboxMap) => {
    if (!prediction || !map.loaded() || !map.getContainer()) {
      if (!map.loaded()) {
        map.once('load', () => {
          if (mapRef.current && prediction) {
            updateMarker(mapRef.current);
          }
        });
      }
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const color = getRiskColor(prediction.prediction.riskLevel);
    const metrics = prediction.metrics || {};
    const wq = metrics.waterQuality || {};
    const pol = metrics.pollution || {};
    const bio = metrics.biodiversity || {};
    const reef = metrics.reefHealth || {};

    const popupHTML = `
      <div style="width:360px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:18px;">
        <h3 style="margin:0 0 14px;font-size:20px;font-weight:600;color:#222;">🌊 Ocean Health Assessment</h3>
        
        <div style="margin-bottom:16px;padding:12px;background:${color}15;border-radius:8px;border-left:4px solid ${color};">
          <div style="font-size:14px;color:#666;margin-bottom:4px;">Overall Health Score</div>
          <div style="font-size:32px;font-weight:700;color:${color};">
            ${prediction.prediction.score}/100
          </div>
          <div style="font-size:12px;color:#666;margin-top:4px;text-transform:uppercase;">
            ${prediction.prediction.riskLevel} Risk
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <div style="padding:10px;background:#f0f9ff;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Water Quality</div>
            <div style="font-size:20px;font-weight:600;color:#0284c7;">${wq.score || 0}/100</div>
          </div>
          <div style="padding:10px;background:#fef2f2;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Pollution</div>
            <div style="font-size:20px;font-weight:600;color:${pol.overallIndex < 30 ? '#059669' : '#dc2626'};">
              ${pol.overallIndex || 0}/100
            </div>
          </div>
          <div style="padding:10px;background:#f0fdf4;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Biodiversity</div>
            <div style="font-size:20px;font-weight:600;color:#16a34a;">${bio.biodiversityIndex || 0}/100</div>
          </div>
          <div style="padding:10px;background:#faf5ff;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Reef Health</div>
            <div style="font-size:20px;font-weight:600;color:#9333ea;">${reef.healthIndex || 0}/100</div>
          </div>
        </div>

        <div style="border-top:1px solid #eee;padding-top:14px;margin-top:14px;">
          <div style="font-size:13px;font-weight:600;color:#222;margin-bottom:10px;">Key Metrics</div>
          <div style="space-y:6px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;">SST:</span>
              <span style="font-weight:600;">${prediction.rawData.sst.toFixed(1)}°C</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;">pH:</span>
              <span style="font-weight:600;">${(prediction.rawData.ph || 8.1).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;">Dissolved O₂:</span>
              <span style="font-weight:600;">${(prediction.rawData.dissolvedOxygen || 0).toFixed(1)} mg/L</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;">Turbidity:</span>
              <span style="font-weight:600;">${(prediction.rawData.turbidity || 0).toFixed(2)} NTU</span>
            </div>
            ${prediction.rawData.dhw !== undefined ? `
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#666;">DHW:</span>
              <span style="font-weight:600;">${prediction.rawData.dhw.toFixed(1)}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#666;">
          ${prediction.prediction.explanation}
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
  };

  const handleMapReady = (map: MapboxMap | null) => {
    if (!map) return;
    mapRef.current = map;

    if (prediction) {
      updateMarker(map);
    }
    if (Object.keys(regions).length > 0) {
      updateRegionalLayers(map);
    }
    
    // Add coral reef layer if data is available
    if (showCoralReefs && coralReefs.length > 0) {
      addCoralReefLayer(map, coralReefs);
    }

    setTimeout(() => {
      map.resize();
    }, 100);
  };

  const addCoralReefLayer = (map: MapboxMap, reefs: CoralReefPoint[]) => {
    if (coralReefLayerAdded.current || !map || !map.loaded() || reefs.length === 0) return;

    // Create GeoJSON from coral reef points
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: reefs.map(reef => ({
        type: 'Feature',
        properties: {
          reef_name: reef.reef_name,
          health_status: reef.health_status,
          coral_cover: reef.coral_cover_percentage,
          bleaching: reef.bleaching_severity,
          temperature: reef.water_temperature_celsius,
          ph: reef.ph_level,
          pollution: reef.pollution_level,
          fish_abundance: reef.fish_abundance,
          depth: reef.depth_meters,
          zone: reef.reef_zone,
        },
        geometry: {
          type: 'Point',
          coordinates: [reef.location_lng, reef.location_lat]
        }
      }))
    };

    try {
      // Add source
      if (!map.getSource('coral-reefs')) {
        map.addSource('coral-reefs', {
          type: 'geojson',
          data: geojson
        });
      }

      // Add circle layer for coral reef points
      if (!map.getLayer('coral-reef-points')) {
        map.addLayer({
          id: 'coral-reef-points',
          type: 'circle',
          source: 'coral-reefs',
          paint: {
            // Color by health status
            'circle-color': [
              'match',
              ['get', 'health_status'],
              'excellent', '#10b981', // green
              'good', '#22c55e',      // light green
              'fair', '#eab308',       // yellow
              'poor', '#ea580c',       // orange
              'critical', '#dc2626',    // red
              '#6b7280'                 // default gray
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 4,
              12, 8,
              15, 12
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-opacity': 0.85
          }
        });

        // Add click handler for popups
        map.on('click', 'coral-reef-points', (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const props = feature.properties;
          if (!props) return;

          const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          
          const getHealthColor = (status: string) => {
            switch (status) {
              case 'excellent': return '#10b981';
              case 'good': return '#22c55e';
              case 'fair': return '#eab308';
              case 'poor': return '#ea580c';
              case 'critical': return '#dc2626';
              default: return '#6b7280';
            }
          };

          const popupHTML = `
            <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;padding:14px;">
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#222;">🪸 ${props.reef_name || 'Coral Reef'}</h3>
              <div style="font-size:13px;line-height:1.7;">
                <div style="margin-bottom:8px;padding:8px;background:#f3f4f6;border-radius:6px;">
                  <div style="margin-bottom:4px;">
                    <span style="font-weight:600;">Health Status:</span>
                    <span style="text-transform:uppercase;color:${getHealthColor(props.health_status)};font-weight:600;margin-left:6px;">
                      ${props.health_status}
                    </span>
                  </div>
                  <div style="margin-bottom:4px;">
                    <span style="font-weight:600;">Coral Coverage:</span>
                    <span style="margin-left:6px;">${props.coral_cover}%</span>
                  </div>
                  <div>
                    <span style="font-weight:600;">Bleaching:</span>
                    <span style="margin-left:6px;text-transform:capitalize;">${props.bleaching || 'N/A'}</span>
                  </div>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">🌡️ Temperature:</span>
                  <span style="margin-left:6px;">${props.temperature?.toFixed(1) || 'N/A'}°C</span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">🐠 Fish Abundance:</span>
                  <span style="margin-left:6px;text-transform:capitalize;">${props.fish_abundance?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">💧 pH Level:</span>
                  <span style="margin-left:6px;">${props.ph?.toFixed(2) || 'N/A'}</span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">🏭 Pollution:</span>
                  <span style="margin-left:6px;text-transform:capitalize;">${props.pollution || 'N/A'}</span>
                </div>
                <div style="margin-bottom:6px;">
                  <span style="font-weight:600;">📏 Depth:</span>
                  <span style="margin-left:6px;">${props.depth || 'N/A'}m</span>
                </div>
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
                  Zone: ${props.zone || 'Unknown'} • ${coordinates[1].toFixed(4)}°, ${coordinates[0].toFixed(4)}°
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
        map.on('mouseenter', 'coral-reef-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'coral-reef-points', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      coralReefLayerAdded.current = true;
      console.log(`Added coral reef layer with ${reefs.length} points`);
    } catch (err) {
      console.error('Error adding coral reef layer:', err);
    }
  };

  useEffect(() => {
    if (mapRef.current && prediction) {
      updateMarker(mapRef.current);
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [prediction, lat, lng]);

  useEffect(() => {
    if (mapRef.current && Object.keys(regions).length > 0) {
      updateRegionalLayers(mapRef.current);
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [regions, layers.oceanHealth.coastalSegments]);

  // Update coral reef layer when data changes
  useEffect(() => {
    if (mapRef.current && coralReefs.length > 0 && showCoralReefs) {
      console.log(`Updating coral reef layer with ${coralReefs.length} points`);
      const source = mapRef.current.getSource('coral-reefs') as mapboxgl.GeoJSONSource;
      if (source) {
        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: coralReefs.map(reef => ({
            type: 'Feature',
            properties: {
              reef_name: reef.reef_name,
              health_status: reef.health_status,
              coral_cover: reef.coral_cover_percentage,
              bleaching: reef.bleaching_severity,
              temperature: reef.water_temperature_celsius,
              ph: reef.ph_level,
              pollution: reef.pollution_level,
              fish_abundance: reef.fish_abundance,
              depth: reef.depth_meters,
              zone: reef.reef_zone,
            },
            geometry: {
              type: 'Point',
              coordinates: [reef.location_lng, reef.location_lat]
            }
          }))
        };
        source.setData(geojson);
        console.log('Updated coral reef source data');
      } else if (!coralReefLayerAdded.current) {
        console.log('Adding coral reef layer for first time');
        addCoralReefLayer(mapRef.current, coralReefs);
      }
    }
  }, [coralReefs, showCoralReefs]);

  if (loading) {
    return (
      <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading ocean health data...</div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-red-600">{error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden border border-gray-300 relative">
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
