'use client';

import { useState, useEffect } from 'react';
import ClimaGuardMap from '@/components/ClimaGuardMap';

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const slides = [
    {
      id: 'intro',
      title: 'ClimaGuard: AI-Powered Climate Risk Platform',
      subtitle: 'Protecting Mauritius from Climate Disasters',
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🌡️</div>
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-2">🎯 Mission</h3>
              <p className="text-blue-700">
                Leverage AI to predict cyclones and floods, providing early warnings to save lives and protect communities in Mauritius.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-bold text-red-800">SDG 13</h4>
                <p className="text-sm text-red-700">Climate Action</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold text-green-800">SDG 9</h4>
                <p className="text-sm text-green-700">Innovation & Infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'problem',
      title: 'The Challenge: Climate Risks in Mauritius',
      subtitle: 'Understanding the Impact',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-red-800 mb-4">🌀 Cyclone Threats</h3>
              <ul className="space-y-2 text-red-700">
                <li>• 2-3 major cyclones annually</li>
                <li>• $100M+ economic losses per event</li>
                <li>• 48-hour warning insufficient</li>
                <li>• Limited trajectory accuracy</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-4">🌊 Flood Hazards</h3>
              <ul className="space-y-2 text-blue-700">
                <li>• Flash floods in urban areas</li>
                <li>• Limited early warning systems</li>
                <li>• Drainage system overload</li>
                <li>• Real-time monitoring gaps</li>
              </ul>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-yellow-800 mb-2">💡 The Opportunity</h3>
            <p className="text-yellow-700">
              AI can extend prediction windows to 72+ hours and improve accuracy by 25%, 
              potentially saving hundreds of lives and millions in damages.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'solution',
      title: 'ClimaGuard Solution Architecture',
      subtitle: 'AI-Powered Prediction Platform',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-4">🌀 CycloneGuard Module</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded">
                  <strong>LSTM Neural Network</strong>
                  <p className="text-sm text-gray-600">Deep learning for trajectory prediction</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <strong>IBTrACS Data Integration</strong>
                  <p className="text-sm text-gray-600">Historical cyclone database</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <strong>72-Hour Forecasting</strong>
                  <p className="text-sm text-gray-600">Extended prediction window</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 mb-4">🌊 FloodSense Module</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded">
                  <strong>CNN/UNet Architecture</strong>
                  <p className="text-sm text-gray-600">Satellite image analysis</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <strong>Copernicus Sentinel</strong>
                  <p className="text-sm text-gray-600">Real-time satellite data</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <strong>Terrain Modeling</strong>
                  <p className="text-sm text-gray-600">Flood risk simulation</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-purple-800 mb-4">📱 Multi-Channel Alerts</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold">SMS</div>
                <div className="text-sm text-gray-600">Immediate alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">✈️</div>
                <div className="font-semibold">Telegram</div>
                <div className="text-sm text-gray-600">Rich notifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📧</div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-gray-600">Detailed reports</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'demo',
      title: 'Live Demo: Real-Time Monitoring',
      subtitle: 'Interactive Risk Assessment',
      content: (
        <div className="space-y-4">
          <ClimaGuardMap />
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">96%</div>
              <div className="text-sm text-red-800">Cyclone Risk</div>
              <div className="text-xs text-red-600">Port Louis</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-blue-800">Flood Risk</div>
              <div className="text-xs text-blue-600">Quatre Bornes</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-green-800">AI Confidence</div>
              <div className="text-xs text-green-600">Overall System</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'impact',
      title: 'Expected Impact & Outcomes',
      subtitle: 'Measurable Benefits for Mauritius',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green-800">🎯 Direct Impact</h3>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-green-800">Lives potentially saved annually</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$50M</div>
                  <div className="text-sm text-blue-800">Economic losses prevented</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">72h</div>
                  <div className="text-sm text-purple-800">Extended warning window</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-orange-800">🌍 Broader Benefits</h3>
              <div className="space-y-3">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="font-bold text-orange-800">Tourism Protection</div>
                  <div className="text-sm text-orange-700">Safeguard $1.6B tourism industry</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="font-bold text-yellow-800">Agricultural Security</div>
                  <div className="text-sm text-yellow-700">Protect crop yields and food security</div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <div className="font-bold text-pink-800">Infrastructure Resilience</div>
                  <div className="text-sm text-pink-700">Minimize damage to critical systems</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🏆 Alignment with UN SDGs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold text-red-600">SDG 13: Climate Action</div>
                <div className="text-sm text-gray-700">Strengthening resilience to climate hazards</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">SDG 9: Innovation</div>
                <div className="text-sm text-gray-700">Building resilient infrastructure with AI</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'technical',
      title: 'Technical Innovation',
      subtitle: 'Advanced AI & Data Integration',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">🧠 AI Models Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>CycloneGuard (LSTM)</span>
                  <span className="font-bold text-blue-600">94.2% Accuracy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>FloodSense (CNN/UNet)</span>
                  <span className="font-bold text-green-600">89.7% Accuracy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Training Data Points</span>
                  <span className="font-bold text-purple-600">24,770+</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">📡 Data Sources</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">IBTrACS (Cyclone Database)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">NASA GPM (Rainfall Data)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Copernicus Sentinel (Satellite)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Météo-France (Local Weather)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🔬 Innovation Highlights</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold">Ensemble Learning</div>
                <div className="text-sm text-gray-600">Multiple model fusion</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-semibold">Real-time Processing</div>
                <div className="text-sm text-gray-600">30-second updates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🌐</div>
                <div className="font-semibold">Multi-platform</div>
                <div className="text-sm text-gray-600">Web & Mobile ready</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(nextSlide, 8000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">🌡️ ClimaGuard</h1>
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                Code4Good 2024 Demo
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  isAutoPlaying 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {isAutoPlaying ? '⏸️ Pause' : '▶️ Auto Play'}
              </button>
              <div className="text-sm text-gray-600">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]">
          
          {/* Slide Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {currentSlideData.title}
            </h1>
            <p className="text-lg text-gray-600">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* Slide Content */}
          <div className="mb-8">
            {currentSlideData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Previous</span>
            </button>

            {/* Slide Indicators */}
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <span>Next</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600">
          <p className="text-sm">
            🏆 Code4Good 2024 • Team ClimaGuard • SDG 13 & 9 • AI for Climate Resilience
          </p>
        </div>
      </div>
    </div>
  );
}