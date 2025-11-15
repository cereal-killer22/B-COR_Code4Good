# API Keys Configuration Guide

## 📁 Centralized Configuration

All API keys are now managed in a single file:
**`apps/web/src/lib/config/apiKeys.ts`**

## 🔧 Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in the `apps/web/` directory:

```bash
cd apps/web
cp .env.example .env.local
```

### 2. Add Your API Keys

Edit `.env.local` and add your API keys. The `.env.example` file contains placeholders for all available keys.

**Required keys:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Optional keys (you can use either format):**
```env
# Server-side only (for API routes)
OPENWEATHER_API_KEY=your_key_here

# OR client-side accessible (for browser)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here

# The system will use whichever is available
```

**Note:** For optional keys, you can:
- Leave them empty if not needed
- Use the `NEXT_PUBLIC_` prefix if you need client-side access
- Use the non-prefixed version for server-side only
- The system automatically checks both formats

### 3. Restart Development Server

After adding keys, restart your Next.js dev server:

```bash
npm run dev
```

## ✅ FREE APIs (No Keys Required)

These services work without API keys:

- **Open-Meteo** - Weather & Marine data
- **NOAA ERDDAP** - Coral Reef Watch data
- **NOAA Active Storms** - Cyclone tracking
- **NASA GIBS** - Ocean color & turbidity
- **Microsoft Planetary Computer** - Sentinel-2 imagery

## 📋 API Key Status

You can check which keys are configured by importing:

```typescript
import { getAPIKeyStatus } from '@/lib/config/apiKeys';

const status = getAPIKeyStatus();
console.log(status);
// {
//   openWeather: '✅ Configured' | '❌ Missing',
//   copernicusMarine: '✅ Configured' | '❌ Missing',
//   ...
// }
```

## 🔒 Security Notes

- **Never commit `.env.local` to git** - it's already in `.gitignore`
- Use `NEXT_PUBLIC_` prefix for client-side accessible keys
- Server-side keys (without `NEXT_PUBLIC_`) are only available in API routes
- **⚠️ CRITICAL**: `SUPABASE_SERVICE_ROLE_KEY` is server-side ONLY - never use `NEXT_PUBLIC_` prefix
- The service role key has admin privileges - keep it secure and never expose to client code
- All keys default to empty strings if not configured

## 📝 Environment Variable Naming

The config file supports both formats:
- `OPENWEATHER_API_KEY` (server-side)
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` (client-side)

It will check both and use whichever is available.

## 🎯 Usage in Code

```typescript
import { getAPIKeys, hasAPIKey } from '@/lib/config/apiKeys';

// Get all keys
const keys = getAPIKeys();
const openWeatherKey = keys.openWeather;

// Check if key exists
if (hasAPIKey('openWeather')) {
  // Use the key
}
```

## 📦 All Available Keys

| Key Name | Environment Variable | Required | Purpose |
|----------|---------------------|----------|---------|
| `openWeather` | `OPENWEATHER_API_KEY` | No | Weather alerts (optional - we use Open-Meteo) |
| `copernicusMarine` | `COPERNICUS_MARINE_API_KEY` | No | Enhanced marine data |
| `oceanAcidification` | `OCEAN_ACIDIFICATION_API_KEY` | No | pH and acidification data |
| `globalFishingWatch` | `GLOBAL_FISHING_WATCH_API_KEY` | No | Fishing activity tracking |
| `nasa` | `NASA_API_KEY` | No | Enhanced NASA services |
| `sentinelHub` | `SENTINEL_HUB_API_KEY` | No | Sentinel imagery (optional - we use Microsoft PC) |
| `noaa` | `NOAA_API_KEY` | No | Enhanced NOAA services (most are free) |
| `jtwc` | `JTWC_API_KEY` | No | Joint Typhoon Warning Center |
| `supabaseUrl` | `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Database connection |
| `supabaseAnonKey` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Database authentication (client-side) |
| `supabaseServiceRoleKey` | `SUPABASE_SERVICE_ROLE_KEY` | No | Database admin operations (server-side only) |
| `openai` | `OPENAI_API_KEY` | No | AI/ML services |
| `anthropic` | `ANTHROPIC_API_KEY` | No | AI/ML services |
| `mapbox` | `MAPBOX_API_KEY` | No | Enhanced maps (optional - we use OpenStreetMap) |
| `googleMaps` | `GOOGLE_MAPS_API_KEY` | No | Enhanced maps (optional) |

## 🚀 Quick Start

1. Copy `.env.example` to `.env.local`
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```
2. Add your Supabase credentials (required)
3. Add any optional API keys you want to use
4. Restart the dev server

That's it! The system will automatically use the configured keys.

## ✅ Setup Complete

The API keys configuration is now fully set up:
- ✅ `apps/web/src/lib/config/apiKeys.ts` - Centralized configuration file
- ✅ `apps/web/.env.example` - Template file with all available keys
- ✅ `.gitignore` - Protects your `.env.local` from being committed
- ✅ Documentation - Complete setup guide

You're ready to start adding your API keys!


