/**
 * SDG 14 Dashboard Component
 * Comprehensive dashboard showing all SDG 14 (Life Below Water) targets and progress
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, MetricCard, StatusBadge } from '@/components/ui';
import type { SDG14Metrics } from '@/lib/services/oceanHealthSDG';

interface SDG14DashboardProps {
  lat?: number;
  lng?: number;
  region?: string;
}

export default function SDG14Dashboard({ 
  lat = -20.2, 
  lng = 57.5, 
  region = 'Mauritius' 
}: SDG14DashboardProps) {
  const [metrics, setMetrics] = useState<SDG14Metrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSDG14Metrics();
    const interval = setInterval(fetchSDG14Metrics, 600000); // 10 min
    return () => clearInterval(interval);
  }, [lat, lng, region]);

  async function fetchSDG14Metrics() {
    try {
      setLoading(true);
      const response = await fetch(`/api/ocean-health/sdg14?lat=${lat}&lng=${lng}&region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch SDG 14 metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading SDG 14 metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-theme-secondary">
        No SDG 14 metrics available
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    if (progress >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall SDG 14 Progress */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme">🎯 SDG 14: Life Below Water</h2>
          <StatusBadge status={metrics.overallProgress.score >= 70 ? 'success' : 'warning'}>
            {metrics.overallProgress.score >= 70 ? 'On Track' : 'Needs Attention'}
          </StatusBadge>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-theme">Overall Progress Score</span>
            <span className={`text-4xl font-bold ${getProgressColor(metrics.overallProgress.score)}`}>
              {metrics.overallProgress.score}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressBgColor(metrics.overallProgress.score)}`}
              style={{ width: `${metrics.overallProgress.score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon="✅"
            title="Targets On Track"
            value={metrics.overallProgress.targetsOnTrack}
            subtitle="Meeting goals"
          />
          <MetricCard
            icon="⚠️"
            title="Needs Attention"
            value={metrics.overallProgress.targetsNeedingAttention}
            subtitle="Requiring action"
          />
          <MetricCard
            icon="📊"
            title="Total Targets"
            value="10"
            subtitle="SDG 14 targets"
          />
        </div>

        {metrics.overallProgress.priorityActions.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Priority Actions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
              {metrics.overallProgress.priorityActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Target 14.1: Reduce Marine Pollution */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.1: Reduce Marine Pollution</h3>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-theme-secondary">Progress toward 50% reduction</span>
            <span className={`font-bold ${getProgressColor(metrics.pollutionReduction.progress)}`}>
              {metrics.pollutionReduction.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-full rounded-full ${getProgressBgColor(metrics.pollutionReduction.progress)}`}
              style={{ width: `${metrics.pollutionReduction.progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🗑️"
            title="Plastic Density"
            value={`${metrics.pollutionReduction.plasticDensity.toFixed(2)}`}
            subtitle="particles/km²"
          />
          <MetricCard
            icon="🛢️"
            title="Oil Spill Events"
            value={metrics.pollutionReduction.oilSpillEvents}
            subtitle="detected"
          />
          <MetricCard
            icon="🧪"
            title="Chemical Pollution"
            value={`${metrics.pollutionReduction.chemicalPollution}/100`}
            subtitle="index"
          />
          <MetricCard
            icon="💧"
            title="Sewage Discharge"
            value={`${metrics.pollutionReduction.sewageDischarge}/100`}
            subtitle="index"
          />
        </div>
      </Card>

      {/* Target 14.2: Protect Ecosystems */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.2: Protect and Restore Ecosystems</h3>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-theme-secondary">Ecosystem restoration progress</span>
            <span className={`font-bold ${getProgressColor(metrics.ecosystemHealth.restorationProgress)}`}>
              {metrics.ecosystemHealth.restorationProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-full rounded-full ${getProgressBgColor(metrics.ecosystemHealth.restorationProgress)}`}
              style={{ width: `${metrics.ecosystemHealth.restorationProgress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🛡️"
            title="Protected Areas"
            value={`${metrics.ecosystemHealth.protectedAreaCoverage}%`}
            subtitle="of EEZ"
          />
          <MetricCard
            icon="🪸"
            title="Reef Health"
            value={`${metrics.ecosystemHealth.reefHealthIndex}/100`}
            subtitle="index"
          />
          <MetricCard
            icon="🌳"
            title="Mangrove Coverage"
            value={`${metrics.ecosystemHealth.mangroveCoverage} km²`}
            subtitle="area"
          />
          <MetricCard
            icon="🌿"
            title="Seagrass Coverage"
            value={`${metrics.ecosystemHealth.seagrassCoverage} km²`}
            subtitle="area"
          />
        </div>
      </Card>

      {/* Target 14.3: Ocean Acidification */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.3: Reduce Ocean Acidification</h3>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-theme-secondary">Acidification mitigation progress</span>
            <span className={`font-bold ${getProgressColor(metrics.acidificationStatus.mitigationProgress)}`}>
              {metrics.acidificationStatus.mitigationProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-full rounded-full ${getProgressBgColor(metrics.acidificationStatus.mitigationProgress)}`}
              style={{ width: `${metrics.acidificationStatus.mitigationProgress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🧪"
            title="pH Level"
            value={metrics.acidificationStatus.pH.toFixed(2)}
            subtitle="current"
          />
          <MetricCard
            icon="💎"
            title="Aragonite Saturation"
            value={metrics.acidificationStatus.aragoniteSaturation.toFixed(1)}
            subtitle="Ω"
          />
          <MetricCard
            icon="📉"
            title="Acidification Rate"
            value={`${metrics.acidificationStatus.acidificationRate.toFixed(2)}`}
            subtitle="pH/decade"
          />
          <MetricCard
            icon="⚠️"
            title="Vulnerable Species"
            value={metrics.acidificationStatus.vulnerableSpecies}
            subtitle="at risk"
          />
        </div>
      </Card>

      {/* Target 14.4: Sustainable Fishing */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.4: Regulate Fishing & End Overfishing</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            icon="📊"
            title="Overfishing Rate"
            value={`${metrics.fishingSustainability.overfishingRate.toFixed(1)}%`}
            subtitle="of stocks"
          />
          <MetricCard
            icon="✅"
            title="Sustainable Catch"
            value={`${metrics.fishingSustainability.sustainableCatch.toFixed(0)}t`}
            subtitle="tons"
          />
          <MetricCard
            icon="🎣"
            title="Total Catch"
            value={`${metrics.fishingSustainability.totalCatch.toFixed(0)}t`}
            subtitle="tons"
          />
          <MetricCard
            icon="📋"
            title="Compliance Rate"
            value={`${metrics.fishingSustainability.complianceRate}%`}
            subtitle="with regulations"
          />
          <div className="flex items-center justify-center">
            <StatusBadge
              status={
                metrics.fishingSustainability.stockStatus === 'healthy' ? 'success' :
                metrics.fishingSustainability.stockStatus === 'moderate' ? 'info' :
                metrics.fishingSustainability.stockStatus === 'depleted' ? 'warning' : 'danger'
              }
            >
              {metrics.fishingSustainability.stockStatus.toUpperCase()}
            </StatusBadge>
          </div>
        </div>
      </Card>

      {/* Target 14.5: Marine Protected Areas */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.5: Conserve Marine Areas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🛡️"
            title="Total Protected Area"
            value={`${metrics.protectedAreas.totalArea} km²`}
            subtitle="area"
          />
          <MetricCard
            icon="📊"
            title="Coverage"
            value={`${metrics.protectedAreas.percentageCoverage}%`}
            subtitle="of EEZ"
          />
          <MetricCard
            icon="✅"
            title="Effectively Managed"
            value={`${metrics.protectedAreas.effectivelyManaged}%`}
            subtitle="management"
          />
          <MetricCard
            icon="🆕"
            title="New Areas (2024)"
            value={metrics.protectedAreas.newAreasEstablished}
            subtitle="established"
          />
        </div>
      </Card>

      {/* Target 14.7: Economic Benefits */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.7: Economic Benefits from Sustainable Use</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🏖️"
            title="Sustainable Tourism"
            value={`$${(metrics.economicBenefits.sustainableTourism / 1000000).toFixed(0)}M`}
            subtitle="annual value"
          />
          <MetricCard
            icon="🎣"
            title="Sustainable Fishing"
            value={`$${(metrics.economicBenefits.sustainableFishing / 1000000).toFixed(0)}M`}
            subtitle="annual value"
          />
          <MetricCard
            icon="🌊"
            title="Blue Economy"
            value={`$${(metrics.economicBenefits.blueEconomy / 1000000).toFixed(0)}M`}
            subtitle="total value"
          />
          <MetricCard
            icon="👥"
            title="Employment"
            value={metrics.economicBenefits.employment.toLocaleString()}
            subtitle="jobs"
          />
        </div>
      </Card>

      {/* Target 14.a: Scientific Knowledge */}
      <Card>
        <h3 className="text-xl font-semibold text-theme mb-4">Target 14.a: Increase Scientific Knowledge</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="📡"
            title="Monitoring Stations"
            value={metrics.researchCapacity.monitoringStations}
            subtitle="active"
          />
          <MetricCard
            icon="📊"
            title="Data Quality"
            value={`${metrics.researchCapacity.dataQuality}%`}
            subtitle="score"
          />
          <MetricCard
            icon="📚"
            title="Research Output"
            value={metrics.researchCapacity.researchOutput}
            subtitle="publications/year"
          />
          <MetricCard
            icon="🔬"
            title="Tech Adoption"
            value={`${metrics.researchCapacity.technologyAdoption}%`}
            subtitle="advanced tech"
          />
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <h3 className="text-xl font-semibold text-theme mb-4">💡 Action Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-theme">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

