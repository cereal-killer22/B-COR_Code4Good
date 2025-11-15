/**
 * Example: Flood Map using Map Engine
 * 
 * This demonstrates how to use the centralized Map Engine
 * with page-specific configuration for flood features.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import MapEngineComponent from './MapEngineComponent';
import {
  FLOOD_MAP_CONFIG,
  loadRiskPolygon,
  addCircle,
  addMarker,
  type MapEngineOptions,
} from '@/lib/map';
import type { FloodPrediction } from '@climaguard/shared/types/climate';

interface FloodMapExampleProps {
  lat?: number;
  lng?: number;
}

export default function FloodMapExample({ 
  lat = -20.2, 
  lng = 57.5 
}: FloodMapExampleProps) {
  const [prediction, setPrediction] = useState<FloodPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

  // Handle map ready - add flood-specific layers
  const handleMapReady = (map: L.Map | null) => {
    if (!map) return;
    
    mapInstanceRef.current = map;

    // Add flood risk zones based on prediction
    if (prediction) {
      // Clear any existing layers
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });

      const riskColor = getRiskColor(prediction.prediction.riskLevel);
      
      // Add risk circle
      addCircle(map, [lat, lng], 5000, {
        color: riskColor,
        weight: 3,
        opacity: 0.8,
        fillColor: riskColor,
        fillOpacity: 0.3,
      });

      // Add marker with popup
      const popupContent = createPopupContent(prediction);
      addMarker(map, [lat, lng], {}, popupContent);
    }
  };

  // Update map when prediction changes
  useEffect(() => {
    if (mapInstanceRef.current && prediction) {
      handleMapReady(mapInstanceRef.current);
    }
  }, [prediction, lat, lng]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const createPopupContent = (pred: FloodPrediction): string => {
    return `
      <div class="p-2">
        <h3 class="font-bold text-lg mb-2">🌊 Flood Risk</h3>
        <div class="space-y-1 text-sm">
          <div>
            <span class="font-semibold">Risk Level:</span>
            <span class="uppercase" style="color: ${getRiskColor(pred.prediction.riskLevel)}">
              ${pred.prediction.riskLevel}
            </span>
          </div>
          <div>
            <span class="font-semibold">Probability:</span>
            ${(pred.prediction.probability * 100).toFixed(1)}%
          </div>
          <div>
            <span class="font-semibold">24h Rainfall:</span>
            ${pred.rainfall.precip24h.toFixed(1)} mm
          </div>
          <div>
            <span class="font-semibold">72h Rainfall:</span>
            ${pred.rainfall.precip72h.toFixed(1)} mm
          </div>
        </div>
      </div>
    `;
  };

  // Customize flood map config with specific center
  const floodConfig: MapEngineOptions = {
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

  if (error || !prediction) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-red-600">{error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300">
      <MapEngineComponent
        containerId="flood-map-container"
        options={floodConfig}
        onMapReady={handleMapReady}
      />
    </div>
  );
}

