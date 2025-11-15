import BiodiversityPanel from '@/components/BiodiversityPanel';
import { PageHeader } from '@/components/ui';

export default function BiodiversityPage() {
  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🐠 Marine Biodiversity" 
        subtitle="Species monitoring and habitat health tracking"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <BiodiversityPanel />
      </div>
    </div>
  );
}

