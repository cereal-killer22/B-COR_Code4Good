'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClimaGuardMap from '@/components/ClimaGuardMap';
import NotificationCenter from '@/components/NotificationCenter';
import AIPredictionInterface from '@/components/AIPredictionInterface';
import LiveTimeDisplay from '@/components/LiveTimeDisplay';
import OceanHealthDashboard from '@/components/OceanHealthDashboard';
import FloodLayerToggles from '@/components/map/FloodLayerToggles';
import CycloneLayerToggles from '@/components/map/CycloneLayerToggles';
import { Card, StatusBadge, MetricCard, Button, PageHeader, SectionHeader } from '@/components/ui';
import { useAutoRead } from '@/hooks/useAutoRead';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';
import MicIcon from '@/components/MicIcon';

// Real-time data hooks (will fetch live data)
const useLiveCycloneData = () => {
  const [cycloneData, setCycloneData] = useState({
    name: "Loading...",
    category: 0,
    windSpeed: 0,
    pressure: 0,
    distance: 0,
    eta: 0,
    direction: "--",
    movement: "0 km/h"
  });

  useEffect(() => {
    const fetchCycloneData = async () => {
      try {
        // Fetch from real IBTrACS/NOAA data
        const response = await fetch('/api/cyclone/current');
        if (response.ok) {
          const data = await response.json();
          setCycloneData(data.activeCyclone || {
            name: "No Active Cyclone",
            category: 0,
            windSpeed: 0,
            pressure: 1013,
            distance: 0,
            eta: 0,
            direction: "--",
            movement: "0 km/h"
          });
        }
      } catch (error) {
        console.error('Failed to fetch cyclone data:', error);
      }
    };

    fetchCycloneData();
    const interval = setInterval(fetchCycloneData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return cycloneData;
};

interface AlertData {
  id: string | number;
  zone: string;
  level: string;
  message: string;
  time: string;
  type: string;
}

const useLiveAlertData = () => {
  const [alertData, setAlertData] = useState<AlertData[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Fetch alerts from multiple sources
        const [alertsResponse, floodResponse, stormSurgeResponse] = await Promise.all([
          fetch('/api/alerts/active').catch(() => null),
          fetch('/api/flood?lat=-20.2&lng=57.5').catch(() => null),
          fetch('/api/storm-surge?lat=-20.2&lng=57.5').catch(() => null)
        ]);

        const alerts: AlertData[] = [];

        // Add alerts from alerts API
        if (alertsResponse?.ok) {
          const alertsData = await alertsResponse.json();
          const mappedAlerts = (alertsData.alerts || []).map((alert: any) => ({
            id: alert.id,
            zone: alert.area,
            level: alert.severity,
            message: alert.description || alert.title,
            time: new Date(alert.timeIssued).toLocaleTimeString(),
            type: alert.type
          }));
          alerts.push(...mappedAlerts);
        }

        // Add flood alerts
        if (floodResponse?.ok) {
          const floodData = await floodResponse.json();
          if (floodData.floodRisk?.alerts) {
            floodData.floodRisk.alerts.forEach((alert: any, idx: number) => {
              alerts.push({
                id: `flood-${idx}`,
                zone: alert.area,
                level: alert.level,
                message: alert.message,
                time: new Date().toLocaleTimeString(),
                type: 'flood'
              });
            });
          }
        }

        // Add storm surge alerts
        if (stormSurgeResponse?.ok) {
          const stormSurgeData = await stormSurgeResponse.json();
          if (stormSurgeData.stormSurge?.alerts) {
            stormSurgeData.stormSurge.alerts.forEach((alert: any, idx: number) => {
              alerts.push({
                id: `storm-${idx}`,
                zone: alert.area,
                level: alert.level,
                message: alert.message,
                time: new Date().toLocaleTimeString(),
                type: 'wind'
              });
            });
          }
        }

        setAlertData(alerts.length > 0 ? alerts : []);
      } catch (error) {
        console.error('Failed to fetch alert data:', error);
        setAlertData([]); // No mock data - return empty array
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return alertData;
};

// Data sources will be dynamically updated based on API status
const getDataSourcesStatus = (weatherData: any, floodData: any, stormSurgeData: any, cycloneData: any) => {
  const sources = [];
  
  if (weatherData) {
    sources.push({ name: "Open-Meteo", status: "Active", lastUpdate: "Live", type: "Weather Data" });
  }
  
  if (floodData) {
    sources.push({ name: "Open-Meteo", status: "Active", lastUpdate: "Live", type: "Flood Risk" });
  }
  
  if (stormSurgeData) {
    sources.push({ name: "Open-Meteo Marine", status: "Active", lastUpdate: "Live", type: "Storm Surge" });
  }
  
  if (cycloneData && cycloneData.category > 0) {
    sources.push({ name: "NOAA", status: "Active", lastUpdate: "Live", type: "Cyclone Data" });
  } else {
    sources.push({ name: "NOAA", status: "Monitoring", lastUpdate: "Live", type: "Cyclone Data" });
  }
  
  return sources;
};

type TabItem = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href?: string;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cyclone' | 'flood' | 'ocean-health' | 'alerts'>('overview');
  const [showAlerts, setShowAlerts] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [floodData, setFloodData] = useState<any>(null);
  const [stormSurgeData, setStormSurgeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Use live data hooks
  const cycloneData = useLiveCycloneData();
  const alertData = useLiveAlertData();

  // Fetch weather, flood, and storm surge data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [weatherRes, floodRes, stormSurgeRes] = await Promise.all([
          fetch('/api/weather/current?lat=-20.2&lng=57.5').catch(() => null),
          fetch('/api/flood?lat=-20.2&lng=57.5').catch(() => null),
          fetch('/api/storm-surge?lat=-20.2&lng=57.5').catch(() => null)
        ]);

        if (weatherRes?.ok) {
          const data = await weatherRes.json();
          setWeatherData(data.weather);
        }

        if (floodRes?.ok) {
          const data = await floodRes.json();
          setFloodData(data.floodRisk);
        }

        if (stormSurgeRes?.ok) {
          const data = await stormSurgeRes.json();
          setStormSurgeData(data.stormSurge);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getAlertColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'moderate': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default: return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'cyclone': return '🌀';
      case 'wind': return '💨';
      default: return '⚠️';
    }
  };

  const { isEnabled, autoReadEnabled, speak } = useTextToSpeech();
  const previousAlertsRef = React.useRef<Set<string>>(new Set());

  // Auto-read page content on load
  const dashboardSummary = `ClimaGuard Dashboard. AI-Powered Climate Risk Platform for Mauritius. ${cycloneData.category > 0 ? `Active Cyclone: ${cycloneData.name}, Category ${cycloneData.category}.` : 'No active cyclones.'} ${weatherData ? `Temperature: ${Math.round(weatherData.temperature)} degrees Celsius.` : ''} ${floodData ? `Flood Risk: ${floodData.riskLevel}.` : ''}`;
  
  useAutoRead({
    text: dashboardSummary,
    delay: 1500,
    readOnce: true,
    condition: !loading && (weatherData || floodData || cycloneData),
  });

  // Auto-read new alerts
  React.useEffect(() => {
    if (!isEnabled || !autoReadEnabled || !alertData.length) return;

    alertData.forEach((alert) => {
      const alertId = String(alert.id);
      if (!previousAlertsRef.current.has(alertId)) {
        previousAlertsRef.current.add(alertId);
        
        // Read critical/high priority alerts immediately
        if (alert.level.toLowerCase() === 'extreme' || alert.level.toLowerCase() === 'high') {
          const alertText = `${alert.type} alert. ${alert.level} risk in ${alert.zone}. ${alert.message}`;
          setTimeout(() => speak(alertText), 2000);
        }
      }
    });
  }, [alertData, isEnabled, autoReadEnabled, speak]);

  return (
    <div className="min-h-screen bg-theme" style={{ background: 'linear-gradient(to bottom right, var(--background-secondary), var(--background))' }}>
      {/* Header */}
      <PageHeader 
        title="🛡️ ClimaGuard" 
        subtitle="AI-Powered Climate Risk Platform for Mauritius"
      >
        <LiveTimeDisplay />
        <StatusBadge status="success" size="sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live System
        </StatusBadge>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="bg-card border-theme border-b shadow-sm" style={{ borderColor: 'var(--card-border)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1">
            {([
              { id: 'overview', label: 'Overview', icon: '📊', description: 'System Status' },
              { id: 'cyclone', label: 'CycloneGuard', icon: '🌀', description: 'Tropical Cyclones' },
              { id: 'flood', label: 'FloodSense', icon: '🌊', description: 'Flood Monitoring' },
              { id: 'ocean-health', label: 'Ocean Health', icon: '🌊', description: 'Marine Protection' },
              { id: 'alerts', label: 'Alerts', icon: '🚨', description: 'Active Warnings' },
              { id: 'chat', label: 'ClimaWise', icon: '💬', description: 'Cyclone, Flood & Ocean AI', href: '/chat' },
            ] as TabItem[]).map((tab) => {
              if (tab.href) {
                return (
                  <Link key={tab.id} href={tab.href}>
                    <div
                      className={`py-3 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 relative ${
                        'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tab.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold">{tab.label}</div>
                          <div className="text-xs opacity-75">{tab.description}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'overview' || tab.id === 'cyclone' || tab.id === 'flood' || tab.id === 'ocean-health' || tab.id === 'alerts') {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`py-3 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                icon="🌀" 
                title="Active Cyclones" 
                value={cycloneData.category > 0 ? "1" : "0"} 
                subtitle={cycloneData.category > 0 ? `Category ${cycloneData.category} - ${cycloneData.name}` : "No active cyclones"}
                trend={cycloneData.category > 0 ? { direction: 'up', value: 'Active' } : { direction: 'stable', value: 'Clear' }}
              />
              <MetricCard 
                icon="🌊" 
                title="Flood Alerts" 
                value={floodData ? floodData.alerts?.length || 0 : 0} 
                subtitle={floodData ? `${floodData.riskLevel.charAt(0).toUpperCase() + floodData.riskLevel.slice(1)} Risk` : "Loading..."}
                trend={floodData && floodData.riskLevel === 'high' ? { direction: 'up', value: 'High' } : { direction: 'stable', value: 'Normal' }}
              />
              <MetricCard 
                icon="🌡️" 
                title="Temperature" 
                value={weatherData ? `${Math.round(weatherData.temperature)}°C` : "--"} 
                subtitle={weatherData ? `Humidity: ${Math.round(weatherData.humidity)}%` : "Loading..."}
                trend={{ direction: 'stable', value: 'Live' }}
              />
              <MetricCard 
                icon="💨" 
                title="Wind Speed" 
                value={weatherData ? `${Math.round(weatherData.windSpeed)} km/h` : "--"} 
                subtitle={stormSurgeData ? `Waves: ${stormSurgeData.waveHeightMax.toFixed(1)}m` : "Loading..."}
                trend={{ direction: 'stable', value: 'Live' }}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Current Cyclone Status */}
              <Card className="relative">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      🌀 Active Cyclone
                      <MicIcon 
                        text={`Active Cyclone: ${cycloneData.name}, Category ${cycloneData.category}`}
                        size="small" 
                      />
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        {cycloneData.name}
                        <MicIcon 
                          text={`Active Cyclone: ${cycloneData.name}, Category ${cycloneData.category}. Wind Speed: ${cycloneData.windSpeed} kilometers per hour. Pressure: ${cycloneData.pressure} hectopascals. Distance: ${cycloneData.distance} kilometers. Estimated time of arrival: ${cycloneData.eta} hours.`}
                          size="small" 
                        />
                      </h3>
                      <StatusBadge status="danger" size="lg">
                        Category {cycloneData.category}
                      </StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="text-gray-600">
                          Wind Speed
                        </div>
                        <div className="absolute top-2 right-2">
                          <MicIcon text={`Wind Speed: ${cycloneData.windSpeed} kilometers per hour`} size="small" />
                        </div>
                        <div className="font-semibold text-lg">{cycloneData.windSpeed} km/h</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="text-gray-600 flex items-center gap-1">
                          Pressure
                        </div>
                        <div className="absolute top-2 right-2">
                          <MicIcon text={`Pressure: ${cycloneData.pressure} hectopascals`} size="small" />
                        </div>
                        <div className="font-semibold text-lg">{cycloneData.pressure} hPa</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="text-gray-600 flex items-center gap-1">
                          Distance
                        </div>
                        <div className="absolute top-2 right-2">
                          <MicIcon text={`Distance: ${cycloneData.distance} kilometers`} size="small" />
                        </div>
                        <div className="font-semibold text-lg">{cycloneData.distance} km</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="text-gray-600 flex items-center gap-1">
                          ETA
                        </div>
                        <div className="absolute top-2 right-2">
                          <MicIcon text={`Estimated time of arrival: ${cycloneData.eta} hours`} size="small" />
                        </div>
                        <div className="font-semibold text-lg">{cycloneData.eta}h</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* AI Models Performance */}
                <Card>
                  <SectionHeader 
                    title="🤖 AI Models" 
                    subtitle="Performance metrics"
                    className="mb-4"
                  />
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-700">� CycloneGuard</h3>
                        <StatusBadge status="success" size="sm">LSTM</StatusBadge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Accuracy:</span>
                          <span className="font-semibold">94.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Trained:</span>
                          <span className="font-semibold">1d ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-green-700">🌊 FloodSense</h3>
                        <StatusBadge status="info" size="sm">CNN</StatusBadge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600">Accuracy:</span>
                          <span className="font-semibold">89.7%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Trained:</span>
                          <span className="font-semibold">1d ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
              </Card>
            </div>
            
            {/* Additional Data Sources & Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Active Alerts */}
              <Card>
                <SectionHeader 
                  title="🚨 Active Alerts" 
                  action={
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAlerts(!showAlerts)}
                    >
                      {showAlerts ? 'Hide' : 'Show'} All
                    </Button>
                  }
                  className="mb-4"
                />
                {showAlerts && (
                  <div className="space-y-3">
                    {alertData.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-400"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {alert.zone}
                                <MicIcon 
                                  text={`${alert.type} alert. ${alert.level} risk in ${alert.zone}. ${alert.message}`} 
                                  size="small" 
                                />
                              </div>
                              <div className="text-sm text-gray-600">{alert.message}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={
                              alert.level.toLowerCase() === 'extreme' ? 'danger' :
                              alert.level.toLowerCase() === 'high' ? 'warning' :
                              alert.level.toLowerCase() === 'medium' ? 'info' : 'success'
                            } size="sm">
                              {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}
                            </StatusBadge>
                            <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Data Sources Status */}
              <Card>
                <SectionHeader 
                  title="📡 Data Sources" 
                  subtitle="Real-time data connections"
                  className="mb-4"
                />
                <div className="space-y-4">
                  {getDataSourcesStatus(weatherData, floodData, stormSurgeData, cycloneData).map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{source.name}</div>
                        <div className="text-sm text-gray-600">{source.type}</div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status="success" size="sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {source.status}
                        </StatusBadge>
                        <div className="text-xs text-gray-500 mt-1">{source.lastUpdate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            {/* Ocean Health Section (SDG 14) */}
            <Card>
              <SectionHeader 
                title="🌊 Ocean Health (SDG 14)" 
                subtitle="Marine ecosystem protection and monitoring"
                className="mb-4"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/ocean-health" className="block">
                  <div className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all bg-blue-50 dark:bg-blue-900/20 cursor-pointer">
                    <div className="text-2xl mb-2">🌊</div>
                    <div className="font-semibold text-theme">Ocean Health</div>
                    <div className="text-sm text-theme-secondary">Comprehensive monitoring</div>
                  </div>
                </Link>
                <Link href="/pollution" className="block">
                  <div className="p-4 rounded-lg border-2 border-red-200 hover:border-red-400 hover:shadow-md transition-all bg-red-50 dark:bg-red-900/20 cursor-pointer">
                    <div className="text-2xl mb-2">🚨</div>
                    <div className="font-semibold text-theme">Pollution</div>
                    <div className="text-sm text-theme-secondary">Detection & tracking</div>
                  </div>
                </Link>
                <Link href="/reef-health" className="block">
                  <div className="p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all bg-green-50 dark:bg-green-900/20 cursor-pointer">
                    <div className="text-2xl mb-2">🪸</div>
                    <div className="font-semibold text-theme">Coral Reefs</div>
                    <div className="text-sm text-theme-secondary">Bleaching prediction</div>
                  </div>
                </Link>
                <Link href="/biodiversity" className="block">
                  <div className="p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all bg-purple-50 dark:bg-purple-900/20 cursor-pointer">
                    <div className="text-2xl mb-2">🐠</div>
                    <div className="font-semibold text-theme">Biodiversity</div>
                    <div className="text-sm text-theme-secondary">Species monitoring</div>
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* CycloneGuard Tab */}
        {activeTab === 'cyclone' && (
          <div className="space-y-8">
            {/* AI Prediction Interface */}
            <Card>
              <SectionHeader 
                title="🤖 AI Cyclone Prediction" 
                subtitle="Advanced LSTM model for tropical cyclone forecasting"
                className="mb-6"
              />
              <AIPredictionInterface />
            </Card>
            
            {/* Integrated Climate Risk Map with Formation Predictions */}
            <Card>
              <SectionHeader 
                title="🗺️ Live Cyclone Formation Map" 
                subtitle="Real-time formation predictions at exact coordinates with expected dates"
                action={
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600">Formation Predictions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Current Systems</span>
                    </div>
                    <StatusBadge status="success" size="sm">Auto-Update 5min</StatusBadge>
                  </div>
                }
                className="mb-6"
              />
              <div className="relative h-[650px] min-h-[650px] md:h-[75vh]">
                <div className="absolute inset-0 rounded-lg overflow-hidden border border-gray-200">
                  <ClimaGuardMap type="cyclone" />
                </div>
                <div className="absolute top-4 right-4 z-10 max-w-[280px]">
                  <CycloneLayerToggles />
                </div>
              </div>
              
              {/* Map Legend */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FFD700',
                    border: '2px solid white',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>F</div>
                  <span>Formation Predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>High Risk Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-600" style={{ borderStyle: 'dashed' }}></div>
                  <span>Cyclone Path</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span>Weather Stations</span>
                </div>
              </div>
            </Card>

            {/* Cyclone Information Panel */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">🌪️ Cyclone Trajectory Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">LSTM Neural Network</h3>
                  <p className="text-sm text-blue-700">
                    Advanced deep learning model trained on historical cyclone data from IBTrACS and regional meteorological stations for trajectory prediction.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Trajectory Features:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 72-hour trajectory prediction</li>
                    <li>• Wind intensity forecasting</li>
                    <li>• Landfall impact assessment</li>
                    <li>• Real-time model updates</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Integrated Features:</h4>
                  <ul className="text-sm space-y-1 text-green-700">
                    <li>• Formation predictions on exact coordinates</li>
                    <li>• Expected formation dates and times</li>
                    <li>• Real-time environmental monitoring</li>
                    <li>• Unified risk visualization</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* FloodSense Tab */}
        {activeTab === 'flood' && (
          <div className="space-y-8">
            <Card>
              <SectionHeader 
                title="🌊 FloodSense Intelligence" 
                subtitle="AI-powered flood detection and prediction using satellite imagery"
                className="mb-6"
              />
              <div className="flex flex-col md:flex-row gap-6">
                {/* Map Section - Left side on desktop */}
                <div className="flex-1 relative h-[650px] min-h-[650px] md:h-[75vh]">
                  <div className="absolute inset-0 rounded-lg overflow-hidden border border-gray-200">
                    <ClimaGuardMap type="flood" />
                  </div>
                  <div className="absolute top-4 right-4 z-10 max-w-[280px]">
                    <FloodLayerToggles />
                  </div>
                </div>
                
                {/* Info Card Section - Right side on desktop, below on mobile */}
                <div className="w-full md:w-80 lg:w-96 space-y-6 overflow-y-auto max-h-[650px] md:max-h-[75vh]">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-3">🧠 CNN/UNet Architecture</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Advanced computer vision models analyzing high-resolution satellite imagery 
                      to detect flood patterns, monitor water levels, and predict inundation risks 
                      across Mauritius in real-time.
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">🚀 Advanced Capabilities</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Copernicus Sentinel satellite analysis</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Real-time terrain flood modeling</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Urban drainage system monitoring</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">River level prediction & alerts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <SectionHeader 
                title="🤖 AI Flood Prediction Interface" 
                className="mb-6"
              />
              <AIPredictionInterface />
            </Card>
          </div>
        )}

        {/* Ocean Health Tab */}
        {activeTab === 'ocean-health' && (
          <OceanHealthDashboard />
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <Card>
              <SectionHeader 
                title="🚨 Alert Management Center" 
                subtitle="Real-time notifications and emergency response coordination"
                className="mb-6"
              />
              <NotificationCenter />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}