'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import BaseMapboxMap from './BaseMapboxMap';
import { 
  addMapboxMarker, 
  addMapboxWindRings,
  addMapboxConeOfUncertainty,
  addMapboxRoute,
  addMapboxPolygon,
  registerMapboxLayer,
  showMapboxLayer,
  hideMapboxLayer,
} from '@/lib/map/MapboxEngine';
import { useLayerToggle } from '@/contexts/LayerToggleContext';
import type { CyclonePrediction } from '@climaguard/shared/types/climate';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';

interface CycloneMapProps {
  lat?: number;
  lng?: number;
}

export default function CycloneMap({ lat = -20.2, lng = 57.5 }: CycloneMapProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const trackMarkersRef = useRef<Marker[]>([]);
  const historicalMarkersRef = useRef<Marker[]>([]);
  const layerIdsRef = useRef<string[]>([]);
  const containerId = useMemo(() => `cyclone-map-${Math.random().toString(36).substr(2, 9)}`, []);
  const { layers } = useLayerToggle();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const [predictionResponse, historicalResponse] = await Promise.all([
          fetch(`/api/cyclone?lat=${lat}&lng=${lng}`),
          fetch('/api/cyclone/historical')
        ]);
        
        if (predictionResponse.ok) {
          const data = await predictionResponse.json();
          setPrediction(data);
        } else {
          setError('Failed to fetch cyclone prediction');
        }
        
        if (historicalResponse.ok) {
          const historical = await historicalResponse.json();
          setHistoricalData(historical);
        }
      } catch (err) {
        console.error('Error fetching cyclone data:', err);
        setError('Error loading cyclone data');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 300000);
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

  const updateHistoricalLayers = (map: MapboxMap) => {
    if (!historicalData) return;
    
    // Wait for map to be ready
    if (!map.loaded() || !map.isStyleLoaded()) {
      const updateWhenReady = () => {
        if (mapRef.current && mapRef.current.loaded() && mapRef.current.isStyleLoaded() && historicalData) {
          updateHistoricalLayers(mapRef.current);
        }
      };
      
      map.once('load', updateWhenReady);
      map.once('style.load', updateWhenReady);
      return;
    }

    // Clear existing historical markers
    historicalMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    historicalMarkersRef.current = [];

    // Add historical cyclone tracks
    if (layers.cyclone.cycloneTracks && historicalData.historicalCyclones) {
      historicalData.historicalCyclones.forEach((cyclone: any, index: number) => {
        if (cyclone.track && cyclone.track.length > 1) {
          const trackColor = cyclone.category >= 4 ? '#dc2626' : cyclone.category >= 3 ? '#ea580c' : cyclone.category >= 2 ? '#eab308' : '#3b82f6';
          const trackLayerId = `historical-track-${cyclone.id}`;
          
          const trackCoords = cyclone.track.map((point: [number, number]) => [point[0], point[1]]);
          addMapboxRoute(
            map,
            trackCoords,
            {
              layerId: trackLayerId,
              color: trackColor,
              width: 3,
              opacity: 0.6,
            }
          );
          layerIdsRef.current.push(trackLayerId);
          registerMapboxLayer(map, `historicalTrack${index}`, trackLayerId);
          
          // Add marker at the start of the track (cyclone origin)
          const startPoint = cyclone.track[0];
          const startPopupHTML = `
            <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:14px;">
              <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">🌀 ${cyclone.name} (${cyclone.year})</h3>
              <div style="space-y:6px;font-size:13px;">
                <div>
                  <span style="font-weight:600;">Category:</span>{' '}
                  <span style="color:${trackColor};font-weight:700;">Category ${cyclone.category}</span>
                </div>
                <div>
                  <span style="font-weight:600;">Max Wind Speed:</span>{' '}
                  <span style="color:#666;">${cyclone.maxWindSpeed} km/h</span>
                </div>
                <div>
                  <span style="font-weight:600;">Origin:</span>{' '}
                  <span style="color:#666;">${startPoint[1].toFixed(2)}°S, ${startPoint[0].toFixed(2)}°E</span>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#666;">
                  Historical cyclone track - ${cyclone.year}
                </div>
              </div>
            </div>
          `;
          
          const startMarker = addMapboxMarker(
            map,
            startPoint,
            {
              color: trackColor,
              size: 18,
            },
            startPopupHTML
          );
          historicalMarkersRef.current.push(startMarker);
          
          // Add marker at the end of the track (if different from start)
          if (cyclone.track.length > 1) {
            const endPoint = cyclone.track[cyclone.track.length - 1];
            const distance = Math.sqrt(
              Math.pow(endPoint[0] - startPoint[0], 2) + Math.pow(endPoint[1] - startPoint[1], 2)
            );
            
            // Only add end marker if it's significantly different from start
            if (distance > 0.1) {
              const endPopupHTML = `
                <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:14px;">
                  <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">🌀 ${cyclone.name} - End Point</h3>
                  <div style="space-y:6px;font-size:13px;">
                    <div>
                      <span style="font-weight:600;">Final Position:</span>{' '}
                      <span style="color:#666;">${endPoint[1].toFixed(2)}°S, ${endPoint[0].toFixed(2)}°E</span>
                    </div>
                    <div>
                      <span style="font-weight:600;">Track Length:</span>{' '}
                      <span style="color:#666;">${cyclone.track.length} points</span>
                    </div>
                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#666;">
                      End of ${cyclone.name} track - ${cyclone.year}
                    </div>
                  </div>
                </div>
              `;
              
              const endMarker = addMapboxMarker(
                map,
                endPoint,
                {
                  color: trackColor,
                  size: 16,
                },
                endPopupHTML
              );
              historicalMarkersRef.current.push(endMarker);
            }
          }
        }
      });
    }

    // Add impact location markers
    if (layers.cyclone.impactZones && historicalData.impactLocations) {
      historicalData.impactLocations.forEach((impact: any) => {
        const severityColor = 
          impact.severity === 'severe' ? '#dc2626' :
          impact.severity === 'high' ? '#ea580c' :
          impact.severity === 'moderate' ? '#eab308' : '#22c55e';
        
        const impactPopupHTML = `
          <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:12px;">
            <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#222;">📍 ${impact.name}</h3>
            <div style="space-y:4px;font-size:12px;">
              <div>
                <span style="font-weight:600;">Cyclone:</span>{' '}
                ${impact.cycloneName} (${impact.cycloneYear})
              </div>
              <div>
                <span style="font-weight:600;">Category:</span>{' '}
                Category ${impact.cycloneCategory}
              </div>
              <div>
                <span style="font-weight:600;">Severity:</span>{' '}
                <span style="text-transform:uppercase;color:${severityColor};font-weight:700;">
                  ${impact.severity}
                </span>
              </div>
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
                <span style="font-weight:600;">Damage:</span>{' '}
                ${impact.damage}
              </div>
            </div>
          </div>
        `;

        const marker = addMapboxMarker(
          map,
          [impact.lng, impact.lat],
          {
            color: severityColor,
            size: 20,
          },
          impactPopupHTML
        );
        historicalMarkersRef.current.push(marker);
      });
    }

    // Add formation zones (always visible when historical data is loaded)
    if (historicalData.formationZones) {
      historicalData.formationZones.forEach((zone: any) => {
        try {
          const zoneColor = 
            zone.probability === 'high' ? '#dc2626' :
            zone.probability === 'moderate-high' ? '#ea580c' :
            zone.probability === 'moderate' ? '#eab308' : '#3b82f6';
          
          const zoneLayerId = `formation-zone-${zone.id}`;
          
          // Ensure bounds are in [lng, lat] format and closed
          const bounds = zone.bounds.map((coord: [number, number]) => [coord[0], coord[1]]);
          // Ensure polygon is closed
          if (bounds.length > 0) {
            const first = bounds[0];
            const last = bounds[bounds.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              bounds.push([first[0], first[1]]);
            }
          }
          
          addMapboxPolygon(
            map,
            bounds,
            {
              layerId: zoneLayerId,
              color: zoneColor,
              fillOpacity: 0.15,
              strokeColor: zoneColor,
              strokeWidth: 2,
            }
          );
          layerIdsRef.current.push(zoneLayerId);
          registerMapboxLayer(map, `formationZone${zone.id}`, zoneLayerId);

          // Add center marker with popup
          const zonePopupHTML = `
            <div style="width:300px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:12px;">
              <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#222;">🌊 ${zone.name}</h3>
              <div style="space-y:4px;font-size:12px;">
                <div>
                  <span style="font-weight:600;">Formation Probability:</span>{' '}
                  <span style="text-transform:uppercase;color:${zoneColor};font-weight:700;">
                    ${zone.probability}
                  </span>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
                  ${zone.description}
                </div>
                <div style="margin-top:4px;font-size:11px;color:#666;">
                  Peak Season: ${zone.peakSeason}
                </div>
              </div>
            </div>
          `;

          const marker = addMapboxMarker(
            map,
            zone.center,
            {
              color: zoneColor,
              size: 16,
            },
            zonePopupHTML
          );
          historicalMarkersRef.current.push(marker);
        } catch (error) {
          console.error('Error adding formation zone:', error, zone);
        }
      });
    }
  };

  const updateLayers = (map: MapboxMap) => {
    // Ensure map is ready
    if (!map || !map.loaded() || !map.getContainer()) {
      return;
    }

    // Clear existing track markers
    trackMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    trackMarkersRef.current = [];

    // Clear existing historical markers (but preserve formation zone markers)
    historicalMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    historicalMarkersRef.current = [];

    // Clear existing layers (but preserve historical tracks, current track, and formation zones)
    const preserveHistoricalTracks = layers.cyclone.cycloneTracks;
    const preserveCurrentTrack = true; // Always preserve current track (can be hidden/shown)
    const preserveFormationZones = true; // Always preserve formation zones
    
    layerIdsRef.current = layerIdsRef.current.filter(layerId => {
      const isHistoricalTrack = layerId.startsWith('historical-track-');
      const isCurrentTrack = layerId === 'cyclone-track';
      const isFormationZone = layerId.startsWith('formation-zone-');
      
      if ((isHistoricalTrack && preserveHistoricalTracks) || 
          (isCurrentTrack && preserveCurrentTrack) || 
          (isFormationZone && preserveFormationZones)) {
        return true; // Keep this layer
      }
      
      // Remove this layer - with error handling
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getLayer(`${layerId}-stroke`)) {
          map.removeLayer(`${layerId}-stroke`);
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      } catch (e) {
        // Ignore errors when removing layers (they might not exist)
        console.warn('Error removing layer:', layerId, e);
      }
      return false;
    });

    // Update historical layers (will re-add if needed)
    updateHistoricalLayers(map);

    if (!prediction) return;

    // Add wind-radius rings if enabled
    if (layers.cyclone.cycloneWindRings && prediction.windRadii && prediction.windRadii.length > 0) {
      const ringLayerIds = addMapboxWindRings(
        map,
        [lng, lat],
        prediction.windRadii,
        { layerIdPrefix: 'cyclone-wind' }
      );
      layerIdsRef.current.push(...ringLayerIds);
      ringLayerIds.forEach((id, index) => {
        registerMapboxLayer(map, `windRing${index}`, id);
      });
    }

    // Add cone of uncertainty if enabled
    if (layers.cyclone.coneOfUncertainty && prediction.forecastTrack && prediction.forecastWidths) {
      const coneLayerId = addMapboxConeOfUncertainty(
        map,
        prediction.forecastTrack,
        prediction.forecastWidths,
        { layerId: 'cyclone-cone' }
      );
      layerIdsRef.current.push(coneLayerId);
      registerMapboxLayer(map, 'coneOfUncertainty', coneLayerId);
    }

    // Add cyclone track if enabled
    if (layers.cyclone.cycloneTracks && prediction.forecastTrack && prediction.forecastTrack.length > 1) {
      const trackLayerId = addMapboxRoute(
        map,
        prediction.forecastTrack,
        {
          layerId: 'cyclone-track',
          color: '#FF3B30',
          width: 5,
          opacity: 0.9,
        }
      );
      layerIdsRef.current.push(trackLayerId);
      registerMapboxLayer(map, 'cycloneTracks', trackLayerId);
      
      // Add markers along the track for key forecast points
      prediction.forecastTrack.forEach((point: [number, number], index: number) => {
        if (index > 0 && index % 2 === 0) { // Every other point after the first
          const hoursAhead = index * 6;
          const trackPopupHTML = `
            <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:14px;">
              <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">📍 Forecast Point</h3>
              <div style="space-y:6px;font-size:13px;">
                <div>
                  <span style="font-weight:600;">Time:</span>{' '}
                  <span style="color:#666;">+${hoursAhead} hours</span>
                </div>
                <div>
                  <span style="font-weight:600;">Position:</span>{' '}
                  <span style="color:#666;">${point[1].toFixed(3)}°S, ${point[0].toFixed(3)}°E</span>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#666;">
                  Forecast position along cyclone track
                </div>
              </div>
            </div>
          `;
          
          // Add marker immediately if map is ready, otherwise it will be added when map loads
          const marker = addMapboxMarker(
            map,
            point,
            {
              color: '#FF3B30',
              size: 14,
            },
            trackPopupHTML
          );
          trackMarkersRef.current.push(marker);
        }
      });
    }
  };

  const updateMarker = (map: MapboxMap) => {
    if (!prediction) return;
    
    // Ensure map is ready before adding markers
    if (!map.loaded() || !map.getContainer()) {
      map.once('load', () => {
        if (mapRef.current && prediction) {
          updateMarker(mapRef.current);
        }
      });
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const color = getRiskColor(prediction.prediction.riskLevel);
    
    // Calculate movement speed and direction for trajectory info
    const movementSpeed = prediction.forecastTrack && prediction.forecastTrack.length > 1
      ? Math.sqrt(
          Math.pow((prediction.forecastTrack[1][0] - prediction.forecastTrack[0][0]) * 111 * Math.cos(lat * Math.PI / 180), 2) +
          Math.pow((prediction.forecastTrack[1][1] - prediction.forecastTrack[0][1]) * 111, 2)
        ) * 4 // Approximate km/h (6-hour intervals)
      : 0;
    
    const popupHTML = `
      <div style="width:340px;font-family:'Figtree',sans-serif;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;padding:16px;">
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#222;">🌀 Cyclone Risk Assessment</h3>
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
            <span style="font-weight:600;">Pressure:</span>{' '}
            ${prediction.observations.minPressure.toFixed(1)} hPa
          </div>
          <div>
            <span style="font-weight:600;">Wind Speed:</span>{' '}
            ${prediction.observations.maxWindSpeed.toFixed(1)} km/h
            ${prediction.observations.maxWindKnots ? ` (${prediction.observations.maxWindKnots.toFixed(1)} kt)` : ''}
          </div>
          ${movementSpeed > 0 ? `
          <div>
            <span style="font-weight:600;">Movement Speed:</span>{' '}
            ${movementSpeed.toFixed(1)} km/h
          </div>
          ` : ''}
          ${prediction.forecastTrack && prediction.forecastTrack.length > 1 ? `
          <div>
            <span style="font-weight:600;">Forecast Track:</span>{' '}
            ${prediction.forecastTrack.length - 1} points (${(prediction.forecastTrack.length - 1) * 6}h ahead)
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
        size: 26,
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
    updateLayers(map);

    setTimeout(() => {
      map.resize();
    }, 100);
  };

  useEffect(() => {
    if (mapRef.current) {
      if (prediction) {
        updateMarker(mapRef.current);
      }
      updateLayers(mapRef.current);
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [prediction, historicalData, lat, lng, layers.cyclone]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.loaded()) return;

    if (layers.cyclone.cycloneWindRings) {
      layerIdsRef.current.forEach(id => {
        if (id.startsWith('cyclone-wind')) {
          showMapboxLayer(mapRef.current!, id);
        }
      });
    } else {
      layerIdsRef.current.forEach(id => {
        if (id.startsWith('cyclone-wind')) {
          hideMapboxLayer(mapRef.current!, id);
        }
      });
    }

    if (layers.cyclone.coneOfUncertainty) {
      showMapboxLayer(mapRef.current!, 'cyclone-cone');
    } else {
      hideMapboxLayer(mapRef.current!, 'cyclone-cone');
    }

    if (layers.cyclone.cycloneTracks) {
      // Check if current cyclone track exists, if not re-add it
      const hasCurrentTrack = mapRef.current.getLayer('cyclone-track');
      if (!hasCurrentTrack && prediction && prediction.forecastTrack && prediction.forecastTrack.length > 1) {
        // Re-add the current cyclone track
        const trackLayerId = addMapboxRoute(
          mapRef.current!,
          prediction.forecastTrack,
          {
            layerId: 'cyclone-track',
            color: '#FF3B30',
            width: 5,
            opacity: 0.9,
          }
        );
        layerIdsRef.current.push(trackLayerId);
        registerMapboxLayer(mapRef.current!, 'cycloneTracks', trackLayerId);
        
          // Re-add track markers
          prediction.forecastTrack.forEach((point: [number, number], index: number) => {
            if (index > 0 && index % 2 === 0) {
              const hoursAhead = index * 6;
              const trackPopupHTML = `
                <div style="width:280px;font-family:'Figtree',sans-serif;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);overflow:hidden;padding:14px;">
                  <h3 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#222;">📍 Forecast Point</h3>
                  <div style="space-y:6px;font-size:13px;">
                    <div>
                      <span style="font-weight:600;">Time:</span>{' '}
                      <span style="color:#666;">+${hoursAhead} hours</span>
                    </div>
                    <div>
                      <span style="font-weight:600;">Position:</span>{' '}
                      <span style="color:#666;">${point[1].toFixed(3)}°S, ${point[0].toFixed(3)}°E</span>
                    </div>
                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:11px;color:#666;">
                      Forecast position along cyclone track
                    </div>
                  </div>
                </div>
              `;
              
              const marker = addMapboxMarker(
                mapRef.current!,
                point,
                {
                  color: '#FF3B30',
                  size: 14,
                },
                trackPopupHTML
              );
              trackMarkersRef.current.push(marker);
            }
          });
      } else if (hasCurrentTrack) {
        showMapboxLayer(mapRef.current!, 'cyclone-track');
      }
      
      // Re-render historical tracks if they don't exist
      if (historicalData) {
        const hasHistoricalTracks = layerIdsRef.current.some(id => id.startsWith('historical-track-'));
        if (!hasHistoricalTracks) {
          // Re-add historical tracks
          updateHistoricalLayers(mapRef.current);
        } else {
          // Just show existing historical tracks
          layerIdsRef.current.forEach(id => {
            if (id.startsWith('historical-track-')) {
              showMapboxLayer(mapRef.current!, id);
            }
          });
        }
      }
    } else {
      hideMapboxLayer(mapRef.current!, 'cyclone-track');
      // Hide historical tracks (but don't remove them)
      layerIdsRef.current.forEach(id => {
        if (id.startsWith('historical-track-')) {
          hideMapboxLayer(mapRef.current!, id);
        }
      });
    }

    // Ensure formation zones are always visible
    layerIdsRef.current.forEach(id => {
      if (id.startsWith('formation-zone-')) {
        showMapboxLayer(mapRef.current!, id);
      }
    });

    // Re-render historical layers when impactZones toggles
    if (historicalData && layers.cyclone.impactZones) {
      const hasImpactMarkers = historicalMarkersRef.current.length > 0;
      if (!hasImpactMarkers) {
        updateHistoricalLayers(mapRef.current);
      }
    } else if (!layers.cyclone.impactZones) {
      // Hide impact markers but keep formation zones
      historicalMarkersRef.current.forEach(marker => {
        if (marker) {
          const popup = marker.getPopup();
          if (popup && popup.isOpen()) {
            popup.remove();
          }
          marker.remove();
        }
      });
      historicalMarkersRef.current = [];
    }
  }, [layers.cyclone.cycloneWindRings, layers.cyclone.coneOfUncertainty, layers.cyclone.cycloneTracks, layers.cyclone.impactZones, historicalData]);

  if (loading) {
    return (
      <div className="w-full h-[650px] min-h-[650px] md:h-[75vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading cyclone prediction...</div>
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
