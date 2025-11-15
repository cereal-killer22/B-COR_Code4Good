'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface CoastalRiskWidgetProps {
  location?: [number, number];
}

interface CoastalRiskData {
  location: [number, number];
  timestamp: Date;
  waveHeight: number;
  windSpeed: number;
  swellHeight: number;
  erosionRisk: 'low' | 'moderate' | 'high';
  floodingRisk: 'low' | 'moderate' | 'high';
  turbidity: number;
  waterClarity: number;
}

export default function CoastalRiskWidget({ 
  location = [-20.0, 57.5]
}: CoastalRiskWidgetProps) {
  const [riskData, setRiskData] = useState<CoastalRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCoastalRisk();
    const interval = setInterval(fetchCoastalRisk, 300000); // 5 min
    return () => clearInterval(interval);
  }, [location]);
  
  async function fetchCoastalRisk() {
    try {
      setLoading(true);
      // Fetch from ocean-health API which aggregates all data sources
      const response = await fetch(`/api/ocean-health?lat=${location[0]}&lng=${location[1]}`);
      if (response.ok) {
        const data = await response.json();
        const oceanHealth = data.oceanHealth;
        
        // Also fetch marine data for wave/wind info
        const marineResponse = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${location[0]}&longitude=${location[1]}&daily=wave_height_max,wind_speed_max,swell_significant_height&timezone=auto`);
        let marineData = null;
        if (marineResponse.ok) {
          marineData = await marineResponse.json();
        }
        
        // Calculate risks
        const waveHeight = marineData?.daily?.wave_height_max?.[0] || 1.0;
        const windSpeed = marineData?.daily?.wind_speed_max?.[0] || 5.0;
        const swellHeight = marineData?.daily?.swell_significant_height?.[0] || 0.5;
        
        const erosionRisk = waveHeight > 3 || windSpeed > 15 ? 'high' :
                           waveHeight > 2 || windSpeed > 10 ? 'moderate' : 'low';
        
        const floodingRisk = waveHeight > 2.5 && windSpeed > 12 ? 'high' :
                            waveHeight > 1.5 && windSpeed > 8 ? 'moderate' : 'low';
        
        setRiskData({
          location,
          timestamp: new Date(),
          waveHeight,
          windSpeed,
          swellHeight,
          erosionRisk,
          floodingRisk,
          turbidity: oceanHealth.waterQuality.turbidity,
          waterClarity: 100 - (oceanHealth.waterQuality.turbidity * 100)
        });
      }
    } catch (error) {
      console.error('Failed to fetch coastal risk:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <div className="text-theme-secondary">Loading coastal risk data...</div>
        </div>
      </Card>
    );
  }
  
  if (!riskData) {
    return (
      <Card>
        <div className="text-center py-8 text-theme-secondary">
          No coastal risk data available
        </div>
      </Card>
    );
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };
  
  return (
    <Card>
      <h3 className="text-xl font-bold text-theme mb-6">🌊 Coastal Risk Assessment</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
          <div className="text-sm text-theme-secondary mb-1">Wave Height</div>
          <div className="text-2xl font-bold text-theme">{riskData.waveHeight.toFixed(1)} m</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-lg">
          <div className="text-sm text-theme-secondary mb-1">Wind Speed</div>
          <div className="text-2xl font-bold text-theme">{riskData.windSpeed.toFixed(1)} m/s</div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-lg">
          <div className="text-sm text-theme-secondary mb-1">Swell Height</div>
          <div className="text-2xl font-bold text-theme">{riskData.swellHeight.toFixed(1)} m</div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-lg">
          <div className="text-sm text-theme-secondary mb-1">Water Clarity</div>
          <div className="text-2xl font-bold text-theme">{riskData.waterClarity.toFixed(0)}%</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="font-semibold text-theme">Erosion Risk</span>
          <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getRiskColor(riskData.erosionRisk)}`}>
            {riskData.erosionRisk.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="font-semibold text-theme">Flooding Risk</span>
          <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getRiskColor(riskData.floodingRisk)}`}>
            {riskData.floodingRisk.toUpperCase()}
          </span>
        </div>
      </div>
      
      {riskData.erosionRisk === 'high' || riskData.floodingRisk === 'high' && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="font-bold text-red-600 dark:text-red-400 mb-2">⚠️ High Risk Alert</div>
          <div className="text-sm text-theme-secondary">
            Elevated wave heights and wind speeds detected. Monitor coastal areas closely and prepare for potential impacts.
          </div>
        </div>
      )}
    </Card>
  );
}

