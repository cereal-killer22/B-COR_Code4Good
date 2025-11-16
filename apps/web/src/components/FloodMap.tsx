'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import BaseMapboxMap from './BaseMapboxMap';
import { addMapboxMarker } from '@/lib/map/MapboxEngine';
import type { FloodPrediction } from '@climaguard/shared/types/climate';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';

interface FloodMapProps {
  lat?: number;
  lng?: number;
}

export default function FloodMap({ lat = -20.2, lng = 57.5 }: FloodMapProps) {
  const [prediction, setPrediction] = useState<FloodPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const containerId = useMemo(() => `flood-map-${Math.random().toString(36).substr(2, 9)}`, []);

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
    const interval = setInterval(fetchPrediction, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [lat, lng]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return '#dc2626'; // red
      case 'high': return '#ea580c'; // orange
      case 'moderate': return '#eab308'; // yellow
      case 'low': return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  const updateMarker = (map: MapboxMap) => {
    if (!prediction) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const color = getRiskColor(prediction.prediction.riskLevel);
    const popupHTML = `
      <div style="width:320px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌊 Flood Risk</h3>
        <div style="space-y:8px;font-size:14px;">
          <div>
            <span style="font-weight:600;">Risk Level:</span>{' '}
            <span style="text-transform:uppercase;color:${color};">
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
      [lng, lat], // Mapbox uses [lng, lat]
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

    // Add marker when map is ready and data is available
    if (prediction) {
      updateMarker(map);
    }
  };

  // Update marker when prediction changes - MUST be before any early returns
  useEffect(() => {
    if (mapRef.current && prediction) {
      updateMarker(mapRef.current);
    }
  }, [prediction, lat, lng]);

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
    <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden border border-gray-300 relative">
      <BaseMapboxMap
        containerId={containerId}
        center={[lng, lat]} // Mapbox uses [lng, lat]
        zoom={10}
        className="w-full h-full"
        onMapReady={handleMapReady}
      />
    </div>
  );
}

