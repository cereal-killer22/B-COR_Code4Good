'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { CyclonePrediction } from '@climaguard/shared/types/climate';

// Import Leaflet CSS (required for map rendering)
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

// Dynamically import leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface CycloneMapProps {
  lat?: number;
  lng?: number;
}

export default function CycloneMap({ lat = -20.2, lng = 57.5 }: CycloneMapProps) {
  const [prediction, setPrediction] = useState<CyclonePrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/cyclone?lat=${lat}&lng=${lng}`);
        if (response.ok) {
          const data = await response.json();
          setPrediction(data);
        } else {
          setError('Failed to fetch cyclone prediction');
        }
      } catch (err) {
        console.error('Error fetching cyclone prediction:', err);
        setError('Error loading cyclone data');
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

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading cyclone prediction...</div>
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
      <MapContainer
        center={[lat, lng]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[lat, lng]}
          radius={20}
          pathOptions={{
            fillColor: getRiskColor(prediction.prediction.riskLevel),
            fillOpacity: 0.7,
            color: '#000',
            weight: 2
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">🌀 Cyclone Risk</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Risk Level:</span>{' '}
                  <span className="uppercase" style={{ color: getRiskColor(prediction.prediction.riskLevel) }}>
                    {prediction.prediction.riskLevel}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Probability:</span>{' '}
                  {(prediction.prediction.probability * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-semibold">Pressure:</span>{' '}
                  {prediction.observations.minPressure.toFixed(1)} hPa
                </div>
                <div>
                  <span className="font-semibold">Wind Speed:</span>{' '}
                  {prediction.observations.maxWindSpeed.toFixed(1)} km/h
                </div>
                <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                  {prediction.prediction.explanation}
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

