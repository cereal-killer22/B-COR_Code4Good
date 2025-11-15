-- ClimaGuard Chat Knowledge Base Schema
-- Run this in your Supabase SQL Editor to create tables for storing external API data

-- Table to store fetched data from external APIs
CREATE TABLE IF NOT EXISTS public.chat_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Source information
  source_api TEXT NOT NULL, -- e.g., 'openweathermap', 'mauritius_met', 'custom'
  source_url TEXT, -- Original API endpoint URL
  data_type TEXT NOT NULL, -- e.g., 'weather', 'cyclone', 'flood', 'ocean', 'alert'
  
  -- Location information (for Mauritius context)
  location_name TEXT, -- e.g., 'Port Louis', 'Mauritius'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Data content (stored as JSONB for flexibility)
  data_content JSONB NOT NULL, -- The actual data from the API
  
  -- Metadata
  fetch_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When data was fetched
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: when data becomes stale
  is_active BOOLEAN DEFAULT true, -- Whether this data is still relevant
  
  -- Search and indexing
  search_keywords TEXT[], -- Array of keywords for text search
  summary TEXT -- Brief summary for quick reference
);

-- Table to track API fetch jobs
CREATE TABLE IF NOT EXISTS public.api_fetch_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Job information
  source_api TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'success', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  
  -- Results
  records_fetched INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_kb_data_type ON public.chat_knowledge_base(data_type);
CREATE INDEX IF NOT EXISTS idx_chat_kb_location ON public.chat_knowledge_base(location_name);
CREATE INDEX IF NOT EXISTS idx_chat_kb_source_api ON public.chat_knowledge_base(source_api);
CREATE INDEX IF NOT EXISTS idx_chat_kb_active ON public.chat_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_kb_updated_at ON public.chat_knowledge_base(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_kb_keywords ON public.chat_knowledge_base USING GIN(search_keywords);
CREATE INDEX IF NOT EXISTS idx_chat_kb_content ON public.chat_knowledge_base USING GIN(data_content);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_chat_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_chat_kb_updated_at ON public.chat_knowledge_base;
CREATE TRIGGER handle_chat_kb_updated_at
  BEFORE UPDATE ON public.chat_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_chat_kb_updated_at();

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE public.chat_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_fetch_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users (adjust as needed)
CREATE POLICY "Allow read access to chat knowledge base" ON public.chat_knowledge_base
  FOR SELECT USING (is_active = true);

-- Policy: Only service role can insert/update (server-side only)
-- This will be handled by service role key in API routes

-- Add comments for documentation
COMMENT ON TABLE public.chat_knowledge_base IS 'Stores fetched data from external APIs for chatbot knowledge base';
COMMENT ON TABLE public.api_fetch_logs IS 'Tracks API fetch jobs and their status';
COMMENT ON COLUMN public.chat_knowledge_base.data_content IS 'JSONB field storing the actual API response data';
COMMENT ON COLUMN public.chat_knowledge_base.search_keywords IS 'Array of keywords extracted from data for text search';

