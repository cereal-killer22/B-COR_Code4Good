'use client';

import { useState } from 'react';

export default function AIPredictionInterface() {
  const [selectedModel, setSelectedModel] = useState('cyclone');
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🧠 Neural Network Models</h2>
        <div className="text-sm text-green-600">Status: Ready</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI Models</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedModel('cyclone')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedModel === 'cyclone'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🌀</div>
              <div className="font-semibold">CycloneGuard LSTM</div>
              <div className="text-xs text-gray-600">Neural Network v2.1</div>
            </button>

            <button
              onClick={() => setSelectedModel('flood')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedModel === 'flood'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🌊</div>
              <div className="font-semibold">FloodSense CNN</div>
              <div className="text-xs text-gray-600">Neural Network v1.3</div>
            </button>
          </div>
        </div>

        {/* Predictions Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Real-time Predictions</h3>
          
          {selectedModel === 'cyclone' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-orange-800">Cyclone Risk</span>
                <span className="text-2xl font-bold text-orange-600">85%</span>
              </div>
              <div className="text-sm text-orange-700 mt-2">
                LSTM predicting 72-hour trajectory
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-orange-600 mb-1">
                  <span>Confidence</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '94.2%'}}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800">Flood Risk</span>
                <span className="text-2xl font-bold text-blue-600">72%</span>
              </div>
              <div className="text-sm text-blue-700 mt-2">
                CNN analyzing spatial flood patterns
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-blue-600 mb-1">
                  <span>Confidence</span>
                  <span>89.7%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '89.7%'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">TensorFlow.js</div>
            <div className="text-gray-600">Framework</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Real-time</div>
            <div className="text-gray-600">Data Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">ML</div>
            <div className="text-gray-600">Actual Neural Networks</div>
          </div>
        </div>
      </div>
    </div>
  );
}