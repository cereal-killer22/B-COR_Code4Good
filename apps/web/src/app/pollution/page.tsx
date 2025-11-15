import PollutionMap from '@/components/PollutionMap';
import { PageHeader } from '@/components/ui';

export default function PollutionPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🚨 Pollution Monitoring" 
        subtitle="Real-time pollution detection and tracking"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PollutionMap />
      </div>
    </div>
  );
}

