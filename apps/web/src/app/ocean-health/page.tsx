import OceanHealthDashboard from '@/components/OceanHealthDashboard';
import SDG14Dashboard from '@/components/SDG14Dashboard';
import { OceanHealthDataMap } from '@/components/map/DataMapComponents';
import BleachingRiskPanel from '@/components/BleachingRiskPanel';
import AcidificationTracker from '@/components/AcidificationTracker';
import CoastalRiskWidget from '@/components/CoastalRiskWidget';
import OceanHealthLayerToggles from '@/components/map/OceanHealthLayerToggles';
import { PageHeader } from '@/components/ui';

export default function OceanHealthPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌊 Ocean Health & SDG 14" 
        subtitle="Comprehensive marine ecosystem monitoring and SDG 14 (Life Below Water) implementation using real-time satellite and ocean data"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* SDG 14 Comprehensive Dashboard */}
        <SDG14Dashboard lat={-20.2} lng={57.5} region="Mauritius" />
        
        {/* Ocean Health Overview */}
        <OceanHealthDashboard />
        
        {/* Ocean Health Map */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Ocean Health Map</h2>
            <p className="text-sm text-theme-secondary mb-4">
              Real-time ocean health assessment using NOAA Coral Reef Watch data (SST, HotSpot, DHW).
              Health score calculated from sea surface temperature, heat stress, and degree heating weeks.
            </p>
            <div className="relative">
              <OceanHealthDataMap lat={-20.2} lng={57.5} />
              <div className="absolute top-4 right-4 z-[1000]">
                <OceanHealthLayerToggles />
              </div>
            </div>
          </div>
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

