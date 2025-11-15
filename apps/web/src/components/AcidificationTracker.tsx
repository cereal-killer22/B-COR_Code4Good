'use client';

import { useState, useEffect } from 'react';
import { Card, MetricCard, StatusBadge } from '@/components/ui';
import type { AcidificationMetrics } from '@climaguard/shared/types/ocean';

export default function AcidificationTracker() {
  const [acidification, setAcidification] = useState<AcidificationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState<[number, number]>([-20.0, 57.5]);
  
  useEffect(() => {
    fetchAcidification();
    const interval = setInterval(fetchAcidification, 3600000); // 1 hour (acidification changes slowly)
    return () => clearInterval(interval);
  }, []);
  
  async function fetchAcidification() {
    try {
      setLoading(true);
      // Fetch from API route which uses real data sources
      const response = await fetch(`/api/ocean-health?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        const oceanHealth = data.oceanHealth;
        
        // Calculate acidification metrics from real pH data
        // Note: pH from free APIs is limited, using default with trend estimation
        const basePH = 8.1; // Pre-industrial baseline
        const currentPH = oceanHealth.waterQuality.pH || 8.1;
        const pHAnomaly = currentPH - basePH;
        
        // Estimate aragonite saturation from pH (simplified relationship)
        // Ωarag ≈ 3.5 * (pH - 7.0) for tropical waters
        const aragoniteSaturation = Math.max(0, 3.5 * (currentPH - 7.0));
        
        // CO2 concentration (global average, would need local measurements)
        const co2Concentration = 420; // Current global average
        
        // Determine trend from pH anomaly
        const trend = pHAnomaly < -0.1 ? 'declining' : 
                     pHAnomaly > 0.1 ? 'improving' : 'stable';
        
        // Project future pH (simplified linear model based on current trend)
        const declineRate = pHAnomaly < 0 ? pHAnomaly / 10 : 0; // Estimate from current anomaly
        const projectedpH = {
          year2025: currentPH + declineRate * 2,
          year2030: currentPH + declineRate * 5,
          year2050: currentPH + declineRate * 25
        };
        
        // Determine impact level
        let impactLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (currentPH < 7.6) impactLevel = 'critical';
        else if (currentPH < 7.8) impactLevel = 'high';
        else if (currentPH < 8.0) impactLevel = 'medium';
        
        const metrics: AcidificationMetrics = {
          location,
          timestamp: new Date(),
          pH: currentPH,
          pHAnomaly,
          aragoniteSaturation,
          co2Concentration,
          trend,
          projectedpH,
          impactLevel
        };
        
        setAcidification(metrics);
      }
    } catch (error) {
      console.error('Failed to fetch acidification data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <div className="text-theme-secondary">Loading acidification data...</div>
        </div>
      </Card>
    );
  }
  
  if (!acidification) {
    return (
      <Card>
        <div className="text-center py-8 text-theme-secondary">
          No acidification data available
        </div>
      </Card>
    );
  }
  
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'critical': return 'danger';
      default: return 'info';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '➡️';
    }
  };
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme">🧪 Ocean Acidification</h2>
        <StatusBadge status={getImpactBadge(acidification.impactLevel)}>
          {acidification.impactLevel.toUpperCase()} IMPACT
        </StatusBadge>
      </div>
      
      {/* Current Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon="🧪"
          title="pH Level"
          value={acidification.pH.toFixed(2)}
          subtitle={acidification.pHAnomaly > 0 ? `+${acidification.pHAnomaly.toFixed(2)}` : `${acidification.pHAnomaly.toFixed(2)}`}
        />
        <MetricCard
          icon="💎"
          title="Aragonite Saturation"
          value={acidification.aragoniteSaturation.toFixed(2)}
          subtitle="Ωarag"
        />
        <MetricCard
          icon="🌫️"
          title="CO₂ Concentration"
          value={`${acidification.co2Concentration.toFixed(0)} ppm`}
          subtitle="Carbon dioxide"
        />
        <MetricCard
          icon="📈"
          title="Trend"
          value={getTrendIcon(acidification.trend)}
          subtitle={acidification.trend}
        />
      </div>
      
      {/* Projections */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-theme mb-3">pH Projections</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-theme-secondary mb-1">2025</div>
            <div className="text-xl font-bold text-theme">
              {acidification.projectedpH.year2025.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-theme-secondary mb-1">2030</div>
            <div className="text-xl font-bold text-theme">
              {acidification.projectedpH.year2030.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-theme-secondary mb-1">2050</div>
            <div className="text-xl font-bold text-theme">
              {acidification.projectedpH.year2050.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Impact Assessment */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-theme mb-2">Impact Assessment</h3>
        <p className="text-sm text-theme-secondary mb-3">
          Current pH level: <span className="font-semibold">{acidification.pH.toFixed(2)}</span>
          {acidification.pHAnomaly < 0 && (
            <span className="text-red-600 ml-2">
              ({Math.abs(acidification.pHAnomaly).toFixed(2)} below baseline)
            </span>
          )}
        </p>
        {acidification.impactLevel === 'critical' && (
          <div className="p-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ Critical: pH levels below 7.6 indicate severe acidification stress on marine ecosystems.
              Immediate action required to reduce CO₂ emissions.
            </p>
          </div>
        )}
        {acidification.impactLevel === 'high' && (
          <div className="p-3 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ High: pH levels indicate significant acidification. Monitoring and mitigation measures recommended.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

