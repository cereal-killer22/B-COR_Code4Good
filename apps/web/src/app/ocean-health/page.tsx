import OceanHealthDashboard from '@/components/OceanHealthDashboard';
import OceanHealthMap from '@/components/OceanHealthMap';
import BleachingRiskPanel from '@/components/BleachingRiskPanel';
import AcidificationTracker from '@/components/AcidificationTracker';
import CoastalRiskWidget from '@/components/CoastalRiskWidget';
import { PageHeader } from '@/components/ui';

export default function OceanHealthPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌊 Ocean Health" 
        subtitle="Comprehensive marine ecosystem monitoring using real-time satellite and ocean data"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <OceanHealthDashboard />
        
        {/* Ocean Health Map */}
        <div className="bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Ocean Health Map</h2>
          <p className="text-sm text-theme-secondary mb-4">
            Real-time ocean health assessment using NOAA Coral Reef Watch data (SST, HotSpot, DHW).
            Health score calculated from sea surface temperature, heat stress, and degree heating weeks.
          </p>
          <OceanHealthMap />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BleachingRiskPanel />
          <CoastalRiskWidget />
        </div>
        
        <AcidificationTracker />
      </div>
    </div>
  );
}

