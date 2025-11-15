'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import type { BleachingRisk } from '@climaguard/shared/types/ocean';

interface BleachingRiskPanelProps {
  location?: [number, number];
  onLocationChange?: (location: [number, number]) => void;
}

export default function BleachingRiskPanel({ 
  location = [-20.0, 57.5],
  onLocationChange 
}: BleachingRiskPanelProps) {
  const [riskData, setRiskData] = useState<BleachingRisk | null>(null);
  const [sstTrend, setSstTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBleachingRisk();
    const interval = setInterval(fetchBleachingRisk, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchBleachingRisk() {
    try {
      setLoading(true);
      const response = await fetch(`/api/bleaching?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        setRiskData(data.bleachingRisk);
        setSstTrend(data.sstTrend);
      }
    } catch (error) {
      console.error('Failed to fetch bleaching risk:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <div className="text-theme-secondary">Loading bleaching risk data...</div>
        </div>
      </Card>
    );
  }
  
  if (!riskData) {
    return (
      <Card>
        <div className="text-center py-8 text-theme-secondary">
          No bleaching risk data available
        </div>
      </Card>
    );
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'severe': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };
  
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'severe': return '🚨 SEVERE';
      case 'high': return '⚠️ HIGH';
      case 'moderate': return '⚡ MODERATE';
      case 'low': return '✅ LOW';
      default: return '❓ UNKNOWN';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme">🪸 Coral Bleaching Risk</h2>
          <div className={`px-4 py-2 rounded-lg font-bold ${getRiskColor(riskData.riskLevel)}`}>
            {getRiskBadge(riskData.riskLevel)}
          </div>
        </div>
        
        {/* Risk Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
              <div className="text-sm text-theme-secondary mb-1">Sea Surface Temp</div>
              <div className="text-2xl font-bold text-theme">{riskData.sst.toFixed(1)}°C</div>
              <div className="text-xs text-theme-secondary mt-1">
                Anomaly: {riskData.sstAnomaly > 0 ? '+' : ''}{riskData.sstAnomaly.toFixed(1)}°C
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
              <div className="text-sm text-theme-secondary mb-1">HotSpot</div>
              <div className="text-2xl font-bold text-theme">{riskData.hotspot.toFixed(1)}</div>
              <div className="text-xs text-theme-secondary mt-1">
                {riskData.hotspot > 1 ? 'Elevated stress' : 'Normal'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
              <div className="text-sm text-theme-secondary mb-1">Degree Heating Weeks</div>
              <div className="text-2xl font-bold text-theme">{riskData.degreeHeatingWeeks.toFixed(1)}</div>
              <div className="text-xs text-theme-secondary mt-1">
                {riskData.degreeHeatingWeeks >= 12 ? 'Severe' :
                 riskData.degreeHeatingWeeks >= 8 ? 'High' :
                 riskData.degreeHeatingWeeks >= 4 ? 'Moderate' : 'Low'} risk
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
              <div className="text-sm text-theme-secondary mb-1">Bleaching Probability</div>
              <div className="text-2xl font-bold text-theme">{(riskData.probability * 100).toFixed(0)}%</div>
              <div className="text-xs text-theme-secondary mt-1">
                Confidence: {(riskData.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* NOAA Alert Level */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-theme">NOAA Alert Level</span>
              <span className="text-lg font-bold text-theme">{riskData.alertLevel}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  riskData.alertLevel >= 4 ? 'bg-red-500' :
                  riskData.alertLevel >= 3 ? 'bg-orange-500' :
                  riskData.alertLevel >= 2 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${(riskData.alertLevel / 5) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Days to Bleaching */}
          {riskData.daysToBleaching && riskData.daysToBleaching > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="font-bold text-red-600 dark:text-red-400">
                    Estimated {riskData.daysToBleaching} day{riskData.daysToBleaching !== 1 ? 's' : ''} until potential bleaching
                  </div>
                  <div className="text-sm text-theme-secondary">
                    Based on current DHW and temperature trends
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* SST Trend Chart */}
        {sstTrend && sstTrend.trend7d && sstTrend.trend7d.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-theme mb-4">7-Day SST Trend</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-end justify-between h-32 gap-1">
                {sstTrend.trend7d.map((sst: number, index: number) => {
                  const maxSST = Math.max(...sstTrend.trend7d);
                  const minSST = Math.min(...sstTrend.trend7d);
                  const height = ((sst - minSST) / (maxSST - minSST || 1)) * 100;
                  const isHigh = sst > (sstTrend.baseline || 28.5) + 1;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all ${
                          isHigh ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${Math.max(10, height)}%` }}
                        title={`Day ${index + 1}: ${sst.toFixed(1)}°C`}
                      />
                      <div className="text-xs text-theme-secondary mt-1">
                        {sst.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-theme-secondary text-center">
                Baseline: {sstTrend.baseline?.toFixed(1) || '28.5'}°C
              </div>
            </div>
          </div>
        )}
        
        {/* Recommended Actions */}
        <div>
          <h3 className="text-lg font-semibold text-theme mb-4">Recommended Actions</h3>
          <div className="space-y-2">
            {riskData.recommendedActions.map((action, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-lg mt-0.5">•</span>
                <span className="text-sm text-theme flex-1">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

