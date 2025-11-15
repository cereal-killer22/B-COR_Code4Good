# SDG 14 Implementation Guide: Adding Ocean Health Features to ClimaGuard

## 🎯 Objective
Transform ClimaGuard from a climate disaster prediction platform into a comprehensive climate-ocean protection system that fully addresses SDG 14 (Life Below Water).

---

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

#### 1.1 Create Ocean Health Data Models

**File:** `apps/web/src/lib/models/oceanHealth.ts`

```typescript
export interface OceanHealthMetrics {
  location: [number, number];
  timestamp: Date;
  
  // Water Quality
  waterQuality: {
    pH: number;
    temperature: number; // SST
    salinity: number;
    dissolvedOxygen: number;
    turbidity: number;
    score: number; // 0-100
  };
  
  // Pollution
  pollution: {
    plasticDensity: number; // particles/km²
    oilSpillRisk: number; // 0-100
    chemicalPollution: number; // 0-100
    overallIndex: number; // 0-100
  };
  
  // Biodiversity
  biodiversity: {
    speciesCount: number;
    endangeredSpecies: number;
    biodiversityIndex: number; // 0-100
  };
  
  // Coral Reef Health
  reefHealth: {
    bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
    healthIndex: number; // 0-100
    temperature: number;
    pH: number;
    coverage: number; // % coral coverage
  };
  
  // Overall Health Score
  overallHealthScore: number; // 0-100
}

export interface PollutionEvent {
  id: string;
  type: 'oil_spill' | 'plastic' | 'chemical' | 'debris' | 'sewage';
  location: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedArea: number; // km²
  predictedSpread: [number, number][];
  source?: string;
  status: 'detected' | 'confirmed' | 'contained' | 'resolved';
}
```

#### 1.2 Create Ocean Health API Routes

**File:** `apps/web/src/app/api/ocean-health/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { OceanHealthMetrics } from '@/lib/models/oceanHealth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '-20.0');
    const lng = parseFloat(searchParams.get('lng') || '57.5');
    
    // Fetch ocean health data from multiple sources
    const oceanHealth = await fetchOceanHealthData(lat, lng);
    
    return NextResponse.json({ oceanHealth });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ocean health data' },
      { status: 500 }
    );
  }
}

async function fetchOceanHealthData(lat: number, lng: number): Promise<OceanHealthMetrics> {
  // Integration with Copernicus Marine Service
  // Integration with NOAA Coral Reef Watch
  // Integration with Ocean Acidification data
  
  return {
    location: [lat, lng],
    timestamp: new Date(),
    waterQuality: {
      pH: 8.1,
      temperature: 28.5,
      salinity: 35.2,
      dissolvedOxygen: 6.5,
      turbidity: 0.3,
      score: 85
    },
    pollution: {
      plasticDensity: 0.5,
      oilSpillRisk: 15,
      chemicalPollution: 10,
      overallIndex: 80
    },
    biodiversity: {
      speciesCount: 1200,
      endangeredSpecies: 5,
      biodiversityIndex: 75
    },
    reefHealth: {
      bleachingRisk: 'low',
      healthIndex: 82,
      temperature: 28.5,
      pH: 8.1,
      coverage: 45
    },
    overallHealthScore: 80
  };
}
```

#### 1.3 Create Pollution Detection API

**File:** `apps/web/src/app/api/pollution/detect/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PollutionEvent } from '@/lib/models/oceanHealth';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, location } = await request.json();
    
    // Use ML model to detect pollution in satellite imagery
    const pollutionEvents = await detectPollution(imageUrl, location);
    
    return NextResponse.json({ events: pollutionEvents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Pollution detection failed' },
      { status: 500 }
    );
  }
}

async function detectPollution(imageUrl: string, location: [number, number]): Promise<PollutionEvent[]> {
  // Integrate with Sentinel-2 API
  // Use CNN model for oil spill detection
  // Use ML for plastic accumulation detection
  
  return [];
}
```

---

### Phase 2: AI Models (Weeks 5-8)

#### 2.1 Pollution Detection CNN Model

