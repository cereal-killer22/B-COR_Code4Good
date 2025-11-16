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

interface OceanHealthMapProps {
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
    pollutionIndex?: number;
  };
  prediction: {
    score: number;
    riskLevel: string;
    explanation: string;
  };
}

export default function OceanHealthMap({ lat = -20.2, lng = 57.5 }: OceanHealthMapProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [regions, setRegions] = useState<Record<string, RegionData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const regionLayersRef = useRef<string[]>([]);
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
    const interval = setInterval(fetchPrediction, 3600000);
    return () => clearInterval(interval);
  }, [lat, lng]);

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
    // Clear existing region layers
    regionLayersRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(`${layerId}-stroke`)) map.removeLayer(`${layerId}-stroke`);
      if (map.getSource(layerId)) map.removeSource(layerId);
    });
    regionLayersRef.current = [];

    if (!layers.oceanHealth.coastalSegments || Object.keys(regions).length === 0) {
      return;
    }

    // Add polygon for each region
    Object.entries(regions).forEach(([regionKey, regionData]) => {
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
        fillOpacity: 0.3,
        strokeColor: color,
        strokeWidth: 2,
      });

      regionLayersRef.current.push(layerId);

      // Add click handler for region
      map.on('click', layerId, (e) => {
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        const popup = new (require('mapbox-gl')).Popup({ offset: 24 });
        popup.setHTML(`
          <div style="width:320px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
            <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌊 ${regionKey.toUpperCase()} Region</h3>
            <div style="space-y:8px;font-size:14px;">
              <div>
                <span style="font-weight:600;">Health Score:</span>{' '}
                <span style="font-weight:700;color:${color};">
                  ${score.toFixed(0)}/100
                </span>
              </div>
              <div>
                <span style="font-weight:600;">Risk Level:</span>{' '}
                <span style="text-transform:uppercase;color:${color};">
                  ${regionData.prediction.riskLevel}
                </span>
              </div>
              <div>
                <span style="font-weight:600;">SST:</span>{' '}
                ${regionData.rawData.sst.toFixed(1)}°C
              </div>
              ${regionData.rawData.turbidity !== undefined ? `
              <div>
                <span style="font-weight:600;">Turbidity:</span>{' '}
                ${regionData.rawData.turbidity.toFixed(2)}
              </div>
              ` : ''}
              ${regionData.rawData.ph !== undefined ? `
              <div>
                <span style="font-weight:600;">pH:</span>{' '}
                ${regionData.rawData.ph.toFixed(2)}
              </div>
              ` : ''}
              ${regionData.rawData.dissolvedOxygen !== undefined ? `
              <div>
                <span style="font-weight:600;">Dissolved O₂:</span>{' '}
                ${regionData.rawData.dissolvedOxygen.toFixed(1)} mg/L
              </div>
              ` : ''}
              ${regionData.rawData.pollutionIndex !== undefined ? `
              <div>
                <span style="font-weight:600;">Pollution Index:</span>{' '}
                ${regionData.rawData.pollutionIndex.toFixed(1)}
              </div>
              ` : ''}
            </div>
          </div>
        `);
        popup.setLngLat(e.lngLat).addTo(map);
      });
    });
  };

  const updateMarker = (map: MapboxMap) => {
    if (!prediction) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const color = getRiskColor(prediction.prediction.riskLevel);
    const popupHTML = `
      <div style="width:320px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌊 Ocean Health</h3>
        <div style="space-y:8px;font-size:14px;">
          <div>
            <span style="font-weight:600;">Health Score:</span>{' '}
            <span style="font-weight:700;color:${color};">
              ${prediction.prediction.score}/100
            </span>
          </div>
          <div>
            <span style="font-weight:600;">Risk Level:</span>{' '}
            <span style="text-transform:uppercase;color:${color};">
              ${prediction.prediction.riskLevel}
            </span>
          </div>
          <div>
            <span style="font-weight:600;">SST:</span>{' '}
            ${prediction.rawData.sst.toFixed(1)}°C
          </div>
          <div>
            <span style="font-weight:600;">HotSpot:</span>{' '}
            ${prediction.rawData.hotspot.toFixed(1)}
          </div>
          <div>
            <span style="font-weight:600;">DHW:</span>{' '}
            ${prediction.rawData.dhw.toFixed(1)}
          </div>
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
        size: 22,
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

    setTimeout(() => {
      map.resize();
    }, 100);
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

  if (loading) {
    return (
      <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading ocean health prediction...</div>
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
