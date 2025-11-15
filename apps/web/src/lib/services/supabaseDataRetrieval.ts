/**
 * Supabase Data Retrieval Service
 * Retrieves relevant data from Supabase knowledge base for chatbot context
 */

import { createClient } from '@supabase/supabase-js';
import { getAPIKeys } from '@/lib/config/apiKeys';

const keys = getAPIKeys();
const supabaseUrl = keys.supabaseUrl;
const supabaseServiceKey = keys.supabaseServiceRoleKey; // Use service role for server-side operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials not configured for data retrieval');
}

// Create Supabase client with service role key (server-side only)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface RetrievedData {
  dataType: string;
  summary: string;
  dataContent: any;
  locationName?: string;
  fetchTimestamp: string;
}

/**
 * Extract keywords from user message for search
 */
function extractKeywords(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const keywords: string[] = [];

  // Common climate-related keywords
  const keywordPatterns = [
    { pattern: /cyclone|hurricane|storm|tropical/i, keyword: 'cyclone' },
    { pattern: /flood|inundation|water level|rainfall/i, keyword: 'flood' },
    { pattern: /ocean|marine|coral|reef|water quality/i, keyword: 'ocean' },
    { pattern: /weather|temperature|humidity|pressure/i, keyword: 'weather' },
    { pattern: /alert|warning|emergency|danger/i, keyword: 'alert' },
    { pattern: /mauritius|port louis|grand baie|flic en flac/i, keyword: 'mauritius' },
  ];

  keywordPatterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(lowerMessage)) {
      keywords.push(keyword);
    }
  });

  // Extract location names (simple heuristic)
  const locationPatterns = [
    /port louis/i,
    /grand baie/i,
    /flic en flac/i,
    /curepipe/i,
    /mahebourg/i,
    /rose hill/i,
  ];

  locationPatterns.forEach(pattern => {
    if (pattern.test(lowerMessage)) {
      const match = lowerMessage.match(pattern);
      if (match) keywords.push(match[0].toLowerCase());
    }
  });

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Retrieve relevant data from Supabase based on user message
 */
export async function retrieveRelevantData(
  userMessage: string,
  limit: number = 5
): Promise<RetrievedData[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty results');
    return [];
  }

  try {
    const keywords = extractKeywords(userMessage);
    
    if (keywords.length === 0) {
      // If no keywords found, return recent active data
      return await getRecentActiveData(limit);
    }

    // Build query to search by keywords
    let query = supabase
      .from('chat_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .or('expires_at.is.null');

    // Search by data type (most specific)
    const dataTypeKeywords = keywords.filter(k => 
      ['cyclone', 'flood', 'ocean', 'weather', 'alert'].includes(k)
    );
    
    if (dataTypeKeywords.length > 0) {
      query = query.in('data_type', dataTypeKeywords);
    }

    // Search by keywords array (using array overlap)
    if (keywords.length > 0) {
      query = query.overlaps('search_keywords', keywords);
    }

    // Order by relevance (most recent first)
    query = query.order('updated_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error retrieving data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Fallback: get recent active data
      return await getRecentActiveData(limit);
    }

    return data.map(item => ({
      dataType: item.data_type,
      summary: item.summary,
      dataContent: item.data_content,
      locationName: item.location_name,
      fetchTimestamp: item.fetch_timestamp,
    }));
  } catch (error) {
    console.error('Error in retrieveRelevantData:', error);
    return [];
  }
}

/**
 * Get recent active data as fallback
 */
async function getRecentActiveData(limit: number): Promise<RetrievedData[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('chat_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .or('expires_at.is.null')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent data:', error);
      return [];
    }

    return (data || []).map(item => ({
      dataType: item.data_type,
      summary: item.summary,
      dataContent: item.data_content,
      locationName: item.location_name,
      fetchTimestamp: item.fetch_timestamp,
    }));
  } catch (error) {
    console.error('Error in getRecentActiveData:', error);
    return [];
  }
}

/**
 * Format retrieved data as context for LLM
 */
export function formatDataAsContext(retrievedData: RetrievedData[]): string {
  if (retrievedData.length === 0) {
    return '';
  }

  const contextParts = retrievedData.map((item, index) => {
    const locationInfo = item.locationName ? ` (Location: ${item.locationName})` : '';
    const timestamp = new Date(item.fetchTimestamp).toLocaleDateString();
    
    return `[Data Source ${index + 1}]
Type: ${item.dataType}${locationInfo}
Summary: ${item.summary}
Last Updated: ${timestamp}
Details: ${JSON.stringify(item.dataContent, null, 2)}`;
  });

  return `\n\n**RELEVANT DATA FROM KNOWLEDGE BASE:**\n${contextParts.join('\n\n')}\n\nUse this data to provide accurate, up-to-date information in your response.`;
}

