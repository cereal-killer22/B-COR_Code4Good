/**
 * Cyclone Training Dashboard Component
 * Manages continuous learning and training status
 */

'use client';

import React, { useState, useEffect } from 'react';

interface TrainingStats {
  lastTrainingTime: string | null;
  nextTrainingDue: string;
  trainingInProgress: boolean;
  config: {
    historicalYears: number;
    retrainingInterval: number;
    minTrainingTracks: number;
    validationSplit: number;
  };
}

export default function CycloneTrainingDashboard() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [continuousLearningActive, setContinuousLearningActive] = useState(false);

  // Fetch training status
  const fetchTrainingStatus = async () => {
    try {
      // Get both training status and model readiness
      const [trainingResponse, readinessResponse] = await Promise.all([
        fetch('/api/cyclone-training'),
        fetch('/api/model-readiness')
      ]);
      
      const trainingData = await trainingResponse.json();
      const readinessData = await readinessResponse.json();
      
      if (trainingData.success) {
        setStats(trainingData.stats);
      }
      
      // Update continuous learning status based on readiness
      if (readinessData.success && readinessData.readiness.hasTrained) {
        // Check if continuous learning was previously activated
        const wasActive = localStorage.getItem('continuous_learning_active') === 'true';
        setContinuousLearningActive(wasActive);
      }
      
    } catch (error) {
      console.error('Error fetching training status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start manual training
  const startTraining = async () => {
    setActionLoading('training');
    try {
      const response = await fetch('/api/cyclone-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_training' })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchTrainingStatus();
      }
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Start continuous learning
  const startContinuousLearning = async () => {
    setActionLoading('continuous');
    try {
      const response = await fetch('/api/model-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_continuous_learning' })
      });
      
      const data = await response.json();
      if (data.success) {
        setContinuousLearningActive(true);
        localStorage.setItem('continuous_learning_active', 'true');
        await fetchTrainingStatus();
      }
    } catch (error) {
      console.error('Failed to start continuous learning:', error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchTrainingStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchTrainingStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow border">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading training status...</span>
        </div>
      </div>
    );
  }

  const getTimeUntilNextTraining = () => {
    if (!stats?.nextTrainingDue) return null;
    
    const now = new Date();
    const nextTraining = new Date(stats.nextTrainingDue);
    const diff = nextTraining.getTime() - now.getTime();
    
    if (diff <= 0) return 'Due now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            🧠
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cyclone AI Training</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats?.trainingInProgress 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {stats?.trainingInProgress ? '🔄 Training' : '✅ Ready'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            continuousLearningActive 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {continuousLearningActive ? '🤖 Auto-Learning ON' : '📋 Manual Mode'}
          </span>
        </div>
      </div>

      {/* Training Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Last Training</h3>
            ⏰
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.lastTrainingTime 
              ? new Date(stats.lastTrainingTime).toLocaleString()
              : 'Never'
            }
          </div>
          <p className="text-xs text-gray-500 mt-1">Model last updated</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Next Training</h3>
            📈
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {getTimeUntilNextTraining() || 'Not scheduled'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Auto-retraining in</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Training Data</h3>
            🗄️
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.config.historicalYears || 0} years
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Historical cyclone data • Min: {stats?.config.minTrainingTracks} tracks
          </p>
        </div>
      </div>

      {/* Training Controls */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Training Controls</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={startTraining}
            disabled={actionLoading === 'training' || stats?.trainingInProgress}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'training' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '▶️'
            )}
            <span>
              {actionLoading === 'training' ? 'Training...' : 'Start Training Now'}
            </span>
          </button>

          <button
            onClick={startContinuousLearning}
            disabled={actionLoading === 'continuous' || continuousLearningActive}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              continuousLearningActive 
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:cursor-not-allowed`}
          >
            {actionLoading === 'continuous' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : continuousLearningActive ? (
              '✅'
            ) : (
              '🚀'
            )}
            <span>
              {actionLoading === 'continuous' 
                ? 'Starting...' 
                : continuousLearningActive 
                ? 'Continuous Learning Active'
                : 'Enable Auto-Learning'
              }
            </span>
          </button>

          <button
            onClick={fetchTrainingStatus}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Training Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5 flex-shrink-0 text-lg">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Training is Smart & Persistent!</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>One-Time Setup:</strong> Models save trained weights to your browser's storage</li>
                <li>• <strong>Persistent Across Restarts:</strong> No need to retrain when you restart the server</li>
                <li>• <strong>Training Epochs:</strong> Deep learning with 1 epoch for fast cyclone pattern recognition</li>
                <li>• <strong>Smart Updates:</strong> Only retrains every {stats?.config.retrainingInterval} hours with new data</li>
                <li>• <strong>Ready to Use:</strong> Works immediately with pre-built architecture, gets better with training</li>
                <li>• <strong>Historical Learning:</strong> Learns from {stats?.config.historicalYears} years of IBTrACS cyclone data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Smart Status Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 mt-0.5 flex-shrink-0 text-lg">💡</span>
            <div>
              <h4 className="font-medium text-green-900 mb-1">Answer: Training Frequency</h4>
              <p className="text-sm text-green-700">
                <strong>You only need to train ONCE!</strong> After the initial training, the model saves to your browser storage and loads automatically on server restart. The system will only retrain when new data becomes available (every {stats?.config.retrainingInterval} hours) or when you manually request it.
              </p>
            </div>
          </div>
        </div>

        {stats?.trainingInProgress && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin text-xl">⚡</div>
              <span className="font-medium text-yellow-900">Training in Progress</span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              The LSTM neural network is training for 1 epoch to learn cyclone trajectory patterns. This deep learning process should complete quickly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}