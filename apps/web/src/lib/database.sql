-- ClimaGuard Database Schema
-- Run these in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_name TEXT,
  
  PRIMARY KEY (id),
  UNIQUE(email)
);

-- Create alert preferences table
CREATE TABLE public.alert_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Alert types
  cyclone_alerts BOOLEAN DEFAULT true,
  flood_alerts BOOLEAN DEFAULT true,
  wind_alerts BOOLEAN DEFAULT true,
  
  -- Delivery methods
  sms_enabled BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  
  -- Preferences
  critical_only BOOLEAN DEFAULT false,
  alert_radius_km INTEGER DEFAULT 50,
  
  UNIQUE(user_id)
);

-- Create notification history table
CREATE TABLE public.notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Alert details
  alert_type TEXT CHECK (alert_type IN ('cyclone', 'flood', 'wind')) NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'critical')) NOT NULL,
  message TEXT NOT NULL,
  location_name TEXT NOT NULL,
  
  -- Delivery details
  delivery_method TEXT CHECK (delivery_method IN ('sms', 'telegram', 'email', 'push')) NOT NULL,
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'delivered', 'failed')) DEFAULT 'sent'
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alert Preferences: Users can only see/edit their own preferences
CREATE POLICY "Users can view own alert preferences" ON public.alert_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alert preferences" ON public.alert_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert preferences" ON public.alert_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification History: Users can only see their own notifications
CREATE POLICY "Users can view own notification history" ON public.notification_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create default alert preferences
  INSERT INTO public.alert_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_profiles_location ON public.profiles(location_lat, location_lng);
CREATE INDEX idx_alert_preferences_user_id ON public.alert_preferences(user_id);
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);