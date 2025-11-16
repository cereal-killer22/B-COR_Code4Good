'use client';

import { useLayerToggle } from '@/contexts/LayerToggleContext';

/**
 * Overview Toggle Component
 * Universal layer toggle for the Overview/Dashboard page
 * Shows ALL available layers from all modules
 */
export default function OverviewToggle() {
  const { layers, toggleFloodLayer, toggleCycloneLayer, toggleOceanHealthLayer, toggleElevationTerrain } = useLayerToggle();
  
  const layerConfig = [
    // Coral Reef / Ocean Health Layers
    { 
      id: 'coastalSegments' as const, 
      label: 'Coral Reef Regions', 
      icon: '🪸', 
      color: '#22c55e',
      category: 'ocean',
      toggle: (enabled: boolean) => toggleOceanHealthLayer('coastalSegments', enabled)
    },
    { 
      id: 'reefHealth' as const, 
      label: 'Reef Health Markers', 
      icon: '🪸', 
      color: '#10b981',
      category: 'ocean',
      toggle: (enabled: boolean) => toggleOceanHealthLayer('reefHealth', enabled)
    },
    // Flood Layers
    { 
      id: 'floodZones' as const, 
      label: 'Flood Risk Zones', 
      icon: '🌊', 
      color: '#dc2626',
      category: 'flood',
      toggle: (enabled: boolean) => toggleFloodLayer('floodZones', enabled)
    },
    { 
      id: 'rainfallNow' as const, 
      label: 'Rainfall (Now)', 
      icon: '🌧️', 
      color: '#3b82f6',
      category: 'flood',
      toggle: (enabled: boolean) => toggleFloodLayer('rainfallNow', enabled)
    },
    { 
      id: 'rainfall24h' as const, 
      label: 'Rainfall (24h)', 
      icon: '📅', 
      color: '#ea580c',
      category: 'flood',
      toggle: (enabled: boolean) => toggleFloodLayer('rainfall24h', enabled)
    },
    { 
      id: 'rainfall72h' as const, 
      label: 'Rainfall (72h)', 
      icon: '📆', 
      color: '#eab308',
      category: 'flood',
      toggle: (enabled: boolean) => toggleFloodLayer('rainfall72h', enabled)
    },
  ];
  
  const getLayerChecked = (layer: typeof layerConfig[0]) => {
    if (layer.category === 'flood') {
      return layers.flood[layer.id as keyof typeof layers.flood] || false;
    } else if (layer.category === 'ocean') {
      return layers.oceanHealth[layer.id as keyof typeof layers.oceanHealth] || false;
    }
    return false;
  };
  
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
              checked={getLayerChecked(layer)}
              onChange={(e) => {
                e.stopPropagation();
                layer.toggle(e.target.checked);
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

