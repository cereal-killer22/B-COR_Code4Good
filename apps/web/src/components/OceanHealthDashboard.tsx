'use client';

import { useState, useEffect } from 'react';
import { Card, MetricCard, StatusBadge } from '@/components/ui';
import type { OceanHealthMetrics } from '@climaguard/shared/types/ocean';

export default function OceanHealthDashboard() {
  const [healthData, setHealthData] = useState<OceanHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<[number, number]>([-20.0, 57.5]);
  
  useEffect(() => {
    fetchOceanHealth();
    const interval = setInterval(fetchOceanHealth, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchOceanHealth() {
    try {
      setLoading(true);
      const response = await fetch(`/api/ocean-health?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        setHealthData(data.oceanHealth);
      }
    } catch (error) {
      console.error('Failed to fetch ocean health:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading ocean health data...</div>
      </div>
    );
  }
  
  if (!healthData) {
    return (
      <div className="text-center py-8 text-theme-secondary">
        No ocean health data available
      </div>
    );
  }
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'severe': return 'danger';
      default: return 'info';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme">🌊 Ocean Health Overview</h2>
          <StatusBadge status={healthData.overallHealthScore >= 70 ? 'success' : 'warning'}>
            {healthData.overallHealthScore >= 70 ? 'Healthy' : 'At Risk'}
          </StatusBadge>
        </div>
        
        {/* Overall Health Score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-theme">Overall Health Score</span>
            <span className={`text-4xl font-bold ${getHealthColor(healthData.overallHealthScore)}`}>
              {healthData.overallHealthScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                healthData.overallHealthScore >= 80 ? 'bg-green-500' :
                healthData.overallHealthScore >= 60 ? 'bg-yellow-500' :
                healthData.overallHealthScore >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${healthData.overallHealthScore}%` }}
            />
          </div>
        </div>
        
        {/* Water Quality Metrics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-theme mb-4">Water Quality</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon="🧪"
              title="pH Level"
              value={healthData.waterQuality.pH.toFixed(2)}
              subtitle={`Score: ${healthData.waterQuality.score}/100`}
            />
            <MetricCard
              icon="🌡️"
              title="Temperature"
              value={`${healthData.waterQuality.temperature.toFixed(1)}°C`}
              subtitle="Sea Surface"
            />
            <MetricCard
              icon="🧂"
              title="Salinity"
              value={`${healthData.waterQuality.salinity.toFixed(1)} ppt`}
              subtitle="Parts per thousand"
            />
            <MetricCard
              icon="💨"
              title="Dissolved O₂"
              value={`${healthData.waterQuality.dissolvedOxygen.toFixed(1)} mg/L`}
              subtitle="Oxygen levels"
            />
          </div>
        </div>
        
        {/* Pollution Index */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-theme mb-4">Pollution Index</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon="🗑️"
              title="Plastic Density"
              value={`${healthData.pollution.plasticDensity.toFixed(2)}`}
              subtitle="particles/km²"
            />
            <MetricCard
              icon="🛢️"
              title="Oil Spill Risk"
              value={`${healthData.pollution.oilSpillRisk}%`}
              subtitle="Risk level"
            />
            <MetricCard
              icon="⚠️"
              title="Overall Pollution"
              value={`${healthData.pollution.overallIndex}/100`}
              subtitle={healthData.pollution.overallIndex > 70 ? 'Good' : 'Needs Attention'}
              trend={{
                direction: healthData.pollution.overallIndex > 70 ? 'up' : 'down',
                value: `${healthData.pollution.overallIndex > 70 ? 'Good' : 'Poor'}`
              }}
            />
          </div>
        </div>
        
        {/* Coral Reef Health */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-theme mb-4">Coral Reef Health</h3>
          <div className="bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-theme">Bleaching Risk</span>
              <StatusBadge status={getRiskBadgeColor(healthData.reefHealth.bleachingRisk)}>
                {healthData.reefHealth.bleachingRisk.toUpperCase()}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-theme-secondary mb-1">Health Index</div>
                <div className="text-2xl font-bold text-theme">{healthData.reefHealth.healthIndex}/100</div>
              </div>
              <div>
                <div className="text-sm text-theme-secondary mb-1">Temperature</div>
                <div className="text-2xl font-bold text-theme">{healthData.reefHealth.temperature.toFixed(1)}°C</div>
              </div>
              <div>
                <div className="text-sm text-theme-secondary mb-1">pH</div>
                <div className="text-2xl font-bold text-theme">{healthData.reefHealth.pH.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-theme-secondary mb-1">Coral Coverage</div>
                <div className="text-2xl font-bold text-theme">{healthData.reefHealth.coverage.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Biodiversity */}
        <div>
          <h3 className="text-lg font-semibold text-theme mb-4">Marine Biodiversity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon="🐠"
              title="Species Count"
              value={healthData.biodiversity.speciesCount}
              subtitle="Total species"
            />
            <MetricCard
              icon="⚠️"
              title="Endangered Species"
              value={healthData.biodiversity.endangeredSpecies}
              subtitle="At risk"
            />
            <MetricCard
              icon="📊"
              title="Biodiversity Index"
              value={`${healthData.biodiversity.biodiversityIndex}/100`}
              subtitle="Overall diversity"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

