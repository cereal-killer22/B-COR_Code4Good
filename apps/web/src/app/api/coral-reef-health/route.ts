/**
 * Coral Reef Health API Route
 * Fetches coral reef health data from Supabase
 * Returns reef locations and health metrics around Mauritius
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const healthStatus = searchParams.get('health_status'); // Filter by health status
    const zone = searchParams.get('zone'); // Filter by reef zone
    const minCoverage = parseFloat(searchParams.get('min_coverage') || '0'); // Minimum coral coverage %

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('coral_reef_health')
      .select('*')
      .gte('coral_cover_percentage', minCoverage)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (healthStatus) {
      query = query.eq('health_status', healthStatus);
    }

    if (zone) {
      query = query.eq('reef_zone', zone);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch coral reef data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching coral reef data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
