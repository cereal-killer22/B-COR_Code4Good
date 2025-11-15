import OceanHealthDashboard from '@/components/OceanHealthDashboard';
import AcidificationTracker from '@/components/AcidificationTracker';
import { PageHeader } from '@/components/ui';

export default function OceanHealthPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌊 Ocean Health" 
        subtitle="Comprehensive marine ecosystem monitoring and protection"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <OceanHealthDashboard />
        <AcidificationTracker />
      </div>
    </div>
  );
}

