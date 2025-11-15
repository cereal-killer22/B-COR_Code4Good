import OceanHealthDashboard from '@/components/OceanHealthDashboard';
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CoastalRiskWidget />
          <AcidificationTracker />
        </div>
      </div>
    </div>
  );
}

