'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

interface AuthComponentProps {
  onAuthSuccess?: () => void;
}

export default function AuthComponent({ onAuthSuccess }: AuthComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      setMessage('Successfully signed in!');
      onAuthSuccess?.();
    }
    if (event === 'SIGNED_OUT') {
      setMessage('Signed out successfully');
    }
    if (event === 'USER_UPDATED') {
      setMessage('Profile updated');
    }
  });

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🌡️ ClimaGuard</h2>
        <p className="text-gray-600 mt-2">Join the climate protection network</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6',
                brandAccent: '#1d4ed8',
              }
            }
          }
        }}
        providers={['google']}
        redirectTo={`${window.location.origin}/dashboard`}
        additionalData={{
          full_name: 'User Name',
        }}
        localization={{
          variables: {
            sign_up: {
              email_label: 'Email Address',
              password_label: 'Create Password',
              button_label: 'Join ClimaGuard',
              loading_button_label: 'Creating Account...',
              social_provider_text: 'Sign up with {{provider}}',
              link_text: "Don't have an account? Sign up",
            },
            sign_in: {
              email_label: 'Email Address',
              password_label: 'Password',
              button_label: 'Sign In',
              loading_button_label: 'Signing In...',
              social_provider_text: 'Sign in with {{provider}}',
              link_text: 'Already have an account? Sign in',
            }
          }
        }}
      />

      <div className="mt-6 text-center text-sm text-gray-600">
        <div className="mb-2">📱 SMS Alerts • ✈️ Telegram • 📧 Email</div>
        <div className="text-xs">
          By signing up, you agree to receive climate alerts and emergency notifications.
        </div>
      </div>
    </div>
  );
}

// Quick Sign Up Form for Demo Purposes
export function QuickSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          }
        }
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold text-center">🚀 Quick Demo Sign Up</h3>
      
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />
      
      <input
        type="tel"
        placeholder="Phone (for SMS alerts)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-3 border rounded-lg"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Join ClimaGuard'}
      </button>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}