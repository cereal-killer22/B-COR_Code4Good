import CycloneMap from '@/components/CycloneMap';
import CycloneLayerToggles from '@/components/map/CycloneLayerToggles';
import { PageHeader } from '@/components/ui';

export default function CyclonePage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌀 Cyclone Prediction" 
        subtitle="Real-time cyclone risk assessment using pressure and wind data from Open-Meteo"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Map Section - Left side on desktop */}
          <div className="flex-1 bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Cyclone Risk Map</h2>
            <p className="text-sm text-theme-secondary mb-4">
              Risk assessment based on real-time atmospheric pressure and wind speed observations.
              Lower pressure and higher wind speeds indicate increased cyclone formation risk.
            </p>
            <div className="relative h-[650px] min-h-[650px] md:h-[75vh]">
              <CycloneMap />
              <div className="absolute top-4 right-4 z-[1000]">
                <CycloneLayerToggles />
              </div>
            </div>
          </div>
          
          {/* Info Card Section - Right side on desktop, below on mobile */}
          <div className="w-full md:w-80 lg:w-96 bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[650px] md:max-h-[75vh]">
            <h2 className="text-xl font-semibold mb-4">Cyclone Information</h2>
            <div className="space-y-4 text-sm text-theme-secondary">
              <p>Click on markers or regions on the map to view detailed cyclone risk information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

