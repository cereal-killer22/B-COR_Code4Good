'use client';

import { useState, useEffect } from 'react';
import { Card, MetricCard, StatusBadge } from '@/components/ui';
import type { BiodiversityMetrics } from '@climaguard/shared/types/ocean';

export default function BiodiversityPanel() {
  const [biodiversity, setBiodiversity] = useState<BiodiversityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState<[number, number]>([-20.0, 57.5]);
  
  useEffect(() => {
    fetchBiodiversity();
    const interval = setInterval(fetchBiodiversity, 600000); // 10 min
    return () => clearInterval(interval);
  }, []);
  
  async function fetchBiodiversity() {
    try {
      setLoading(true);
      const response = await fetch(`/api/biodiversity?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        setBiodiversity(data.biodiversity);
      }
    } catch (error) {
      console.error('Failed to fetch biodiversity data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <div className="text-theme-secondary">Loading biodiversity data...</div>
        </div>
      </Card>
    );
  }
  
  if (!biodiversity) {
    return (
      <Card>
        <div className="text-center py-8 text-theme-secondary">
          No biodiversity data available
        </div>
      </Card>
    );
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'common': return 'text-green-600';
      case 'threatened': return 'text-yellow-600';
      case 'endangered': return 'text-orange-600';
      case 'critically_endangered': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'common': return 'success';
      case 'threatened': return 'info';
      case 'endangered': return 'warning';
      case 'critically_endangered': return 'danger';
      default: return 'info';
    }
  };
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme">🐠 Marine Biodiversity</h2>
        <StatusBadge status={biodiversity.biodiversityIndex >= 70 ? 'success' : 'warning'}>
          Index: {biodiversity.biodiversityIndex}/100
        </StatusBadge>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon="🐟"
          title="Total Species"
          value={biodiversity.speciesCount}
          subtitle="Recorded species"
        />
        <MetricCard
          icon="⚠️"
          title="Endangered"
          value={biodiversity.endangeredSpecies}
          subtitle="At risk species"
        />
        <MetricCard
          icon="📊"
          title="Biodiversity Index"
          value={`${biodiversity.biodiversityIndex}/100`}
          subtitle="Overall diversity"
        />
      </div>
      
      {/* Species List */}
      {biodiversity.speciesList && biodiversity.speciesList.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold text-theme mb-3">Key Species</h3>
          <div className="space-y-2">
            {biodiversity.speciesList.slice(0, 8).map((species, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🐠</span>
                <div>
                  <div className="font-semibold text-theme">{species.name}</div>
                  <div className="text-sm text-theme-secondary">
                    Population: {species.population.toLocaleString()}
                  </div>
                </div>
              </div>
              <StatusBadge status={getStatusBadge(species.status)}>
                {species.status.replace('_', ' ')}
              </StatusBadge>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-theme-secondary text-center">
            Species data requires biodiversity database access (not available in free APIs).
            Biodiversity index calculated from real chlorophyll and water quality data.
          </p>
        </div>
      )}
      
      {/* Habitat Health */}
      <div>
        <h3 className="font-semibold text-theme mb-3">Habitat Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-2xl mb-2">🪸</div>
            <div className="text-sm text-theme-secondary mb-1">Coral</div>
            <div className="text-xl font-bold text-theme">{biodiversity.habitatHealth.coral.toFixed(0)}/100</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl mb-2">🌿</div>
            <div className="text-sm text-theme-secondary mb-1">Seagrass</div>
            <div className="text-xl font-bold text-theme">{biodiversity.habitatHealth.seagrass.toFixed(0)}/100</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <div className="text-2xl mb-2">🌳</div>
            <div className="text-sm text-theme-secondary mb-1">Mangrove</div>
            <div className="text-xl font-bold text-theme">{biodiversity.habitatHealth.mangrove.toFixed(0)}/100</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-theme-secondary mb-1">Overall</div>
            <div className="text-xl font-bold text-theme">{biodiversity.habitatHealth.overall.toFixed(0)}/100</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

