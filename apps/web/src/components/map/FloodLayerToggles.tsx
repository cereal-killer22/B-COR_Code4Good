'use client';

import { useLayerToggle } from '@/contexts/LayerToggleContext';

export default function FloodLayerToggles() {
  const { layers, toggleFloodLayer } = useLayerToggle();
  
  const layerConfig = [
    { id: 'floodZones' as const, label: 'Flood Risk Zones', icon: '🌊', color: '#dc2626' },
    { id: 'rainfallNow' as const, label: 'Rainfall (Now)', icon: '🌧️', color: '#3b82f6' },
    { id: 'rainfall24h' as const, label: 'Rainfall (24h)', icon: '📅', color: '#ea580c' },
    { id: 'rainfall72h' as const, label: 'Rainfall (72h)', icon: '📆', color: '#eab308' },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Flood Layers</h3>
      <div className="space-y-1.5">
        {layerConfig.map((layer) => (
          <label
            key={layer.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1.5 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <input
              type="checkbox"
              checked={layers.flood[layer.id]}
              onChange={(e) => {
                e.stopPropagation();
                toggleFloodLayer(layer.id, e.target.checked);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base flex-shrink-0">{layer.icon}</span>
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{layer.label}</span>
              <div
                className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: layer.color }}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

