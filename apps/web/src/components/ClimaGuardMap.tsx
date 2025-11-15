'use client';

import { 
  OceanHealthDataMap,
  PollutionDataMap,
  FloodDataMap,
  CycloneDataMap,
  FishingActivityDataMap,
} from '@/components/map/DataMapComponents';

type MapType = 'ocean-health' | 'pollution' | 'flood' | 'cyclone' | 'fishing' | 'overview';

interface ClimaGuardMapProps {
  type?: MapType;
  lat?: number;
  lng?: number;
  className?: string;
}

/**
 * ClimaGuard Map Component
 * Generic map wrapper that displays the appropriate data-driven map based on type
 */
export default function ClimaGuardMap({ 
  type = 'overview',
  lat = -20.2,
  lng = 57.5,
  className = ''
}: ClimaGuardMapProps) {
  const mapComponents = {
    'ocean-health': <OceanHealthDataMap lat={lat} lng={lng} />,
    'pollution': <PollutionDataMap lat={lat} lng={lng} />,
    'flood': <FloodDataMap lat={lat} lng={lng} />,
    'cyclone': <CycloneDataMap lat={lat} lng={lng} />,
    'fishing': <FishingActivityDataMap lat={lat} lng={lng} />,
    'overview': <OceanHealthDataMap lat={lat} lng={lng} />, // Default to ocean health for overview
  };

  return (
    <div className={`w-full h-96 rounded-lg overflow-hidden border border-gray-300 ${className}`}>
      {mapComponents[type]}
    </div>
  );
}