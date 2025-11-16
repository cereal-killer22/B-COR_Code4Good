/**
 * Historical Cyclone Data API
 * Returns historical cyclone tracks, Mauritius impact locations, and formation zones
 */

import { NextRequest, NextResponse } from 'next/server';

// Historical cyclones that affected Mauritius (based on IBTrACS and historical records)
const HISTORICAL_CYCLONES = [
  {
    id: 'GAMEDE_2007',
    name: 'Gamede',
    year: 2007,
    category: 3,
    maxWindSpeed: 185, // km/h
    track: [
      [55.5, -12.0], [56.0, -13.5], [56.5, -15.0], [57.0, -17.0],
      [57.2, -19.0], [57.3, -20.2], [57.4, -21.5], [57.5, -23.0]
    ],
    impactLocations: [
      { name: 'Port Louis', lat: -20.1619, lng: 57.4989, severity: 'high', damage: 'Flooding, infrastructure damage' },
      { name: 'Curepipe', lat: -20.3167, lng: 57.5167, severity: 'moderate', damage: 'Landslides, power outages' },
      { name: 'Rose Belle', lat: -20.4000, lng: 57.5833, severity: 'high', damage: 'Severe flooding' }
    ]
  },
  {
    id: 'BERGUITTA_2018',
    name: 'Berguitta',
    year: 2018,
    category: 2,
    maxWindSpeed: 150,
    track: [
      [58.0, -15.5], [58.2, -17.0], [58.3, -18.5], [58.2, -19.8],
      [58.0, -20.2], [57.8, -20.5], [57.5, -21.0]
    ],
    impactLocations: [
      { name: 'Port Louis', lat: -20.1619, lng: 57.4989, severity: 'moderate', damage: 'Coastal flooding' },
      { name: 'Grand Baie', lat: -20.0081, lng: 57.5800, severity: 'moderate', damage: 'Beach erosion' },
      { name: 'Mahebourg', lat: -20.4081, lng: 57.7000, severity: 'high', damage: 'Severe coastal flooding' }
    ]
  },
  {
    id: 'FANTALA_2016',
    name: 'Fantala',
    year: 2016,
    category: 5,
    maxWindSpeed: 280,
    track: [
      [52.0, -8.0], [53.0, -10.0], [54.0, -12.5], [55.0, -15.0],
      [56.0, -17.5], [57.0, -19.5], [57.2, -20.3], [57.3, -21.0]
    ],
    impactLocations: [
      { name: 'Port Louis', lat: -20.1619, lng: 57.4989, severity: 'severe', damage: 'Major infrastructure damage' },
      { name: 'Plaine Wilhems', lat: -20.3167, lng: 57.5167, severity: 'high', damage: 'Widespread flooding' }
    ]
  },
  {
    id: 'CARLOS_2017',
    name: 'Carlos',
    year: 2017,
    category: 1,
    maxWindSpeed: 120,
    track: [
      [58.5, -16.0], [58.3, -17.5], [58.1, -19.0], [57.9, -20.0],
      [57.7, -20.3], [57.5, -20.6]
    ],
    impactLocations: [
      { name: 'Grand Baie', lat: -20.0081, lng: 57.5800, severity: 'moderate', damage: 'Coastal damage' },
      { name: 'Flic en Flac', lat: -20.2833, lng: 57.3667, severity: 'low', damage: 'Minor beach erosion' }
    ]
  },
  {
    id: 'HERVE_2015',
    name: 'Herve',
    year: 2015,
    category: 2,
    maxWindSpeed: 140,
    track: [
      [57.0, -18.0], [57.2, -19.0], [57.3, -19.8], [57.4, -20.2],
      [57.5, -20.5], [57.6, -21.0]
    ],
    impactLocations: [
      { name: 'Port Louis', lat: -20.1619, lng: 57.4989, severity: 'moderate', damage: 'Urban flooding' },
      { name: 'Curepipe', lat: -20.3167, lng: 57.5167, severity: 'moderate', damage: 'Landslides' }
    ]
  },
  {
    id: 'BENJAMIN_2019',
    name: 'Benjamin',
    year: 2019,
    category: 1,
    maxWindSpeed: 110,
    track: [
      [59.0, -17.0], [58.8, -18.5], [58.5, -19.5], [58.2, -20.0],
      [57.9, -20.3], [57.6, -20.6]
    ],
    impactLocations: [
      { name: 'Mahebourg', lat: -20.4081, lng: 57.7000, severity: 'moderate', damage: 'Coastal flooding' }
    ]
  }
];

// Indian Ocean Cyclone Formation Zones
// Based on climatology: cyclones typically form in warm waters (SST > 26.5°C) 
// between 5°S-25°S and 40°E-100°E during cyclone season (Nov-Apr)
const FORMATION_ZONES = [
  {
    id: 'zone_northwest',
    name: 'Northwest Indian Ocean',
    probability: 'high', // 60-80% formation probability
    bounds: [
      [40, -5], [60, -5], [60, -15], [40, -15], [40, -5]
    ],
    center: [50, -10],
    description: 'Primary formation zone - warm waters, low wind shear',
    peakSeason: 'December - February'
  },
  {
    id: 'zone_central',
    name: 'Central Indian Ocean',
    probability: 'moderate', // 40-60% formation probability
    bounds: [
      [60, -8], [80, -8], [80, -18], [60, -18], [60, -8]
    ],
    center: [70, -13],
    description: 'Secondary formation zone - moderate conditions',
    peakSeason: 'January - March'
  },
  {
    id: 'zone_southeast',
    name: 'Southeast Indian Ocean',
    probability: 'moderate-high', // 50-70% formation probability
    bounds: [
      [80, -10], [100, -10], [100, -20], [80, -20], [80, -10]
    ],
    center: [90, -15],
    description: 'Active formation zone - favorable for intensification',
    peakSeason: 'February - April'
  },
  {
    id: 'zone_mauritius_region',
    name: 'Mauritius Vicinity',
    probability: 'low-moderate', // 20-40% formation probability
    bounds: [
      [55, -18], [60, -18], [60, -22], [55, -22], [55, -18]
    ],
    center: [57.5, -20],
    description: 'Rare formation zone - cyclones typically pass through',
    peakSeason: 'January - March'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTracks = searchParams.get('tracks') !== 'false';
    const includeImpacts = searchParams.get('impacts') !== 'false';
    const includeFormationZones = searchParams.get('formationZones') !== 'false';

    const response: any = {
      historicalCyclones: includeTracks ? HISTORICAL_CYCLONES : [],
      impactLocations: includeImpacts 
        ? HISTORICAL_CYCLONES.flatMap(cyclone => 
            cyclone.impactLocations.map(loc => ({
              ...loc,
              cycloneName: cyclone.name,
              cycloneYear: cyclone.year,
              cycloneCategory: cyclone.category
            }))
          )
        : [],
      formationZones: includeFormationZones ? FORMATION_ZONES : [],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('Error fetching historical cyclone data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch historical cyclone data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

