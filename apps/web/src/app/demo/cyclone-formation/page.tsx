'use client';

import { useState, useEffect } from 'react';
import CycloneFormationMap from '@/components/CycloneFormationMap';
import type { FormationPrediction } from '@/lib/models/cycloneFormationPredictor';

export default function CycloneFormationDemo() {
  const [predictions, setPredictions] = useState<FormationPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes
  const [error, setError] = useState<string | null>(null);
  const [useStoredData, setUseStoredData] = useState(false);
  const [storedDataHours, setStoredDataHours] = useState(24);
  const [activeOnly, setActiveOnly] = useState(true);

  // Fetch predictions manually
  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      let data;
      
      if (useStoredData) {
        const params = new URLSearchParams({
          hours: storedDataHours.toString(),
          activeOnly: activeOnly.toString()
        });
        
        response = await fetch(`/api/cyclone-formation/stored?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch stored predictions: ${response.statusText}`);
        }
        
        data = await response.json();
        setPredictions(data.predictions || []);
      } else {
        response = await fetch('/api/cyclone-formation');
        if (!response.ok) {
          throw new Error(`Failed to fetch predictions: ${response.statusText}`);
        }
        
        data = await response.json();
        setPredictions(data.forecast?.predictions || data.predictions || []);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial predictions
  useEffect(() => {
    fetchPredictions();
  }, []);

  const handlePredictionUpdate = (newPredictions: FormationPrediction[]) => {
    setPredictions(newPredictions);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Cyclone Formation Predictions
        </h1>
        <p className="text-gray-600 mb-4">
          Real-time cyclone formation predictions showing expected formation dates and locations on an interactive map.
        </p>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={fetchPredictions}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh Predictions'}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm">
                Auto-refresh
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useStored"
                checked={useStoredData}
                onChange={(e) => setUseStoredData(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useStored" className="text-sm">
                Use stored data
              </label>
            </div>

            {useStoredData && (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor="storedHours" className="text-sm">
                    Hours of data:
                  </label>
                  <select
                    id="storedHours"
                    value={storedDataHours}
                    onChange={(e) => setStoredDataHours(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeOnly"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="activeOnly" className="text-sm">
                    Active only
                  </label>
                </div>
              </>
            )}

            {!useStoredData && (
              <div className="flex items-center gap-2">
                <label htmlFor="interval" className="text-sm">
                  Refresh interval:
                </label>
                <select
                  id="interval"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                  <option value={600000}>10 minutes</option>
                  <option value={1800000}>30 minutes</option>
                </select>
              </div>
            )}

            <div className="text-sm text-gray-600">
              {predictions.length} prediction{predictions.length !== 1 ? 's' : ''} found
              {useStoredData && ' (from database)'}
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Predictions Summary */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-3">Prediction Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {predictions.slice(0, 4).map((prediction, index) => (
                <div key={prediction.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Prediction #{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      prediction.formationProbability >= 0.7 ? 'bg-red-100 text-red-800' :
                      prediction.formationProbability >= 0.4 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(prediction.formationProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <strong>Location:</strong> {prediction.location.lat.toFixed(1)}°, {prediction.location.lng.toFixed(1)}°
                    </div>
                    <div>
                      <strong>Expected:</strong> {new Date(prediction.expectedFormationDateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit'
                      })}
                    </div>
                    <div>
                      <strong>Intensity:</strong> {prediction.expectedIntensity.replace('-', ' ')}
                    </div>
                    <div>
                      <strong>Region:</strong> {prediction.region}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {predictions.length > 4 && (
              <div className="mt-3 text-sm text-gray-500 text-center">
                ... and {predictions.length - 4} more predictions (see map for details)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Component */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <CycloneFormationMap
          predictions={predictions}
          autoRefresh={autoRefresh && !useStoredData}
          refreshInterval={refreshInterval}
          onPredictionUpdate={handlePredictionUpdate}
          height="600px"
          className="w-full"
          useStoredData={useStoredData}
          storedDataHours={storedDataHours}
          activeOnly={activeOnly}
        />
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click on map markers to see detailed formation predictions</li>
          <li>• Expected formation dates are calculated based on environmental conditions</li>
          <li>• Marker colors indicate expected intensity (red = stronger, yellow = weaker)</li>
          <li>• Enable auto-refresh to get updated predictions in real-time</li>
          <li>• The map automatically adjusts to show all active predictions</li>
        </ul>
      </div>
    </div>
  );
}