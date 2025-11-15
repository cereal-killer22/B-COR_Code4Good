'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AuthComponent, { QuickSignUp } from '@/components/AuthComponent';
import UserProfile from '@/components/UserProfile';
import type { User } from '@supabase/supabase-js';

export default function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickSignUp, setShowQuickSignUp] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌡️</div>
          <div className="text-lg text-gray-600">Loading ClimaGuard...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Welcome back, {user.email}! 👋
            </h1>
            <p className="text-gray-600">Manage your climate alert preferences</p>
          </div>
          <UserProfile user={user} />
          
          {/* Quick Actions */}
          <div className="max-w-2xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard"
              className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Dashboard</div>
              <div className="text-sm text-gray-600">View alerts & data</div>
            </a>
            <a
              href="/demo"
              className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold">Demo</div>
              <div className="text-sm text-gray-600">Code4Good presentation</div>
            </a>
            <a
              href="/"
              className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-semibold">Home</div>
              <div className="text-sm text-gray-600">Back to main page</div>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🛡️ Welcome to ClimaGuard
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            AI-Powered Climate Risk Platform for Mauritius
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white px-4 py-2 rounded-full shadow">
              🌀 Cyclone Prediction
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow">
              🌊 Flood Assessment
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow">
              📱 Multi-Channel Alerts
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow">
              🤖 AI-Powered Analytics
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3 text-center">🌀</div>
            <h3 className="text-lg font-semibold mb-2">CycloneGuard</h3>
            <p className="text-gray-600 text-sm">
              LSTM neural networks predict cyclone trajectories up to 72 hours in advance with 94% accuracy.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3 text-center">🌊</div>
            <h3 className="text-lg font-semibold mb-2">FloodSense</h3>
            <p className="text-gray-600 text-sm">
              CNN/UNet models analyze satellite imagery to assess flood risks and monitor water levels.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3 text-center">🚨</div>
            <h3 className="text-lg font-semibold mb-2">Smart Alerts</h3>
            <p className="text-gray-600 text-sm">
              Personalized notifications via SMS, Telegram, and email based on your location and preferences.
            </p>
          </div>
        </div>

        {/* Auth Options */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Standard Auth */}
          <div>
            <AuthComponent onAuthSuccess={() => {}} />
          </div>

          {/* Quick Demo */}
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🚀 For Code4Good Demo</h3>
              <p className="text-yellow-700 text-sm mb-4">
                Quick sign-up to test all features including SMS alerts, location preferences, and notification history.
              </p>
              <button
                onClick={() => setShowQuickSignUp(!showQuickSignUp)}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                {showQuickSignUp ? 'Show Standard Auth' : 'Quick Demo Sign Up'}
              </button>
            </div>

            {showQuickSignUp && <QuickSignUp />}

            {/* Demo Features */}
            {!showQuickSignUp && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-4">🎯 Demo Features Available</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Real-time cyclone tracking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Interactive risk maps
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    AI prediction models
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Notification system demo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Location-based alerts
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <div className="mb-4">
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              Code4Good 2024 Submission
            </span>
          </div>
          <p className="text-sm">
            Supporting UN SDGs 13 (Climate Action) & 9 (Innovation & Infrastructure)
          </p>
        </div>
      </div>
    </div>
  );
}