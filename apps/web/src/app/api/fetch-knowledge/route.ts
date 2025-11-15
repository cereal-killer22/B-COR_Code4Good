/**
 * API Route: Fetch Knowledge Base Data
 * Fetches data from external APIs and stores it in Supabase
 * 
 * POST /api/fetch-knowledge
 * Body: {
 *   sourceApi: string, // e.g., 'openweathermap'
 *   apiUrl: string,
 *   apiKey?: string,
 *   dataType: 'weather' | 'cyclone' | 'flood' | 'ocean' | 'alert' | 'custom',
 *   locationName?: string,
 *   latitude?: number,
 *   longitude?: number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchApiData, FetchConfig } from '@/lib/services/apiDataFetcher';
import { storeApiData, createFetchLog, updateFetchLog, deactivateExpiredData } from '@/lib/services/supabaseDataStorage';

interface FetchKnowledgeRequest {
  sourceApi: string;
  apiUrl: string;
  apiKey?: string;
  dataType: 'weather' | 'cyclone' | 'flood' | 'ocean' | 'alert' | 'custom';
  locationName?: string;
  latitude?: number;
  longitude?: number;
  headers?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: FetchKnowledgeRequest = await request.json();
    const {
      sourceApi,
      apiUrl,
      apiKey,
      dataType,
      locationName,
      latitude,
      longitude,
      headers,
    } = body;

    // Validate required fields
    if (!sourceApi || !apiUrl || !dataType) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceApi, apiUrl, and dataType are required' },
        { status: 400 }
      );
    }

    // Create fetch log
    const logId = await createFetchLog(sourceApi);

    try {
      // Fetch data from external API
      const fetchConfig: FetchConfig = {
        apiUrl,
        apiKey,
        dataType,
        sourceApi,
        locationName,
        latitude,
        longitude,
        headers,
      };

      const fetchedData = await fetchApiData(fetchConfig);

      // Store data in Supabase
      const storedData = await storeApiData(
        sourceApi,
        apiUrl,
        dataType,
        fetchedData,
        locationName,
        latitude,
        longitude
      );

      // Update fetch log with success
      await updateFetchLog(logId, 'success', {
        recordsFetched: 1,
        recordsUpdated: storedData ? 1 : 0,
        recordsCreated: storedData ? 0 : 1,
      });

      // Deactivate expired data
      const expiredCount = await deactivateExpiredData();

      return NextResponse.json({
        success: true,
        message: 'Data fetched and stored successfully',
        data: {
          id: storedData.id,
          dataType: storedData.data_type,
          summary: storedData.summary,
          locationName: storedData.location_name,
        },
        expiredRecordsDeactivated: expiredCount,
      });
    } catch (error) {
      // Update fetch log with failure
      await updateFetchLog(
        logId,
        'failed',
        {
          recordsFetched: 0,
          recordsUpdated: 0,
          recordsCreated: 0,
        },
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  } catch (error) {
    console.error('Error in fetch-knowledge API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch and store knowledge base data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch multiple data sources (batch operation)
 * Useful for scheduled jobs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceApi = searchParams.get('sourceApi');
    const dataType = searchParams.get('dataType');

    // Example: Fetch weather data for Mauritius
    // This is a simple example - in production, you'd have a config file
    // with multiple API endpoints to fetch from

    if (sourceApi === 'openweathermap' && dataType === 'weather') {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OPENWEATHER_API_KEY not configured' },
          { status: 400 }
        );
      }

      // Mauritius coordinates
      const mauritiusLat = -20.3484;
      const mauritiusLon = 57.5522;

      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${mauritiusLat}&lon=${mauritiusLon}&units=metric`;

      const logId = await createFetchLog('openweathermap');

      try {
        const fetchedData = await fetchApiData({
          apiUrl,
          apiKey,
          dataType: 'weather',
          sourceApi: 'openweathermap',
          locationName: 'Mauritius',
          latitude: mauritiusLat,
          longitude: mauritiusLon,
        });

        const storedData = await storeApiData(
          'openweathermap',
          apiUrl,
          'weather',
          fetchedData,
          'Mauritius',
          mauritiusLat,
          mauritiusLon
        );

        await updateFetchLog(logId, 'success', {
          recordsFetched: 1,
          recordsUpdated: storedData ? 1 : 0,
          recordsCreated: storedData ? 0 : 1,
        });

        const expiredCount = await deactivateExpiredData();

        return NextResponse.json({
          success: true,
          message: 'Weather data fetched and stored successfully',
          data: {
            id: storedData.id,
            summary: storedData.summary,
          },
          expiredRecordsDeactivated: expiredCount,
        });
      } catch (error) {
        await updateFetchLog(
          logId,
          'failed',
          {
            recordsFetched: 0,
            recordsUpdated: 0,
            recordsCreated: 0,
          },
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    }

    return NextResponse.json(
      { error: 'Invalid sourceApi or dataType. Use POST for custom API endpoints.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in fetch-knowledge GET API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch knowledge base data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

