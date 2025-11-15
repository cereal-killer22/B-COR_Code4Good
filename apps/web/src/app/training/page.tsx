/**
 * Training Page for ClimaGuard AI Models
 */

import CycloneTrainingDashboard from '../../components/training/CycloneTrainingDashboard';

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Model Training</h1>
          <p className="text-gray-600 mt-2">
            Manage continuous learning for cyclone prediction and flood analysis models
          </p>
        </div>
        
        <CycloneTrainingDashboard />
      </div>
    </div>
  );
}