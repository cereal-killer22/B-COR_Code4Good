'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface FloodLayerToggleState {
  floodZones: boolean;
  rainfallNow: boolean;
  rainfall24h: boolean;
  rainfall72h: boolean;
}

export interface CycloneLayerToggleState {
  cycloneTracks: boolean;
  cycloneWindRings: boolean;
  coneOfUncertainty: boolean;
  impactZones: boolean;
}

export interface OceanHealthLayerToggleState {
  coastalSegments: boolean;
  pollutionPlumes: boolean;
  waterQuality: boolean;
  reefHealth: boolean;
}

export interface LayerToggleState {
  flood: FloodLayerToggleState;
  cyclone: CycloneLayerToggleState;
  oceanHealth: OceanHealthLayerToggleState;
  elevationTerrain: boolean;
}

const defaultLayers: LayerToggleState = {
  flood: {
    floodZones: true,
    rainfallNow: true,
    rainfall24h: true,
    rainfall72h: false,
  },
  cyclone: {
    cycloneTracks: true,
    cycloneWindRings: true,
    coneOfUncertainty: true,
    impactZones: true,
  },
  oceanHealth: {
    coastalSegments: true,
    pollutionPlumes: true,
    waterQuality: true,
    reefHealth: true,
  },
  elevationTerrain: false,
};

interface LayerToggleContextType {
  layers: LayerToggleState;
  toggleFloodLayer: (layerId: keyof FloodLayerToggleState, enabled: boolean) => void;
  toggleCycloneLayer: (layerId: keyof CycloneLayerToggleState, enabled: boolean) => void;
  toggleOceanHealthLayer: (layerId: keyof OceanHealthLayerToggleState, enabled: boolean) => void;
  toggleElevationTerrain: (enabled: boolean) => void;
  isFloodLayerVisible: (layerId: keyof FloodLayerToggleState) => boolean;
  isCycloneLayerVisible: (layerId: keyof CycloneLayerToggleState) => boolean;
  isOceanHealthLayerVisible: (layerId: keyof OceanHealthLayerToggleState) => boolean;
  isElevationTerrainVisible: () => boolean;
}

const LayerToggleContext = createContext<LayerToggleContextType | undefined>(undefined);

export function LayerToggleProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerToggleState>(defaultLayers);
  
  const toggleFloodLayer = (layerId: keyof FloodLayerToggleState, enabled: boolean) => {
    setLayers(prev => ({
      ...prev,
      flood: { ...prev.flood, [layerId]: enabled }
    }));
  };
  
  const toggleCycloneLayer = (layerId: keyof CycloneLayerToggleState, enabled: boolean) => {
    setLayers(prev => ({
      ...prev,
      cyclone: { ...prev.cyclone, [layerId]: enabled }
    }));
  };
  
  const toggleOceanHealthLayer = (layerId: keyof OceanHealthLayerToggleState, enabled: boolean) => {
    setLayers(prev => ({
      ...prev,
      oceanHealth: { ...prev.oceanHealth, [layerId]: enabled }
    }));
  };
  
  const toggleElevationTerrain = (enabled: boolean) => {
    setLayers(prev => ({ ...prev, elevationTerrain: enabled }));
  };
  
  const isFloodLayerVisible = (layerId: keyof FloodLayerToggleState) => {
    return layers.flood[layerId];
  };
  
  const isCycloneLayerVisible = (layerId: keyof CycloneLayerToggleState) => {
    return layers.cyclone[layerId];
  };
  
  const isOceanHealthLayerVisible = (layerId: keyof OceanHealthLayerToggleState) => {
    return layers.oceanHealth[layerId];
  };
  
  const isElevationTerrainVisible = () => {
    return layers.elevationTerrain;
  };
  
  return (
    <LayerToggleContext.Provider value={{
      layers,
      toggleFloodLayer,
      toggleCycloneLayer,
      toggleOceanHealthLayer,
      toggleElevationTerrain,
      isFloodLayerVisible,
      isCycloneLayerVisible,
      isOceanHealthLayerVisible,
      isElevationTerrainVisible,
    }}>
      {children}
    </LayerToggleContext.Provider>
  );
}

export function useLayerToggle() {
  const context = useContext(LayerToggleContext);
  if (!context) {
    throw new Error('useLayerToggle must be used within LayerToggleProvider');
  }
  return context;
}

