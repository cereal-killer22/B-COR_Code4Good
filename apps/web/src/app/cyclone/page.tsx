import { CycloneDataMap } from '@/components/map/DataMapComponents';
import { PageHeader } from '@/components/ui';

export default function CyclonePage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌀 Cyclone Tracking" 
        subtitle="Real-time cyclone monitoring and tracking using NOAA data"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Cyclone Tracking Map</h2>
          <p className="text-sm text-theme-secondary mb-4">
            Real-time active cyclone positions, tracks, and wind radius data from NOAA.
            Shows current cyclone locations, intensity, and predicted paths.
          </p>
          <CycloneDataMap lat={-20.2} lng={57.5} />
        </div>
      </div>
    </div>
  );
}

