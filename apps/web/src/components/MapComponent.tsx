'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import type { FormationPrediction } from '@/lib/models/cycloneFormationPredictor';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mauritius coordinates
const mauritiusCenter: [number, number] = [-20.2, 57.5];

// Mock cyclone data (Cyclone Freddy path)
const cyclonePath: [number, number][] = [
  [-15.0, 45.0], // Starting point
  [-16.5, 48.2],
  [-18.0, 52.1],
  [-19.2, 55.8],
  [-20.2, 57.5], // Near Mauritius
  [-21.0, 59.2],
];

// Flood risk zones
const floodZones = [
  { center: [-20.1, 57.4] as [number, number], radius: 8000, risk: 'high', name: 'Port Louis' },
  { center: [-20.3, 57.7] as [number, number], radius: 5000, risk: 'medium', name: 'Quatre Bornes' },
  { center: [-20.0, 57.8] as [number, number], radius: 6000, risk: 'low', name: 'Grand Baie' },
  { center: [-20.4, 57.3] as [number, number], radius: 4000, risk: 'high', name: 'Curepipe' },
];

// Weather stations
const weatherStations = [
  { pos: [-20.16, 57.5] as [number, number], name: 'Port Louis Station', temp: '26°C', humidity: '78%' },
  { pos: [-20.23, 57.47] as [number, number], name: 'Vacoas Station', temp: '23°C', humidity: '82%' },
  { pos: [-19.95, 57.75] as [number, number], name: 'Grand Baie Station', temp: '28°C', humidity: '75%' },
];

