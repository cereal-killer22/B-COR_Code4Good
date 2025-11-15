import { FloodDataMap } from '@/components/map/DataMapComponents';
import { PageHeader } from '@/components/ui';

export default function FloodSensePage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌊 FloodSense Prediction" 
        subtitle="Real-time flood risk assessment using precipitation data from Open-Meteo"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Flood Risk Map</h2>
          <p className="text-sm text-theme-secondary mb-4">
            Risk assessment based on 24-hour and 72-hour rainfall accumulation.
            Higher precipitation and soil saturation increase flood risk.
          </p>
          <FloodDataMap lat={-20.2} lng={57.5} />
        </div>
      </div>
    </div>
  );
}

