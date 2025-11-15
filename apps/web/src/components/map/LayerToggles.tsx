'use client';

import { useLayerToggle } from '@/contexts/LayerToggleContext';

export default function LayerToggles() {
  const { layers, toggleLayer } = useLayerToggle();
  
  const layerConfig = [
    { id: 'floodZones' as const, label: 'Flood Risk Zones', icon: '🌊', color: '#dc2626' },
    { id: 'rainfallNow' as const, label: 'Rainfall (Now)', icon: '🌧️', color: '#3b82f6' },
    { id: 'rainfall24h' as const, label: 'Rainfall (24h)', icon: '📅', color: '#ea580c' },
    { id: 'rainfall72h' as const, label: 'Rainfall (72h)', icon: '📆', color: '#eab308' },
    { id: 'cycloneTracks' as const, label: 'Cyclone Tracks', icon: '🌀', color: '#FF3B30' },
    { id: 'cycloneWindRings' as const, label: 'Wind Radius Rings', icon: '💨', color: '#FF9500' },
    { id: 'coneOfUncertainty' as const, label: 'Cone of Uncertainty', icon: '📐', color: '#FF3B30' },
    { id: 'coastalSegments' as const, label: 'Coastal Segments', icon: '🌊', color: '#22c55e' },
    { id: 'pollutionPlumes' as const, label: 'Pollution Plumes', icon: '🚨', color: '#dc2626' },
    { id: 'elevationTerrain' as const, label: 'Elevation/Terrain', icon: '⛰️', color: '#8b5cf6' },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Map Layers</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {layerConfig.map((layer) => (
          <label
            key={layer.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <input
              type="checkbox"
              checked={layers[layer.id]}
              onChange={(e) => {
                e.stopPropagation();
                toggleLayer(layer.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{layer.icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{layer.label}</span>
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: layer.color }}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

