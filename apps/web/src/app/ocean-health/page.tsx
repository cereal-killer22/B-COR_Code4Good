'use client';

import { useState, useEffect } from 'react';
import OceanHealthMap from '@/components/OceanHealthMap';
import BleachingRiskPanel from '@/components/BleachingRiskPanel';
import AcidificationTracker from '@/components/AcidificationTracker';
import CoastalRiskWidget from '@/components/CoastalRiskWidget';
import { PageHeader, Card, MetricCard, StatusBadge } from '@/components/ui';
import type { OceanHealthMetrics } from '@climaguard/shared/types/ocean';

export default function OceanHealthPage() {
  const [healthData, setHealthData] = useState<OceanHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState<[number, number]>([-20.2, 57.5]);
  
  useEffect(() => {
    fetchOceanHealth();
    const interval = setInterval(fetchOceanHealth, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchOceanHealth() {
    try {
      setLoading(true);
      const response = await fetch(`/api/oceanhealth?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        if (data.metrics) {
          // Ensure all required fields have default values
          const metrics = data.metrics;
          setHealthData({
            location,
            timestamp: new Date(data.timestamp || Date.now()),
            waterQuality: {
              pH: metrics.waterQuality?.pH ?? 8.1,
              temperature: metrics.waterQuality?.temperature ?? 28.5,
              salinity: metrics.waterQuality?.salinity ?? 35.2,
              dissolvedOxygen: metrics.waterQuality?.dissolvedOxygen ?? 6.5,
              turbidity: metrics.waterQuality?.turbidity ?? 0.2,
              chlorophyll: metrics.waterQuality?.chlorophyll ?? 0.3,
              score: metrics.waterQuality?.score ?? 75,
            },
            pollution: {
              plasticDensity: metrics.pollution?.plasticDensity ?? 15,
              oilSpillRisk: metrics.pollution?.oilSpillRisk ?? 20,
              chemicalPollution: metrics.pollution?.chemicalPollution ?? 25,
              overallIndex: metrics.pollution?.overallIndex ?? 20,
            },
            biodiversity: {
              speciesCount: metrics.biodiversity?.speciesCount ?? 200,
              endangeredSpecies: metrics.biodiversity?.endangeredSpecies ?? 5,
              biodiversityIndex: metrics.biodiversity?.biodiversityIndex ?? 70,
            },
            reefHealth: {
              bleachingRisk: metrics.reefHealth?.bleachingRisk ?? 'low',
              healthIndex: metrics.reefHealth?.healthIndex ?? 75,
              temperature: metrics.reefHealth?.temperature ?? 28.5,
              pH: metrics.reefHealth?.pH ?? 8.1,
              coverage: metrics.reefHealth?.coverage ?? 40,
            },
            overallHealthScore: data.prediction?.score ?? 75,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch ocean health:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
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

  const getPHStatus = (ph: number) => {
    if (ph >= 8.0 && ph <= 8.2) return { status: 'Optimal', color: 'text-green-600' };
    if (ph >= 7.8 && ph < 8.0) return { status: 'Good', color: 'text-yellow-600' };
    if (ph >= 7.6 && ph < 7.8) return { status: 'Moderate', color: 'text-orange-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const getOxygenStatus = (do2: number) => {
    if (do2 >= 6.5) return { status: 'Excellent', color: 'text-green-600' };
    if (do2 >= 6.0) return { status: 'Good', color: 'text-yellow-600' };
    if (do2 >= 5.0) return { status: 'Moderate', color: 'text-orange-600' };
    return { status: 'Low', color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-theme">
      <PageHeader 
        title="🌊 Ocean Health Monitoring" 
        subtitle="Comprehensive marine ecosystem assessment using real-time satellite data, NOAA Coral Reef Watch, and oceanographic sensors"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Ocean Health Dashboard - Integrated */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-theme-secondary">Loading ocean health data...</div>
          </div>
        ) : healthData ? (
          <div className="space-y-6">
            {/* Overall Health Score Card */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-theme">🌊 Ocean Health Overview</h2>
                  <p className="text-sm text-theme-secondary mt-1">
                    Comprehensive assessment of marine ecosystem health
                  </p>
                </div>
                <StatusBadge status={healthData.overallHealthScore >= 70 ? 'success' : healthData.overallHealthScore >= 50 ? 'warning' : 'danger'}>
                  {healthData.overallHealthScore >= 80 ? 'Excellent' : 
                   healthData.overallHealthScore >= 60 ? 'Good' : 
                   healthData.overallHealthScore >= 40 ? 'Moderate' : 'Poor'}
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
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getHealthBgColor(healthData.overallHealthScore)}`}
                    style={{ width: `${healthData.overallHealthScore}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-theme-secondary">
                  Based on water quality, pollution levels, biodiversity, and coral reef health
                </div>
              </div>

              {/* Component Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-theme-secondary mb-1">Water Quality</div>
                  <div className={`text-2xl font-bold ${getHealthColor(healthData.waterQuality.score)}`}>
                    {healthData.waterQuality.score}/100
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm text-theme-secondary mb-1">Pollution Index</div>
                  <div className={`text-2xl font-bold ${healthData.pollution.overallIndex < 30 ? 'text-green-600' : healthData.pollution.overallIndex < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {healthData.pollution.overallIndex}/100
                  </div>
                  <div className="text-xs text-theme-secondary mt-1">Lower is better</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-theme-secondary mb-1">Biodiversity</div>
                  <div className={`text-2xl font-bold ${getHealthColor(healthData.biodiversity.biodiversityIndex)}`}>
                    {healthData.biodiversity.biodiversityIndex}/100
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-theme-secondary mb-1">Reef Health</div>
                  <div className={`text-2xl font-bold ${getHealthColor(healthData.reefHealth.healthIndex)}`}>
                    {healthData.reefHealth.healthIndex}/100
                  </div>
                </div>
              </div>
            </Card>

            {/* Water Quality Metrics */}
            <Card>
              <h3 className="text-xl font-semibold text-theme mb-6">💧 Water Quality Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard
                  icon="🧪"
                  title="pH Level"
                  value={(healthData.waterQuality?.pH ?? 8.1).toFixed(2)}
                  subtitle={getPHStatus(healthData.waterQuality?.pH ?? 8.1).status}
                />
                <MetricCard
                  icon="🌡️"
                  title="Temperature"
                  value={`${(healthData.waterQuality?.temperature ?? 28.5).toFixed(1)}°C`}
                  subtitle="Sea Surface"
                />
                <MetricCard
                  icon="🧂"
                  title="Salinity"
                  value={`${(healthData.waterQuality?.salinity ?? 35.2).toFixed(1)} ppt`}
                  subtitle="Parts per thousand"
                />
                <MetricCard
                  icon="💨"
                  title="Dissolved O₂"
                  value={`${(healthData.waterQuality?.dissolvedOxygen ?? 6.5).toFixed(1)} mg/L`}
                  subtitle={getOxygenStatus(healthData.waterQuality?.dissolvedOxygen ?? 6.5).status}
                />
                <MetricCard
                  icon="🌊"
                  title="Turbidity"
                  value={(healthData.waterQuality?.turbidity ?? 0.2).toFixed(2)}
                  subtitle="NTU (lower is better)"
                />
                <MetricCard
                  icon="🌿"
                  title="Chlorophyll"
                  value={`${(healthData.waterQuality?.chlorophyll ?? 0.3).toFixed(2)} mg/m³`}
                  subtitle="Primary productivity"
                />
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-theme">Water Quality Score</span>
                  <span className={`text-2xl font-bold ${getHealthColor(healthData.waterQuality.score)}`}>
                    {healthData.waterQuality.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getHealthBgColor(healthData.waterQuality.score)}`}
                    style={{ width: `${healthData.waterQuality.score}%` }}
                  />
                </div>
              </div>
            </Card>
            
            {/* Pollution Index */}
            <Card>
              <h3 className="text-xl font-semibold text-theme mb-6">⚠️ Pollution Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MetricCard
                  icon="🗑️"
                  title="Plastic Density"
                  value={`${healthData.pollution.plasticDensity.toFixed(1)}`}
                  subtitle="particles/km²"
                />
                <MetricCard
                  icon="🛢️"
                  title="Oil Spill Risk"
                  value={`${healthData.pollution.oilSpillRisk}%`}
                  subtitle="Risk level"
                />
                <MetricCard
                  icon="🧪"
                  title="Chemical Pollution"
                  value={`${healthData.pollution.chemicalPollution}%`}
                  subtitle="Contamination risk"
                />
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700" style={{
                background: healthData.pollution.overallIndex < 30 
                  ? 'linear-gradient(to right, #10b981, #059669)' 
                  : healthData.pollution.overallIndex < 50
                  ? 'linear-gradient(to right, #f59e0b, #d97706)'
                  : 'linear-gradient(to right, #ef4444, #dc2626)'
              }}>
                <div className="flex items-center justify-between text-white">
                  <span className="font-semibold">Overall Pollution Index</span>
                  <span className="text-2xl font-bold">
                    {healthData.pollution.overallIndex}/100
                  </span>
                </div>
                <div className="text-sm text-white/90 mt-1">
                  {healthData.pollution.overallIndex < 30 ? '✅ Low pollution - Excellent water quality' :
                   healthData.pollution.overallIndex < 50 ? '⚠️ Moderate pollution - Monitoring recommended' :
                   '🚨 High pollution - Action required'}
                </div>
              </div>
            </Card>
            
            {/* Coral Reef Health */}
            <Card>
              <h3 className="text-xl font-semibold text-theme mb-6">🪸 Coral Reef Health</h3>
              <div className="bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-theme">Bleaching Risk</span>
                  <StatusBadge status={getRiskBadgeColor(healthData.reefHealth.bleachingRisk)}>
                    {healthData.reefHealth.bleachingRisk.toUpperCase()}
                  </StatusBadge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-theme-secondary mb-1">Health Index</div>
                    <div className={`text-2xl font-bold ${getHealthColor(healthData.reefHealth.healthIndex)}`}>
                      {healthData.reefHealth.healthIndex}/100
                    </div>
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
                  <div>
                    <div className="text-sm text-theme-secondary mb-1">Status</div>
                    <div className={`text-lg font-bold ${getHealthColor(healthData.reefHealth.healthIndex)}`}>
                      {healthData.reefHealth.healthIndex >= 80 ? 'Healthy' :
                       healthData.reefHealth.healthIndex >= 60 ? 'Stable' :
                       healthData.reefHealth.healthIndex >= 40 ? 'Stressed' : 'Critical'}
                    </div>
                  </div>
                </div>
              </div>
              {healthData.reefHealth.bleachingRisk === 'severe' || healthData.reefHealth.bleachingRisk === 'high' ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-semibold text-red-600 dark:text-red-400 mb-1">
                        {healthData.reefHealth.bleachingRisk === 'severe' ? 'Severe Bleaching Risk' : 'High Bleaching Risk'}
                      </div>
                      <div className="text-sm text-theme-secondary">
                        Coral reefs are under significant stress. Immediate monitoring and protective measures recommended.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
            
            {/* Biodiversity */}
            <Card>
              <h3 className="text-xl font-semibold text-theme mb-6">🐠 Marine Biodiversity</h3>
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
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-theme-secondary mb-2">
                  Biodiversity assessment based on water clarity, primary productivity, and habitat health
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-theme">Biodiversity Status</span>
                  <span className={`text-lg font-bold ${getHealthColor(healthData.biodiversity.biodiversityIndex)}`}>
                    {healthData.biodiversity.biodiversityIndex >= 70 ? 'High Diversity' :
                     healthData.biodiversity.biodiversityIndex >= 50 ? 'Moderate Diversity' : 'Low Diversity'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-theme-secondary">
            No ocean health data available
          </div>
        )}
        
        {/* Ocean Health Map with Regional Data */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Map Section - Left side on desktop */}
          <div className="flex-1 bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Regional Ocean Health Map</h2>
              <p className="text-sm text-theme-secondary mt-1">
                Click on regions to view detailed health metrics. Color-coded by overall health score.
              </p>
            </div>
            <div className="relative h-[650px] min-h-[650px] md:h-[75vh] rounded-lg overflow-hidden">
              <OceanHealthMap lat={-20.2} lng={57.5} />
            </div>
          </div>
          
          {/* Info Card Section - Right side on desktop, below on mobile */}
          <div className="w-full md:w-80 lg:w-96 bg-card rounded-lg p-6 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[650px] md:max-h-[75vh]">
            <h2 className="text-xl font-semibold mb-4">🌊 Regional Health Data</h2>
            <div className="space-y-4 text-sm text-theme-secondary">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-theme mb-2">How to Use</div>
                <p className="text-xs">
                  Click on colored regions or markers on the map to view detailed ocean health metrics including:
                </p>
                <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                  <li>Water quality parameters</li>
                  <li>Pollution indices</li>
                  <li>Coral reef health</li>
                  <li>Biodiversity metrics</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="font-semibold text-theme mb-2">Health Score Legend</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>80-100: Excellent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span>60-79: Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span>40-59: Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>0-39: Poor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specialized Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BleachingRiskPanel />
          <CoastalRiskWidget />
        </div>
        
        <AcidificationTracker />
      </div>
    </div>
  );
}
