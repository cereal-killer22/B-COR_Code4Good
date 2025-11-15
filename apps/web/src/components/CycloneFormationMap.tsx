'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import type { FormationPrediction } from '@/lib/models/cycloneFormationPredictor';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
const createCustomIcon = (color: string, intensity: string) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      color: white;
    ">
      ${intensity === 'tropical-depression' ? 'TD' : 
        intensity === 'tropical-storm' ? 'TS' : 
        intensity === 'category-1' ? '1' : '2+'}
    </div>
  `;
  
  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="26" height="26" xmlns="http://www.w3.org/2000/svg">
        <foreignObject x="0" y="0" width="26" height="26">
          <div xmlns="http://www.w3.org/1999/xhtml">${iconHtml}</div>
        </foreignObject>
      </svg>
    `)}`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

// Color mapping for different probabilities and intensities
const getMarkerColor = (probability: number, intensity: string): string => {
  if (intensity === 'category-2+') return '#8B0000'; // Dark red for strong storms
  if (intensity === 'category-1') return '#FF4500'; // Orange red
  if (intensity === 'tropical-storm') return '#FF8C00'; // Dark orange
  
  // For tropical depressions, use probability-based colors
  if (probability >= 0.7) return '#FF6B35'; // High probability orange
  if (probability >= 0.4) return '#F7931E'; // Medium probability yellow-orange
  return '#FFD700'; // Low probability yellow
};

// Component to auto-fit map bounds to show all predictions
const AutoFitBounds: React.FC<{ predictions: FormationPrediction[] }> = ({ predictions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (predictions.length > 0) {
      const bounds = new LatLngBounds(
        predictions.map(p => [p.location.lat, p.location.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [predictions, map]);
  
  return null;
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

interface CycloneFormationMapProps {
  predictions?: FormationPrediction[];
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onPredictionUpdate?: (predictions: FormationPrediction[]) => void;
  height?: string;
  className?: string;
  useStoredData?: boolean; // Whether to fetch from stored predictions API
  storedDataHours?: number; // How many hours of stored data to fetch
  activeOnly?: boolean; // Only fetch active predictions (future formation dates)
}

const CycloneFormationMap: React.FC<CycloneFormationMapProps> = ({
  predictions: initialPredictions = [],
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes default
  onPredictionUpdate,
  height = '500px',
  className = '',
  useStoredData = false,
  storedDataHours = 24,
  activeOnly = false
}) => {
  const [predictions, setPredictions] = useState<FormationPrediction[]>(initialPredictions);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Fetch predictions from API
  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      let data;
      
      if (useStoredData) {
        // Fetch from stored predictions
        const params = new URLSearchParams({
          hours: storedDataHours.toString(),
          activeOnly: activeOnly.toString()
        });
        
        response = await fetch(`/api/cyclone-formation/stored?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch stored predictions: ${response.statusText}`);
        }
        
        data = await response.json();
        const newPredictions = data.predictions || [];
        
        setPredictions(newPredictions);
      } else {
        // Generate new predictions
        response = await fetch('/api/cyclone-formation');
        if (!response.ok) {
          throw new Error(`Failed to fetch predictions: ${response.statusText}`);
        }
        
        data = await response.json();
        const newPredictions = data.forecast?.predictions || data.predictions || [];
        
        setPredictions(newPredictions);
      }
      
      setLastUpdated(new Date());
      
      if (onPredictionUpdate) {
        onPredictionUpdate(predictions);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      // Initial fetch
      fetchPredictions();
      
      // Set up interval
      intervalRef.current = window.setInterval(fetchPredictions, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // Update predictions when props change
  useEffect(() => {
    if (!autoRefresh) {
      setPredictions(initialPredictions);
    }
  }, [initialPredictions, autoRefresh]);

  const handleRefresh = () => {
    fetchPredictions();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-card border-theme rounded-lg shadow-lg p-3 border" style={{ backgroundColor: 'var(--map-control-bg)', borderColor: 'var(--map-overlay-border)' }}>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
          
          <div className="text-xs text-theme-secondary">
            {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="text-xs text-theme-secondary">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          {error && (
            <div className="text-xs text-status-error max-w-40 break-words" style={{ color: 'var(--status-error)' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card border-theme rounded-lg shadow-lg p-3 border" style={{ backgroundColor: 'var(--map-control-bg)', borderColor: 'var(--map-overlay-border)' }}>
        <div className="text-sm font-semibold mb-2 text-theme">Formation Probability</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-800"></div>
            <span>Category 2+ (High Intensity)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-600"></div>
            <span>Category 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-400"></div>
            <span>Tropical Storm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Tropical Depression</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        center={[-20, 60]} // Southwest Indian Ocean region
        zoom={4}
        style={{ height, width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <AutoFitBounds predictions={predictions} />
        
        {predictions.map((prediction) => (
          <Marker
            key={prediction.id}
            position={[prediction.location.lat, prediction.location.lng]}
            icon={createCustomIcon(
              getMarkerColor(prediction.formationProbability, prediction.expectedIntensity),
              prediction.expectedIntensity
            )}
          >
            <Popup>
              <div className="p-2 min-w-64">
                <h3 className="font-bold text-lg mb-2">
                  Cyclone Formation Prediction
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Location:</strong> {prediction.location.lat.toFixed(2)}°, {prediction.location.lng.toFixed(2)}°
                  </div>
                  
                  <div>
                    <strong>Region:</strong> {prediction.region}
                  </div>
                  
                  <div>
                    <strong>Formation Probability:</strong>{' '}
                    <span className={`font-semibold ${
                      prediction.formationProbability >= 0.7 ? 'text-red-600' :
                      prediction.formationProbability >= 0.4 ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      {(prediction.formationProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div>
                    <strong>Expected Formation:</strong> {formatFormationDate(prediction.expectedFormationDateStr)}
                  </div>
                  
                  <div>
                    <strong>Time to Formation:</strong> {formatTimeToFormation(prediction.timeToFormation)}
                  </div>
                  
                  <div>
                    <strong>Expected Intensity:</strong>{' '}
                    <span className="capitalize">
                      {prediction.expectedIntensity.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div>
                    <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                  
                  {prediction.environmentalFactors && (
                    <details className="mt-3">
                      <summary className="cursor-pointer font-medium">Environmental Assessment</summary>
                      <div className="mt-2 pl-4 space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${prediction.environmentalFactors.seaTempFavorable ? 'text-green-600' : 'text-red-600'}`}>
                            {prediction.environmentalFactors.seaTempFavorable ? '✓' : '✗'}
                          </span>
                          Sea Temperature Favorable
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${prediction.environmentalFactors.lowWindShear ? 'text-green-600' : 'text-red-600'}`}>
                            {prediction.environmentalFactors.lowWindShear ? '✓' : '✗'}
                          </span>
                          Low Wind Shear
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${prediction.environmentalFactors.sufficientMoisture ? 'text-green-600' : 'text-red-600'}`}>
                            {prediction.environmentalFactors.sufficientMoisture ? '✓' : '✗'}
                          </span>
                          Sufficient Moisture
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${prediction.environmentalFactors.atmosphericInstability ? 'text-green-600' : 'text-red-600'}`}>
                            {prediction.environmentalFactors.atmosphericInstability ? '✓' : '✗'}
                          </span>
                          Atmospheric Instability
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CycloneFormationMap;