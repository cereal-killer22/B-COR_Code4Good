# ClimaGuard Monorepo

A cross-platform climate monitoring system with shared components and business logic.

## 🏗️ Project Structure

```
climaGuard/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo React Native mobile app
├── packages/
│   ├── ui/           # Shared UI components
│   └── shared/       # Shared utilities, types, and constants
├── backend/          # Backend services (separate)
└── package.json      # Workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- For mobile development: Expo CLI
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation
```bash
# Install all dependencies
npm install

# Install dependencies with legacy peer deps (if needed)
npm install --legacy-peer-deps
```

### Development

#### Web Application
```bash
# Start web development server
npm run dev:web

# Access at http://localhost:3000
```

#### Mobile Application
```bash
# Start Expo development server
npm run dev:mobile

# Scan QR code with Expo Go app
# Or press 'a' for Android, 'i' for iOS, 'w' for web
```

#### Both Applications
```bash
# Start web app (default)
npm run dev
```

## 📱 Shared Packages

### @climaguard/ui
Reusable UI components that work on both web and mobile:
- `Button` - Cross-platform button component
- `Card` - Container with consistent styling
- `Text` - Typography component with variants

### @climaguard/shared
Shared business logic and utilities:
- **Types**: TypeScript interfaces for climate data, sensors, alerts
- **Utils**: Temperature conversion, date formatting, validation
- **Constants**: App configuration, thresholds, colors

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web development server |
| `npm run dev:web` | Start web development server |
| `npm run dev:mobile` | Start Expo development server |
| `npm run build` | Build all applications |
| `npm run build:web` | Build web application |
| `npm run build:mobile` | Build mobile application |
| `npm run lint` | Lint all packages |
| `npm run type-check` | Type check all packages |

## 🌡️ Features

### Current Features
- ✅ Cross-platform UI components
- ✅ Shared business logic
- ✅ TypeScript support
- ✅ Temperature monitoring interface
- ✅ Responsive design (web)
- ✅ Native mobile interface

### Planned Features
- 🔄 Real-time sensor data
- 🔄 Push notifications
- 🔄 Data visualization
- 🔄 Historical analytics
- 🔄 GPS location tracking
- 🔄 Offline support

## 🎯 Development Workflow

### Adding New Features
1. **Shared Logic**: Add to `packages/shared/`
2. **UI Components**: Add to `packages/ui/`
3. **Web Features**: Add to `apps/web/`
4. **Mobile Features**: Add to `apps/mobile/`

### Code Sharing Strategy
- **Components**: Use `@climaguard/ui` for reusable UI
- **Business Logic**: Use `@climaguard/shared` for utilities
- **Platform-specific**: Keep in respective app directories

## 📦 Package Dependencies

### Workspace Dependencies
- React 18.2+ (shared across platforms)
- TypeScript 5+ (development)
- Expo SDK 54+ (mobile)
- Next.js 14+ (web)

### Development Tools
- ESLint (linting)
- TypeScript (type checking)
- Tailwind CSS (web styling)
- React Native StyleSheet (mobile styling)

## 🔧 Configuration

### TypeScript
Each package has its own `tsconfig.json` with appropriate settings for web/mobile/shared code.

### Styling
- **Web**: Tailwind CSS + shared components
- **Mobile**: React Native StyleSheet + shared components
- **Shared**: Platform-agnostic styling through components

## 🚀 Deployment

### Web Application
```bash
npm run build:web
# Deploy apps/web/.next to your hosting provider
```

### Mobile Application
```bash
# Build for production
npm run build:mobile

# Build standalone apps
cd apps/mobile
expo build:android
expo build:ios
```

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📄 License

This project is part of the ClimaGuard ecosystem.