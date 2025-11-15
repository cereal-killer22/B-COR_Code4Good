'use client';

import { useState, useEffect } from 'react';
import { Card, StatusBadge, MetricCard, Button } from '@/components/ui';
import MicIcon from '@/components/MicIcon';

export default function Home() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather/current?lat=-20.2&lng=57.5');
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data.weather);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const currentTemp = weatherData?.temperature || 0;
  const currentHumidity = weatherData?.humidity || 0;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;

  const handleViewDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleChat = () => {
    window.location.href = '/chat';
  };

  const checkWeather = () => {
    // Simulate weather check
    alert('Weather data refreshed! 🌤️');
  };

  return (
    <div className="min-h-screen bg-theme" style={{ background: 'linear-gradient(to bottom right, var(--background-secondary), var(--background), var(--background-secondary))' }}>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center py-16">
          <div className="mb-8">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
              🛡️ ClimaGuard
            </h1>
            <h2 className="text-3xl font-semibold text-theme mb-4 flex items-center justify-center gap-2">
              AI-Powered Climate Risk Platform
              <MicIcon text="AI-Powered Climate Risk Platform" size="small" />
            </h2>
            <p className="text-xl text-theme-secondary mb-2">
              Protecting Mauritius from climate disasters with advanced prediction technology
            </p>
            <StatusBadge status="success" size="lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Online • {formatDate(new Date())}
            </StatusBadge>
          </div>
          
          <div className="flex justify-center gap-4 mb-12">
            <Button size="lg" onClick={handleViewDashboard} icon="📊">
              View Dashboard
            </Button>
            <Button variant="outline" size="lg" onClick={handleChat} icon="💬">
              ClimaWise
            </Button>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard 
            icon="🌡️" 
            title="Temperature" 
            value={`${currentTemp}°C`} 
            subtitle={`${celsiusToFahrenheit(currentTemp).toFixed(1)}°F`}
            trend={{ direction: 'stable', value: 'Normal' }}
          />
          <MetricCard 
            icon="💧" 
            title="Humidity" 
            value={`${currentHumidity}%`} 
            subtitle="Moderate levels"
            trend={{ direction: 'down', value: '-2%' }}
          />
          <MetricCard 
            icon="🌀" 
            title="Cyclone Risk" 
            value="Medium" 
            subtitle="Category 3 active"
            trend={{ direction: 'up', value: 'Watching' }}
          />
          <MetricCard 
            icon="🌊" 
            title="Flood Risk" 
            value="Low" 
            subtitle="3 zones monitored"
            trend={{ direction: 'stable', value: 'Stable' }}
          />
        </div>

        {/* Feature Cards */}
                {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="group cursor-pointer" onClick={() => window.location.href = '/auth'}>
            <Card className="hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
                <h3 className="text-lg font-semibold text-theme mb-2 flex items-center justify-center gap-2">
                  Authentication
                  <MicIcon text="Authentication. Secure access to your climate data" size="small" />
                </h3>
                <p className="text-sm text-theme-secondary">Secure access to your climate data</p>
              </div>
            </Card>
          </div>
          <div className="group cursor-pointer" onClick={() => window.location.href = '/dashboard'}>
            <Card className="hover:shadow-xl transition-all duration-300 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🌀</div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center justify-center gap-2">
                  Live Dashboard
                  <MicIcon text="Live Dashboard. Real-time climate monitoring" size="small" />
                </h3>
                <p className="text-sm text-blue-600">Real-time climate monitoring</p>
              </div>
            </Card>
          </div>
          <div className="group cursor-pointer" onClick={() => window.location.href = '/chat'}>
            <Card className="hover:shadow-xl transition-all duration-300 border-2 border-cyan-200">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💬</div>
                <h3 className="text-lg font-semibold text-cyan-700 mb-2">ClimaWise</h3>
                <p className="text-sm text-cyan-600">Cyclone, Flood & Ocean AI</p>
              </div>
            </Card>
          </div>
          <div className="group cursor-pointer" onClick={() => window.location.href = '/demo'}>
            <Card className="hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
                <h3 className="text-lg font-semibold text-theme mb-2 flex items-center justify-center gap-2">
                  Interactive Demo
                  <MicIcon text="Interactive Demo. Explore AI predictions" size="small" />
                </h3>
                <p className="text-sm text-theme-secondary">Explore AI predictions</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-xl font-bold text-orange-600 mb-3 flex items-center gap-2">
              🌀 Cyclone Formation Prediction
              <MicIcon 
                text="Cyclone Formation Prediction. AI-powered predictions showing where and when new cyclones will form with expected dates. Real-time formation analysis and early warning." 
                size="small" 
              />
            </h3>
            <p className="text-theme mb-4">
              AI-powered predictions showing where and when new cyclones will form with expected dates.
            </p>
            <div className="bg-theme-secondary p-3 rounded-lg">
              <p className="text-sm text-theme">
                Real-time • Formation Analysis • Early Warning
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-purple-600 mb-3 flex items-center gap-2">
              💧 Humidity Control
              <MicIcon 
                text={`Humidity Control. Track humidity levels and receive notifications when levels reach critical thresholds. Current: ${currentHumidity} percent. Status: Optimal.`} 
                size="small" 
              />
            </h3>
            <p className="text-theme mb-4">
              Track humidity levels and receive notifications when levels reach critical thresholds.
            </p>
            <div className="bg-theme-secondary p-3 rounded-lg">
              <p className="text-sm text-theme">
                Current: {currentHumidity}% • Status: Optimal
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-green-600 mb-3 flex items-center gap-2">
              📊 Analytics Dashboard
              <MicIcon 
                text="Analytics Dashboard. Historical data analysis, trend visualization, and predictive insights. Cross-platform support for web and mobile." 
                size="small" 
              />
            </h3>
            <p className="text-theme mb-4">
              Historical data analysis, trend visualization, and predictive insights.
            </p>
            <div className="bg-theme-secondary p-3 rounded-lg">
              <p className="text-sm text-theme">
                Cross-platform • Web • Mobile
              </p>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            Get Started with Climate Monitoring
            <MicIcon text="Get Started with Climate Monitoring" size="small" />
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleViewDashboard}
              variant="primary"
            >
              View Dashboard
            </Button>
            <Button
              onClick={handleChat}
              variant="secondary"
            >
              Chat with ClimaWise
            </Button>
          </div>
          
          <p className="text-center text-theme-secondary mt-4 text-sm">
            Cross-platform monitoring • Web • Mobile • Real-time alerts
          </p>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            Default Alert Thresholds
            <MicIcon text="Default Alert Thresholds. Critical Hot: 40 degrees Celsius. Hot: 30 degrees Celsius. Cold: 5 degrees Celsius. Critical Cold: negative 10 degrees Celsius." size="small" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl mb-2">🔥</div>
              <div className="font-bold text-red-600 flex items-center justify-center gap-2">
                Critical Hot
                <MicIcon text="Critical Hot: 40 degrees Celsius" size="small" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">40°C</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl mb-2">☀️</div>
              <div className="font-bold text-orange-600 flex items-center justify-center gap-2">
                Hot
                <MicIcon text="Hot: 30 degrees Celsius" size="small" />
              </div>
              <div className="text-sm text-gray-600">30°C</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl mb-2">❄️</div>
              <div className="font-bold text-blue-600 flex items-center justify-center gap-2">
                Cold
                <MicIcon text="Cold: 5 degrees Celsius" size="small" />
              </div>
              <div className="text-sm text-gray-600">5°C</div>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="text-2xl mb-2">🧊</div>
              <div className="font-bold text-blue-800 flex items-center justify-center gap-2">
                Critical Cold
                <MicIcon text="Critical Cold: negative 10 degrees Celsius" size="small" />
              </div>
              <div className="text-sm text-gray-600">-10°C</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