// Custom icon for formation predictions
const createFormationIcon = (probability: number, intensity: string) => {
  const getColor = () => {
    if (intensity === 'category-2+') return '#8B0000';
    if (intensity === 'category-1') return '#FF4500';
    if (intensity === 'tropical-storm') return '#FF8C00';
    if (probability >= 0.7) return '#FF6B35';
    if (probability >= 0.4) return '#F7931E';
    return '#FFD700';
  };

  const getSymbol = () => {
    if (intensity === 'tropical-depression') return 'TD';
    if (intensity === 'tropical-storm') return 'TS';
    if (intensity === 'category-1') return '1';
    if (intensity === 'category-2+') return '2+';
    return 'F';
  };

  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${getColor()};
        border: 3px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 10px;
        color: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${getSymbol()}
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: rgba(0,0,0,0.8);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
        ">${Math.round(probability * 100)}</div>
      </div>
    `,
    className: 'formation-prediction-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Format time remaining until formation
const formatTimeToFormation = (hours: number): string => {
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  } else {
    const days = Math.round(hours / 24 * 10) / 10;
    return `${days} days`;
  }
};

// Format expected formation date
const formatFormationDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC';
};

export default function MapComponent() {
  const [formationPredictions, setFormationPredictions] = useState<FormationPrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch formation predictions
  const fetchFormationPredictions = async () => {
    try {
      setIsLoadingPredictions(true);
      const response = await fetch('/api/cyclone-formation');
      if (!response.ok) {
        throw new Error('Failed to fetch formation predictions');
      }
      const data = await response.json();
      const predictions = data.forecast?.predictions || data.predictions || [];
      setFormationPredictions(predictions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching formation predictions:', error);
      setFormationPredictions([]); // Clear predictions on error
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  // Load predictions on component mount and set up auto-refresh
  useEffect(() => {
    fetchFormationPredictions();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchFormationPredictions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#FF3B30'; // Red
      case 'medium': return '#FF9500'; // Orange  
      case 'low': return '#34C759'; // Green
      default: return '#007AFF'; // Blue
    }
  };

  const getRiskOpacity = (risk: string) => {
    switch (risk) {
      case 'high': return 0.4;
      case 'medium': return 0.3;
      case 'low': return 0.2;
      default: return 0.1;
    }
  };

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300" style={{ position: 'relative', minHeight: '500px', height: '500px' }}>
      <MapContainer 
        center={mauritiusCenter} 
        zoom={10} 
        style={{ height: '100%', width: '100%', minHeight: '100%', minWidth: '100%' }}
        className="z-0"
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Cyclone Path */}
      <Polyline
        positions={cyclonePath}
        pathOptions={{ 
          color: '#FF3B30', 
          weight: 4,
          dashArray: '10, 5'
        }}
      />
      
      {/* Current Cyclone Position */}
      <Marker position={cyclonePath[4]}>
        <Popup>
          <div className="text-center">
            <h3 className="font-bold text-red-600">🌀 Cyclone Freddy</h3>
            <p><strong>Status:</strong> Category 3</p>
            <p><strong>Wind Speed:</strong> 185 km/h</p>
            <p><strong>Pressure:</strong> 952 hPa</p>
            <p><strong>Distance:</strong> 45 km from Mauritius</p>
            <p><strong>ETA:</strong> 6 hours</p>
          </div>
        </Popup>
      </Marker>

      {/* Flood Risk Zones */}
      {floodZones.map((zone, index) => (
        <Circle
          key={index}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: getRiskColor(zone.risk),
            fillColor: getRiskColor(zone.risk),
            fillOpacity: getRiskOpacity(zone.risk),
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold">💧 {zone.name}</h3>
              <p><strong>Flood Risk:</strong> {zone.risk.charAt(0).toUpperCase() + zone.risk.slice(1)}</p>
              <p><strong>Probability:</strong> {zone.risk === 'high' ? '85%' : zone.risk === 'medium' ? '45%' : '15%'}</p>
              <p><strong>Expected Depth:</strong> {zone.risk === 'high' ? '1.2m' : zone.risk === 'medium' ? '0.6m' : '0.2m'}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Formation Predictions */}
      {formationPredictions.map((prediction) => (
        <Marker
          key={prediction.id}
          position={[prediction.location.lat, prediction.location.lng]}
          icon={createFormationIcon(prediction.formationProbability, prediction.expectedIntensity)}
        >
          <Popup>
            <div className="text-center min-w-64">
              <h3 className="font-bold text-lg mb-2 text-orange-600">
                🌪️ Formation Prediction
              </h3>
              
              <div className="space-y-2 text-sm text-left">
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Location:</strong> {prediction.location.lat.toFixed(2)}°, {prediction.location.lng.toFixed(2)}°
                </div>
                
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Region:</strong> {prediction.region}
                </div>
                
                <div className={`p-2 rounded ${
                  prediction.formationProbability >= 0.7 ? 'bg-red-50' :
                  prediction.formationProbability >= 0.4 ? 'bg-orange-50' : 'bg-yellow-50'
                }`}>
                  <strong>Formation Probability:</strong>{' '}
                  <span className={`font-bold ${
                    prediction.formationProbability >= 0.7 ? 'text-red-600' :
                    prediction.formationProbability >= 0.4 ? 'text-orange-600' : 'text-yellow-600'
                  }`}>
                    {(prediction.formationProbability * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="bg-blue-50 p-2 rounded">
                  <strong>Expected Formation:</strong><br />
                  {formatFormationDate(prediction.expectedFormationDateStr)}
                </div>
                
                <div className="bg-green-50 p-2 rounded">
                  <strong>Time to Formation:</strong> {formatTimeToFormation(prediction.timeToFormation)}
                </div>
                
                <div className="bg-purple-50 p-2 rounded">
                  <strong>Expected Intensity:</strong>{' '}
                  <span className="capitalize font-medium">
                    {prediction.expectedIntensity.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                </div>

                {prediction.environmentalFactors && (
                  <div className="bg-indigo-50 p-2 rounded">
                    <strong>Environmental Assessment:</strong>
                    <div className="mt-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className={prediction.environmentalFactors.seaTempFavorable ? 'text-green-600' : 'text-red-600'}>
                          {prediction.environmentalFactors.seaTempFavorable ? '✓' : '✗'}
                        </span>
                        Sea Temperature
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={prediction.environmentalFactors.lowWindShear ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                          {prediction.environmentalFactors.lowWindShear ? '✓' : '✗'}
                        </span>
                        Low Wind Shear
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={prediction.environmentalFactors.sufficientMoisture ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                          {prediction.environmentalFactors.sufficientMoisture ? '✓' : '✗'}
                        </span>
                        Sufficient Moisture
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={prediction.environmentalFactors.atmosphericInstability ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                          {prediction.environmentalFactors.atmosphericInstability ? '✓' : '✗'}
                        </span>
                        Atmospheric Instability
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(prediction.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Weather Stations */}
      {weatherStations.map((station, index) => (
        <Marker key={index} position={station.pos}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold">🌡️ {station.name}</h3>
              <p><strong>Temperature:</strong> {station.temp}</p>
              <p><strong>Humidity:</strong> {station.humidity}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Last Update:</strong> 2 min ago</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Map Status Indicator */}
      {isLoadingPredictions && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🔄 Loading Predictions...
        </div>
      )}
      
      {!isLoadingPredictions && formationPredictions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🌪️ {formationPredictions.length} Formation Prediction{formationPredictions.length !== 1 ? 's' : ''}
        </div>
      )}
    </MapContainer>
    </div>
  );
}