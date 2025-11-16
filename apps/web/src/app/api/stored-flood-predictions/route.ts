import { NextRequest, NextResponse } from 'next/server';
import FloodPredictionStorage from '@/lib/models/floodPredictionStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const result = await FloodPredictionStorage.getRecentPredictions(hours);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error('Error fetching stored flood predictions:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
