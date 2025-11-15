# 🤖 ClimaWise Knowledge Base Integration

This document explains how the chatbot knowledge base pipeline works and how to use it.

## Overview

The ClimaWise chatbot has been extended with a pipeline that:
1. **Fetches data** from external APIs (weather, cyclones, floods, ocean health, etc.)
2. **Stores/updates** the data in Supabase
3. **Retrieves relevant data** from Supabase based on user queries
4. **Integrates** the data into chatbot responses for accurate, up-to-date information

## Architecture

```
External API → Data Fetcher → Supabase Storage → Data Retrieval → Chatbot Response
```

### Components

1. **Database Schema** (`database-chat-knowledge.sql`)
   - `chat_knowledge_base` table: Stores fetched API data
   - `api_fetch_logs` table: Tracks fetch jobs

2. **Data Fetch Service** (`lib/services/apiDataFetcher.ts`)
   - Fetches data from external APIs
   - Extracts keywords and creates summaries
   - Handles different API formats

3. **Storage Service** (`lib/services/supabaseDataStorage.ts`)
   - Stores/updates data in Supabase
   - Manages fetch logs
   - Handles data expiration

4. **Retrieval Service** (`lib/services/supabaseDataRetrieval.ts`)
   - Searches Supabase based on user queries
   - Extracts relevant context
   - Formats data for LLM consumption

5. **Chatbot Integration** (`app/api/chat/route.ts`)
   - Retrieves relevant data before generating responses
   - Includes data context in LLM prompts

6. **Fetch API Route** (`app/api/fetch-knowledge/route.ts`)
   - Endpoint to trigger data fetching
   - Supports batch operations

## Setup Instructions

### 1. Create Database Tables

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of apps/web/src/lib/database-chat-knowledge.sql
# Paste into Supabase SQL Editor and execute
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External API Keys (example: OpenWeatherMap)
OPENWEATHER_API_KEY=your_openweather_api_key
```

### 3. Fetch Initial Data

#### Option A: Using the API Route (POST)

```bash
curl -X POST http://localhost:3000/api/fetch-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "sourceApi": "openweathermap",
    "apiUrl": "https://api.openweathermap.org/data/2.5/weather?lat=-20.3484&lon=57.5522&units=metric",
    "apiKey": "your_api_key",
    "dataType": "weather",
    "locationName": "Mauritius",
    "latitude": -20.3484,
    "longitude": 57.5522
  }'
```

#### Option B: Using the API Route (GET - Example)

```bash
# Fetch weather data for Mauritius (requires OPENWEATHER_API_KEY in env)
curl http://localhost:3000/api/fetch-knowledge?sourceApi=openweathermap&dataType=weather
```

### 4. Test the Chatbot

The chatbot will automatically retrieve relevant data from Supabase when users ask questions. Try asking:

- "What's the weather in Mauritius?"
- "Are there any cyclones expected?"
- "How is the ocean health?"

## Usage Examples

### Fetching Weather Data

```typescript
// In your code or via API call
const response = await fetch('/api/fetch-knowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceApi: 'openweathermap',
    apiUrl: 'https://api.openweathermap.org/data/2.5/weather?lat=-20.3484&lon=57.5522&units=metric',
    apiKey: process.env.OPENWEATHER_API_KEY,
    dataType: 'weather',
    locationName: 'Mauritius',
    latitude: -20.3484,
    longitude: 57.5522,
  }),
});
```

### Fetching Custom API Data

```typescript
const response = await fetch('/api/fetch-knowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceApi: 'mauritius_met',
    apiUrl: 'https://api.mauritius-met.gov.mu/alerts',
    apiKey: 'your_api_key',
    dataType: 'alert',
    locationName: 'Mauritius',
    headers: {
      'Authorization': 'Bearer your_token',
    },
  }),
});
```

## Scheduled Data Updates

To keep data fresh, set up a cron job or scheduled task:

### Using Vercel Cron (if deployed on Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/fetch-knowledge?sourceApi=openweathermap&dataType=weather",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Using Node.js Cron

```javascript
const cron = require('node-cron');

// Fetch weather data every hour
cron.schedule('0 * * * *', async () => {
  await fetch('http://localhost:3000/api/fetch-knowledge?sourceApi=openweathermap&dataType=weather');
});
```

## Data Types Supported

- **weather**: Weather conditions, temperature, humidity
- **cyclone**: Cyclone warnings, tracking information
- **flood**: Flood alerts, water levels
- **ocean**: Ocean health, water quality, coral reef data
- **alert**: General alerts and warnings
- **custom**: Any custom data type

## How It Works

1. **User asks a question** in the chatbot
2. **System extracts keywords** from the question (cyclone, flood, weather, etc.)
3. **System queries Supabase** for relevant data matching keywords
4. **Relevant data is retrieved** and formatted as context
5. **Context is added** to the LLM system prompt
6. **LLM generates response** using both its training and the retrieved data
7. **Response includes follow-up question** as configured

## Data Expiration

Data automatically expires based on type:
- **Weather**: 1 hour
- **Cyclones**: 6 hours
- **Floods**: 3 hours
- **Ocean**: 12 hours
- **Alerts**: 24 hours
- **Custom**: 24 hours (default)

Expired data is marked as inactive and won't be retrieved for chatbot responses.

## Monitoring

Check fetch logs in Supabase:

```sql
SELECT * FROM api_fetch_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Data not appearing in chatbot responses

1. Check if data exists in Supabase:
   ```sql
   SELECT * FROM chat_knowledge_base WHERE is_active = true;
   ```

2. Verify keywords match:
   ```sql
   SELECT search_keywords FROM chat_knowledge_base;
   ```

3. Check fetch logs for errors:
   ```sql
   SELECT * FROM api_fetch_logs WHERE status = 'failed';
   ```

### API fetch failing

1. Verify API key is correct
2. Check API endpoint URL
3. Review fetch logs in Supabase
4. Check server logs for detailed error messages

## Security Notes

- **Service Role Key**: Only used server-side, never exposed to client
- **API Keys**: Store in environment variables, never commit to Git
- **RLS Policies**: Adjust Row Level Security policies as needed for your use case

## Next Steps

1. Add more API sources (cyclone tracking, flood monitoring, etc.)
2. Set up scheduled jobs for automatic data updates
3. Implement data validation and quality checks
4. Add data visualization in the dashboard
5. Create admin interface for managing knowledge base

