import CycloneMap from '@/components/CycloneMap';
import { PageHeader } from '@/components/ui';

export default function CyclonePage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌀 Cyclone Prediction" 
        subtitle="Real-time cyclone risk assessment using pressure and wind data from Open-Meteo"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Cyclone Risk Map</h2>
          <p className="text-sm text-theme-secondary mb-4">
            Risk assessment based on real-time atmospheric pressure and wind speed observations.
            Lower pressure and higher wind speeds indicate increased cyclone formation risk.
          </p>
          <CycloneMap />
        </div>
      </div>
    </div>
  );
}

