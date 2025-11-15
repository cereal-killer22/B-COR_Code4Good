import ReefHealthCard from '@/components/ReefHealthCard';
import { PageHeader } from '@/components/ui';

export default function ReefHealthPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🪸 Coral Reef Health" 
        subtitle="Coral bleaching prediction and reef monitoring"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ReefHealthCard />
      </div>
    </div>
  );
}

