/**
 * Layer Toggle Component
 * Provides UI for toggling map layers on/off
 */

'use client';

import { useState } from 'react';

export interface LayerToggleOption {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  color?: string;
}

interface LayerToggleProps {
  layers: LayerToggleOption[];
  onToggle: (layerId: string, enabled: boolean) => void;
  className?: string;
}

export default function LayerToggle({ layers, onToggle, className = '' }: LayerToggleProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Map Layers</h3>
      <div className="space-y-2">
        {layers.map((layer) => (
          <label
            key={layer.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
          >
            <input
              type="checkbox"
              checked={layer.enabled}
              onChange={(e) => onToggle(layer.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 flex-1">
              {layer.icon && <span className="text-lg">{layer.icon}</span>}
              <span className="text-sm text-gray-700 dark:text-gray-300">{layer.label}</span>
              {layer.color && (
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: layer.color }}
                />
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

