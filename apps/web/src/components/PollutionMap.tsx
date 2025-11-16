'use client';

import { useState, useEffect } from 'react';
import { Card, StatusBadge } from '@/components/ui';
import dynamic from 'next/dynamic';
import type { PollutionEvent } from '@climaguard/shared/types/ocean';

const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Loading Map...</p>
    </div>
  ),
});

interface PollutionMapProps {
  location?: [number, number];
  onLocationChange?: (location: [number, number]) => void;
}

export default function PollutionMap({ 
  location = [-20.0, 57.5],
  onLocationChange 
}: PollutionMapProps = {}) {
  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PollutionEvent | null>(null);
  const [satelliteInfo, setSatelliteInfo] = useState<any>(null);
  
  useEffect(() => {
    fetchPollutionEvents();
    const interval = setInterval(fetchPollutionEvents, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchPollutionEvents() {
    try {
      setLoading(true);
      const response = await fetch('/api/pollution/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch pollution events:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function triggerDetection() {
    try {
      setDetecting(true);
      const response = await fetch('/api/pollution/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          radius: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.events && data.events.length > 0) {
          setEvents(prev => [...data.events, ...prev]);
        }
        if (data.satelliteImage) {
          setSatelliteInfo(data.satelliteImage);
        }
      }
    } catch (error) {
      console.error('Failed to detect pollution:', error);
    } finally {
      setDetecting(false);
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oil_spill': return '🛢️';
      case 'plastic': return '🗑️';
      case 'chemical': return '🧪';
      case 'debris': return '🗂️';
      case 'sewage': return '💧';
      default: return '⚠️';
    }
  };
  
  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading pollution events...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme">🚨 Pollution Events</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={triggerDetection}
              disabled={detecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {detecting ? 'Detecting...' : '🔍 Detect Pollution'}
            </button>
            <StatusBadge status={events.length > 0 ? 'warning' : 'success'}>
              {events.length} Active Event{events.length !== 1 ? 's' : ''}
            </StatusBadge>
          </div>
        </div>
        
        {/* Satellite Info */}
        {satelliteInfo && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-theme">Latest Sentinel-2 Image</div>
                <div className="text-xs text-theme-secondary">
                  {new Date(satelliteInfo.timestamp).toLocaleString()} • 
                  Cloud Coverage: {satelliteInfo.cloudCoverage.toFixed(0)}%
                </div>
              </div>
              {satelliteInfo.url && (
                <a
                  href={satelliteInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Image →
                </a>
              )}
            </div>
          </div>
        )}
        
        {events.length === 0 ? (
          <div className="text-center py-12 text-theme-secondary">
            <div className="text-4xl mb-4">✅</div>
            <p>No active pollution events detected</p>
            <p className="text-sm mt-2">Monitoring continues...</p>
          </div>
        ) : (
          <>
            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?.id === event.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                      : 'bg-white dark:bg-gray-800 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(event.type)}</span>
                      <h3 className="font-semibold text-theme capitalize">
                        {event.type.replace('_', ' ')}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary mb-2">
                    Detected: {new Date(event.detectedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-theme-secondary mb-2">
                    Affected Area: {event.affectedArea.toFixed(2)} km²
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      event.status === 'contained' ? 'bg-yellow-100 text-yellow-700' :
                      event.status === 'confirmed' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status}
                    </span>
                    {event.source && (
                      <span className="text-xs text-theme-secondary">{event.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Map */}
            <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden border border-gray-300">
              <MapWithNoSSR />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

