'use client';

import { useState, useEffect } from 'react';
import { Card, StatusBadge, MetricCard } from '@/components/ui';
import type { CoralReefData } from '@climaguard/shared/types/ocean';
import type { CoralBleachingPrediction } from '@/lib/models/coralBleachingPredictor';

interface ReefHealthCardProps {
  location?: [number, number];
  reefId?: string;
}

export default function ReefHealthCard({ location = [-20.0, 57.5], reefId }: ReefHealthCardProps) {
  const [reefData, setReefData] = useState<CoralReefData | null>(null);
  const [prediction, setPrediction] = useState<CoralBleachingPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchReefHealth();
    const interval = setInterval(fetchReefHealth, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchReefHealth() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reef-health?lat=${location[0]}&lng=${location[1]}&predictions=true`
      );
      if (response.ok) {
        const data = await response.json();
        setReefData(data.reef);
        setPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to fetch reef health:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <div className="text-theme-secondary">Loading reef health data...</div>
        </div>
      </Card>
    );
  }
  
  if (!reefData) {
    return (
      <Card>
        <div className="text-center py-8 text-theme-secondary">
          No reef health data available
        </div>
      </Card>
    );
  }
  
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
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme">🪸 Coral Reef Health</h2>
        <StatusBadge status={getRiskBadgeColor(reefData.bleachingRisk)}>
          {reefData.bleachingRisk.toUpperCase()} RISK
        </StatusBadge>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon="🌡️"
          title="Temperature"
          value={`${reefData.temperature.toFixed(1)}°C`}
          subtitle={reefData.anomaly > 0 ? `+${reefData.anomaly.toFixed(1)}°C` : `${reefData.anomaly.toFixed(1)}°C`}
        />
        <MetricCard
          icon="📊"
          title="Health Index"
          value={`${reefData.healthIndex}/100`}
          subtitle="Overall health"
        />
        <MetricCard
          icon="🧪"
          title="pH Level"
          value={reefData.pH.toFixed(2)}
          subtitle="Acidity"
        />
        <MetricCard
          icon="🌿"
          title="Coral Coverage"
          value={`${reefData.coverage.toFixed(0)}%`}
          subtitle="Reef coverage"
        />
      </div>
      
      {/* Bleaching Prediction */}
      {prediction && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-theme mb-3">Bleaching Prediction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-theme-secondary mb-1">Risk Probability</div>
              <div className="text-2xl font-bold text-theme">
                {(prediction.probability * 100).toFixed(0)}%
              </div>
            </div>
            {prediction.daysToBleaching && (
              <div>
                <div className="text-sm text-theme-secondary mb-1">Days to Bleaching</div>
                <div className="text-2xl font-bold text-theme">
                  {prediction.daysToBleaching} days
                </div>
              </div>
            )}
          </div>
          
          {prediction.recommendations.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-theme mb-2">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-theme-secondary">
                {prediction.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Biodiversity */}
      <div>
        <h3 className="font-semibold text-theme mb-3">Biodiversity</h3>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-theme-secondary mb-1">Biodiversity Index</div>
            <div className="text-2xl font-bold text-theme">{reefData.biodiversity}/100</div>
          </div>
          <div>
            <div className="text-sm text-theme-secondary mb-1">Last Assessment</div>
            <div className="text-lg font-semibold text-theme">
              {new Date(reefData.lastAssessment).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

