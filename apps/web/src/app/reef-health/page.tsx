import BleachingRiskPanel from '@/components/BleachingRiskPanel';
import ReefHealthCard from '@/components/ReefHealthCard';
import { PageHeader } from '@/components/ui';

export default function ReefHealthPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🪸 Coral Reef Health" 
        subtitle="Real-time coral bleaching prediction using NOAA Coral Reef Watch data"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <BleachingRiskPanel />
        <ReefHealthCard />
      </div>
    </div>
  );
}

