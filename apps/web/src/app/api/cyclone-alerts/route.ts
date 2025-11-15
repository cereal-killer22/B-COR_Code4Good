/**
 * API endpoint for cyclone alerts
 * Manages alert subscriptions and notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { cycloneAlerts, CycloneAlert } from '../../../lib/alerts/cycloneAlertSystem';
import { cycloneFormationPredictor } from '../../../lib/models/cycloneFormationPredictor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as CycloneAlert['severity'] | null;
    const hours = parseInt(searchParams.get('hours') || '24');
    
    // Get alerts based on query parameters
    let alerts = cycloneAlerts.getActiveAlerts();
    
    if (severity) {
      alerts = cycloneAlerts.getAlertsBySeverity(severity);
    }
    
    // Filter by time window
    const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
    alerts = alerts.filter(alert => alert.timestamp > timeThreshold);
    
    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        moderate: alerts.filter(a => a.severity === 'moderate').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch cyclone alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;
    
    switch (action) {
      case 'generate_alerts':
        console.log('🔄 Generating cyclone alerts...');
        
        // Get current formation predictions
        const formationForecast = await cycloneFormationPredictor.predictFormation({
          minLat: -30, maxLat: -10, minLng: 40, maxLng: 80
        }, 7);
        
        // Process formation predictions for alerts
        const formationAlerts = await cycloneAlerts.processFormationPredictions(
          formationForecast.predictions
        );
        
        // TODO: Get tracking predictions and process those too
        
        return NextResponse.json({
          success: true,
          alertsGenerated: formationAlerts.length,
          alerts: formationAlerts,
          forecast: formationForecast,
          message: `Generated ${formationAlerts.length} alerts from formation predictions`
        });
        
      case 'test_alert':
        // Generate a test alert
        const testAlert: CycloneAlert = {
          id: `test-${Date.now()}`,
          type: 'formation',
          severity: 'moderate',
          title: '🧪 Test Cyclone Formation Alert',
          message: 'This is a test alert to verify the notification system is working',
          location: { lat: -20.3, lng: 57.5 },
          timestamp: Date.now(),
          data: { test: true },
          actions: [
            '✅ Alert system is working correctly',
            '📧 Check your email/SMS configuration',
            '🔗 Verify webhook endpoints if configured'
          ]
        };
        
        await cycloneAlerts.sendAlert(testAlert);
        
        return NextResponse.json({
          success: true,
          message: 'Test alert sent successfully',
          alert: testAlert
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: generate_alerts or test_alert' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error processing alert request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process alert request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}