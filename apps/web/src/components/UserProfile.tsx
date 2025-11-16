'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AlertPreferences {
  cyclone_alerts: boolean;
  flood_alerts: boolean;
  wind_alerts: boolean;
  sms_enabled: boolean;
  telegram_enabled: boolean;
  email_enabled: boolean;
  critical_only: boolean;
  alert_radius_km: number;
}

interface UserProfile {
  full_name: string | null;
  phone_number: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

export default function UserProfile({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    phone_number: '',
    location_name: '',
    location_lat: null,
    location_lng: null
  });
  
  const [preferences, setPreferences] = useState<AlertPreferences>({
    cyclone_alerts: true,
    flood_alerts: true,
    wind_alerts: true,
    sms_enabled: false,
    telegram_enabled: false,
    email_enabled: true,
    critical_only: false,
    alert_radius_km: 50
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
    loadPreferences();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name,
          phone_number: data.phone_number,
          location_name: data.location_name,
          location_lat: data.location_lat,
          location_lng: data.location_lng
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          cyclone_alerts: data.cyclone_alerts,
          flood_alerts: data.flood_alerts,
          wind_alerts: data.wind_alerts,
          sms_enabled: data.sms_enabled,
          telegram_enabled: data.telegram_enabled,
          email_enabled: data.email_enabled,
          critical_only: data.critical_only,
          alert_radius_km: data.alert_radius_km
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          location_name: profile.location_name,
          location_lat: profile.location_lat,
          location_lng: profile.location_lng,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const { error: prefError } = await supabase
        .from('alert_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (prefError) throw prefError;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const setLocation = (name: string) => {
    // Mauritius locations with coordinates
    const locations: { [key: string]: [number, number] } = {
      'Port Louis': [-20.1619, 57.5012],
      'Quatre Bornes': [-20.2658, 57.4796],
      'Grand Baie': [-20.0151, 57.5829],
      'Curepipe': [-20.3186, 57.5175],
      'Phoenix': [-20.3057, 57.5084],
      'Rose Hill': [-20.2272, 57.4963],
      'Mahebourg': [-20.4081, 57.7000],
      'Goodlands': [-20.0371, 57.5731]
    };

    if (locations[name]) {
      setProfile({
        ...profile,
        location_name: name,
        location_lat: locations[name][0],
        location_lng: locations[name][1]
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">👤 Profile Settings</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Sign Out
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (for SMS alerts)
              </label>
              <input
                type="tel"
                value={profile.phone_number || ''}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="+230 1234 5678"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold mb-4">📍 Location</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your primary location for alerts:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Port Louis', 'Quatre Bornes', 'Grand Baie', 'Curepipe', 'Phoenix', 'Rose Hill', 'Mahebourg', 'Goodlands'].map((location) => (
                <button
                  key={location}
                  onClick={() => setLocation(location)}
                  className={`p-2 text-sm rounded border ${
                    profile.location_name === location
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
            {profile.location_name && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {profile.location_name}
              </p>
            )}
          </div>
        </div>

        {/* Alert Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">🚨 Alert Preferences</h3>
          
          {/* Alert Types */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Alert Types:</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.cyclone_alerts}
                  onChange={(e) => setPreferences({ ...preferences, cyclone_alerts: e.target.checked })}
                  className="mr-2"
                />
                <span>🌀 Cyclone Alerts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.flood_alerts}
                  onChange={(e) => setPreferences({ ...preferences, flood_alerts: e.target.checked })}
                  className="mr-2"
                />
                <span>🌊 Flood Alerts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.wind_alerts}
                  onChange={(e) => setPreferences({ ...preferences, wind_alerts: e.target.checked })}
                  className="mr-2"
                />
                <span>💨 Wind Alerts</span>
              </label>
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Delivery Methods:</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                  className="mr-2"
                />
                <span>📧 Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  onChange={(e) => setPreferences({ ...preferences, sms_enabled: e.target.checked })}
                  className="mr-2"
                  disabled={!profile.phone_number}
                />
                <span>📱 SMS Alerts {!profile.phone_number && '(Add phone number)'}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.telegram_enabled}
                  onChange={(e) => setPreferences({ ...preferences, telegram_enabled: e.target.checked })}
                  className="mr-2"
                />
                <span>📻 Radio Broadcast</span>
              </label>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.critical_only}
                onChange={(e) => setPreferences({ ...preferences, critical_only: e.target.checked })}
                className="mr-2"
              />
              <span>Only send critical/high priority alerts</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert radius: {preferences.alert_radius_km} km
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={preferences.alert_radius_km}
                onChange={(e) => setPreferences({ ...preferences, alert_radius_km: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}