**File:** `apps/web/src/lib/models/pollutionDetector.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

export class PollutionDetector {
  private model: tf.LayersModel | null = null;
  
  async initializeModel(): Promise<void> {
    if (this.model) return;
    
    // Build CNN for pollution detection
    this.model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [256, 256, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'softmax' }) // 5 pollution types
      ]
    });
    
    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }
  
  async detectPollution(imageData: ImageData): Promise<{
    type: string;
    confidence: number;
    location: [number, number];
  }[]> {
    await this.initializeModel();
    
    // Preprocess image
    const tensor = tf.browser.fromPixels(imageData)
      .resizeNearestNeighbor([256, 256])
      .expandDims(0)
      .div(255.0);
    
    // Predict
    const prediction = this.model!.predict(tensor) as tf.Tensor;
    const values = await prediction.data();
    
    // Map to pollution types
    const types = ['oil_spill', 'plastic', 'chemical', 'debris', 'none'];
    const results = [];
    
    for (let i = 0; i < types.length; i++) {
      if (values[i] > 0.5 && types[i] !== 'none') {
        results.push({
          type: types[i],
          confidence: values[i],
          location: [0, 0] // Extract from image metadata
        });
      }
    }
    
    return results;
  }
}
```

#### 2.2 Coral Bleaching Predictor

**File:** `apps/web/src/lib/models/coralBleachingPredictor.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

export interface CoralBleachingPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'severe';
  probability: number;
  daysToBleaching?: number;
  temperature: number;
  pH: number;
  recommendations: string[];
}

export class CoralBleachingPredictor {
  private model: tf.LayersModel | null = null;
  
  async predictBleachingRisk(
    temperature: number,
    pH: number,
    historicalData: number[]
  ): Promise<CoralBleachingPrediction> {
    await this.initializeModel();
    
    // Use LSTM to predict based on temperature trends
    const riskScore = this.calculateRisk(temperature, pH, historicalData);
    
    return {
      riskLevel: this.getRiskLevel(riskScore),
      probability: riskScore,
      temperature,
      pH,
      recommendations: this.getRecommendations(riskScore)
    };
  }
  
  private calculateRisk(temp: number, pH: number, history: number[]): number {
    // Temperature threshold: 30°C for bleaching risk
    const tempRisk = temp > 30 ? (temp - 30) / 2 : 0;
    
    // pH risk: < 7.8 indicates acidification stress
    const pHRisk = pH < 7.8 ? (7.8 - pH) * 10 : 0;
    
    // Historical trend risk
    const trendRisk = this.analyzeTrend(history);
    
    return Math.min(1, (tempRisk + pHRisk + trendRisk) / 3);
  }
  
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'severe' {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'high';
    return 'severe';
  }
  
  private getRecommendations(score: number): string[] {
    const recommendations = [];
    
    if (score > 0.6) {
      recommendations.push('Reduce local stressors (fishing, pollution)');
      recommendations.push('Increase shading or cooling measures');
      recommendations.push('Monitor reef health daily');
    }
    
    if (score > 0.8) {
      recommendations.push('URGENT: Implement emergency protection measures');
      recommendations.push('Consider temporary fishing restrictions');
    }
    
    return recommendations;
  }
  
  private analyzeTrend(history: number[]): number {
    // Analyze temperature trend
    if (history.length < 2) return 0;
    
    const trend = history[history.length - 1] - history[0];
    return Math.min(1, Math.max(0, trend / 5)); // Normalize
  }
  
  private async initializeModel(): Promise<void> {
    // Initialize LSTM model for time series prediction
    // Similar to cyclone predictor architecture
  }
}
```

---

### Phase 3: UI Components (Weeks 9-12)

#### 3.1 Ocean Health Dashboard Component

