/**
 * Supabase Data Storage Service
 * Handles storing and updating fetched API data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { getAPIKeys } from '@/lib/config/apiKeys';
import { FetchedData } from './apiDataFetcher';

const keys = getAPIKeys();
const supabaseUrl = keys.supabaseUrl;
const supabaseServiceKey = keys.supabaseServiceRoleKey; // Use service role for server-side operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials not configured for data storage');
}

// Create Supabase client with service role key (server-side only)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface StoredData {
  id: string;
  source_api: string;
  source_url?: string;
  data_type: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  data_content: any;
  fetch_timestamp: string;
  expires_at?: string;
  is_active: boolean;
  search_keywords: string[];
  summary: string;
}

export interface FetchLog {
  id: string;
  source_api: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  error_message?: string;
  records_fetched: number;
  records_updated: number;
  records_created: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

/**
 * Store or update data in Supabase
 */
export async function storeApiData(
  sourceApi: string,
  sourceUrl: string,
  dataType: string,
  fetchedData: FetchedData,
  locationName?: string,
  latitude?: number,
  longitude?: number
): Promise<StoredData> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Check if data already exists (based on source_api, data_type, and location)
    const existingQuery = supabase
      .from('chat_knowledge_base')
      .select('id')
      .eq('source_api', sourceApi)
      .eq('data_type', dataType)
      .eq('is_active', true);

    if (locationName) {
      existingQuery.eq('location_name', locationName);
    }

    const { data: existing } = await existingQuery.limit(1).single();

    const dataToStore = {
      source_api: sourceApi,
      source_url: sourceUrl,
      data_type: dataType,
      location_name: locationName || null,
      latitude: latitude || null,
      longitude: longitude || null,
      data_content: fetchedData.dataContent,
      fetch_timestamp: new Date().toISOString(),
      expires_at: fetchedData.expiresAt?.toISOString() || null,
      is_active: true,
      search_keywords: fetchedData.searchKeywords,
      summary: fetchedData.summary,
    };

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('chat_knowledge_base')
        .update(dataToStore)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as StoredData;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('chat_knowledge_base')
        .insert(dataToStore)
        .select()
        .single();

      if (error) throw error;
      return data as StoredData;
    }
  } catch (error) {
    console.error('Error storing API data:', error);
    throw new Error(`Failed to store data in Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a fetch log entry
 */
export async function createFetchLog(sourceApi: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('api_fetch_logs')
    .insert({
      source_api: sourceApi,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Update fetch log with results
 */
export async function updateFetchLog(
  logId: string,
  status: 'success' | 'failed',
  stats: {
    recordsFetched: number;
    recordsUpdated: number;
    recordsCreated: number;
  },
  errorMessage?: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const startedAt = await getFetchLogStartTime(logId);
  const completedAt = new Date();
  const durationMs = startedAt ? completedAt.getTime() - new Date(startedAt).getTime() : null;

  const { error } = await supabase
    .from('api_fetch_logs')
    .update({
      status,
      error_message: errorMessage || null,
      records_fetched: stats.recordsFetched,
      records_updated: stats.recordsUpdated,
      records_created: stats.recordsCreated,
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
    })
    .eq('id', logId);

  if (error) throw error;
}

async function getFetchLogStartTime(logId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('api_fetch_logs')
    .select('started_at')
    .eq('id', logId)
    .single();

  return data?.started_at || null;
}

/**
 * Mark expired data as inactive
 */
export async function deactivateExpiredData(): Promise<number> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('chat_knowledge_base')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}