**File:** `apps/web/src/components/OceanHealthDashboard.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { OceanHealthMetrics } from '@/lib/models/oceanHealth';

export default function OceanHealthDashboard() {
  const [healthData, setHealthData] = useState<OceanHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchOceanHealth();
    const interval = setInterval(fetchOceanHealth, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);
  
  async function fetchOceanHealth() {
    try {
      const response = await fetch('/api/ocean-health?lat=-20.0&lng=57.5');
      const data = await response.json();
      setHealthData(data.oceanHealth);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ocean health:', error);
    }
  }
  
  if (loading) return <div>Loading ocean health data...</div>;
  if (!healthData) return <div>No data available</div>;
  
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold mb-4">🌊 Ocean Health Overview</h2>
        
        {/* Overall Health Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">Overall Health Score</span>
            <span className="text-3xl font-bold text-blue-600">
              {healthData.overallHealthScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${healthData.overallHealthScore}%` }}
            />
          </div>
        </div>
        
        {/* Water Quality */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">pH Level</div>
            <div className="text-2xl font-bold">{healthData.waterQuality.pH}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Temperature</div>
            <div className="text-2xl font-bold">{healthData.waterQuality.temperature}°C</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Salinity</div>
            <div className="text-2xl font-bold">{healthData.waterQuality.salinity} ppt</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Dissolved O₂</div>
            <div className="text-2xl font-bold">{healthData.waterQuality.dissolvedOxygen} mg/L</div>
          </div>
        </div>
        
        {/* Pollution Index */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Pollution Index</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Plastic Density</span>
              <span className="font-semibold">{healthData.pollution.plasticDensity} particles/km²</span>
            </div>
            <div className="flex justify-between">
              <span>Oil Spill Risk</span>
              <span className="font-semibold">{healthData.pollution.oilSpillRisk}%</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Pollution</span>
              <span className={`font-semibold ${
                healthData.pollution.overallIndex > 70 ? 'text-green-600' :
                healthData.pollution.overallIndex > 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {healthData.pollution.overallIndex}/100
              </span>
            </div>
          </div>
        </div>
        
        {/* Coral Reef Health */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Coral Reef Health</h3>
          <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span>Bleaching Risk</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                healthData.reefHealth.bleachingRisk === 'low' ? 'bg-green-200 text-green-800' :
                healthData.reefHealth.bleachingRisk === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                healthData.reefHealth.bleachingRisk === 'high' ? 'bg-orange-200 text-orange-800' :
                'bg-red-200 text-red-800'
              }`}>
                {healthData.reefHealth.bleachingRisk.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Health Index</span>
              <span className="font-bold">{healthData.reefHealth.healthIndex}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Coral Coverage</span>
              <span className="font-bold">{healthData.reefHealth.coverage}%</span>
            </div>
          </div>
        </div>
        
        {/* Biodiversity */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Marine Biodiversity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {healthData.biodiversity.speciesCount}
              </div>
              <div className="text-sm text-gray-600">Species Count</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {healthData.biodiversity.endangeredSpecies}
              </div>
              <div className="text-sm text-gray-600">Endangered</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {healthData.biodiversity.biodiversityIndex}
              </div>
              <div className="text-sm text-gray-600">Biodiversity Index</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

#### 3.2 Pollution Events Map Component

**File:** `apps/web/src/components/PollutionMap.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PollutionEvent } from '@/lib/models/oceanHealth';
import MapComponent from './MapComponent';

export default function PollutionMap() {
  const [events, setEvents] = useState<PollutionEvent[]>([]);
  
  useEffect(() => {
    fetchPollutionEvents();
    const interval = setInterval(fetchPollutionEvents, 60000); // 1 min
    return () => clearInterval(interval);
  }, []);
  
  async function fetchPollutionEvents() {
    try {
      const response = await fetch('/api/pollution/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch pollution events:', error);
    }
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🚨 Pollution Events</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <div key={event.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold capitalize">{event.type.replace('_', ' ')}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {event.severity}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Detected: {new Date(event.detectedAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Affected Area: {event.affectedArea} km²
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className="capitalize">{event.status}</span>
            </p>
          </div>
        ))}
      </div>
      
      <MapComponent 
        events={events}
        center={[-20.0, 57.5]}
        zoom={9}
      />
    </div>
  );
}
```

---

### Phase 4: Data Integration (Weeks 13-16)

#### 4.1 Copernicus Marine Service Integration

**File:** `apps/web/src/lib/integrations/copernicusMarine.ts`

```typescript
export class CopernicusMarineService {
  private apiKey: string;
  private baseUrl = 'https://marine.copernicus.eu/api';
  
  constructor() {
    this.apiKey = process.env.COPERNICUS_MARINE_API_KEY || '';
  }
  
  async getOceanTemperature(lat: number, lng: number): Promise<number> {
    // Fetch sea surface temperature
    const response = await fetch(
      `${this.baseUrl}/temperature?lat=${lat}&lng=${lng}&apiKey=${this.apiKey}`
    );
    const data = await response.json();
    return data.temperature;
  }
  
  async getWaterQuality(lat: number, lng: number): Promise<{
    pH: number;
    salinity: number;
    dissolvedOxygen: number;
  }> {
    // Fetch water quality parameters
    const response = await fetch(
      `${this.baseUrl}/water-quality?lat=${lat}&lng=${lng}&apiKey=${this.apiKey}`
    );
    return await response.json();
  }
}
```

#### 4.2 NOAA Coral Reef Watch Integration

**File:** `apps/web/src/lib/integrations/coralReefWatch.ts`

```typescript
export interface CoralReefData {
  location: [number, number];
  bleachingRisk: 'low' | 'medium' | 'high' | 'severe';
  temperature: number;
  anomaly: number; // Temperature anomaly
  healthIndex: number;
}

export class CoralReefWatch {
  private baseUrl = 'https://coralreefwatch.noaa.gov/api';
  
  async getReefHealth(lat: number, lng: number): Promise<CoralReefData> {
    const response = await fetch(
      `${this.baseUrl}/reef-health?lat=${lat}&lng=${lng}`
    );
    return await response.json();
  }
  
  async getBleachingAlerts(region: string): Promise<CoralReefData[]> {
    const response = await fetch(
      `${this.baseUrl}/bleaching-alerts?region=${region}`
    );
    const data = await response.json();
    return data.alerts;
  }
}
```

---

## 🔧 Environment Variables to Add

Add to `.env.local`:

```bash
# Ocean Health APIs
COPERNICUS_MARINE_API_KEY=your_key_here
NOAA_CORAL_REEF_API_KEY=your_key_here
OCEAN_ACIDIFICATION_API_KEY=your_key_here
GLOBAL_FISHING_WATCH_API_KEY=your_key_here

# Sentinel-2 for pollution detection
SENTINEL_2_API_KEY=your_key_here
COPERNICUS_OPEN_ACCESS_HUB_USERNAME=your_username
COPERNICUS_OPEN_ACCESS_HUB_PASSWORD=your_password
```

---

## 📊 Database Schema Additions

**File:** `apps/web/src/lib/ocean-health-schema.sql`

```sql
-- Ocean Health Metrics Table
CREATE TABLE ocean_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Water Quality
  ph DECIMAL(4,2),
  temperature DECIMAL(5,2),
  salinity DECIMAL(5,2),
  dissolved_oxygen DECIMAL(5,2),
  turbidity DECIMAL(5,2),
  water_quality_score INTEGER,
  
  -- Pollution
  plastic_density DECIMAL(10,2),
  oil_spill_risk INTEGER,
  chemical_pollution INTEGER,
  pollution_index INTEGER,
  
  -- Biodiversity
  species_count INTEGER,
  endangered_species INTEGER,
  biodiversity_index INTEGER,
  
  -- Reef Health
  bleaching_risk VARCHAR(20),
  reef_health_index INTEGER,
  coral_coverage DECIMAL(5,2),
  
  -- Overall
  overall_health_score INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pollution Events Table
CREATE TABLE pollution_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  location POINT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  affected_area DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'detected',
  source TEXT,
  predicted_spread JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Coral Reef Monitoring Table
CREATE TABLE coral_reef_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reef_id VARCHAR(100) UNIQUE NOT NULL,
  location POINT NOT NULL,
  health_index INTEGER,
  bleaching_risk VARCHAR(20),
  temperature DECIMAL(5,2),
  ph DECIMAL(4,2),
  biodiversity INTEGER,
  last_assessment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Quick Start Implementation Checklist

### Week 1-2: Foundation
- [ ] Create ocean health data models
- [ ] Set up database schema
- [ ] Create basic API routes
- [ ] Add environment variables

### Week 3-4: Data Integration
- [ ] Integrate Copernicus Marine Service
- [ ] Integrate NOAA Coral Reef Watch
- [ ] Set up Sentinel-2 API access
- [ ] Create data pipeline

### Week 5-6: AI Models
- [ ] Develop pollution detection CNN
- [ ] Create coral bleaching predictor
- [ ] Build ocean health index model
- [ ] Train and test models

### Week 7-8: UI Components
- [ ] Create Ocean Health Dashboard
- [ ] Build Pollution Events Map
- [ ] Add Coral Reef Monitor
- [ ] Integrate with main dashboard

### Week 9-10: Testing & Refinement
- [ ] Test all integrations
- [ ] Validate AI model accuracy
- [ ] User testing
- [ ] Performance optimization

### Week 11-12: Documentation & Deployment
- [ ] Update documentation
- [ ] Create user guides
- [ ] Deploy to production
- [ ] Monitor and iterate

---

## 📈 Success Metrics

### SDG 14 Impact Indicators
- **Ocean Health Monitoring:** Real-time data for 100% of target area
- **Pollution Detection:** < 24 hour detection time for pollution events
- **Coral Reef Protection:** 80%+ accuracy in bleaching predictions
- **Biodiversity Tracking:** Monitor 50+ key species
- **Community Engagement:** 1000+ users accessing ocean health data

---

## 🔗 Key Resources

1. **Copernicus Marine Service:** https://marine.copernicus.eu/
2. **NOAA Coral Reef Watch:** https://coralreefwatch.noaa.gov/
3. **Global Fishing Watch:** https://globalfishingwatch.org/
4. **Ocean Acidification Research:** https://oceanacidification.noaa.gov/
5. **Sentinel-2 Data:** https://scihub.copernicus.eu/

---

**Next Steps:** Start with Phase 1, Week 1 tasks to establish the foundation for SDG 14 features.

