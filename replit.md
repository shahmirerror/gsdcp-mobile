# GSDCP Mobile - German Shepherd Dog Club of Pakistan

## Overview
A mobile app for the German Shepherd Dog Club of Pakistan built with Expo (React Native). Runs as a web preview in Replit and can be built for iOS/Android using Expo's build service.

## Tech Stack
- **Mobile Framework**: Expo SDK 52, React Native 0.76
- **Navigation**: React Navigation 7 (bottom tabs + native stack)
- **State**: TanStack React Query v5
- **Icons**: @expo/vector-icons (Ionicons)
- **API**: Direct calls to `https://gsdcp.org/api/mobile`

## Project Structure
```
mobile/
  App.tsx                  # Root app component with providers
  index.js                 # Expo entry point
  app.json                 # Expo configuration
  metro.config.js          # Metro bundler config
  babel.config.js          # Babel config with reanimated plugin
  assets/                  # App icons and splash
  src/
    navigation/
      AppNavigator.tsx     # Bottom tabs + Dogs stack navigator
    screens/
      DashboardScreen.tsx  # Home with quick actions, featured dogs
      DogSearchScreen.tsx  # Searchable/filterable dog list
      DogProfileScreen.tsx # Dog details, pedigree tree, show results
      BreederDirectoryScreen.tsx  # Placeholder
      ShowsScreen.tsx      # Placeholder
      ProfileScreen.tsx    # User profile/settings
    components/
      DogListItem.tsx      # Dog card for FlatList
      PedigreeTree.tsx     # 4-generation pedigree with clickable ancestors
    lib/
      api.ts               # API functions and TypeScript types
      theme.ts             # GSDCP brand colors, spacing, typography

client/                    # Legacy web app (React + Vite)
server/                    # Legacy Express backend (API proxy)
shared/
  schema.ts                # Shared TypeScript types
```

## Design System
- **Primary**: #0F5C3A (deep green)
- **Dark Green**: #083A24
- **Accent Gold**: #C7A45C
- **Background**: #F5F5F2
- **Sire (male)**: Blue tint
- **Dam (female)**: Pink tint

## Navigation
Bottom tab navigation with 5 tabs: Home, Dogs, Breeders, Shows, Profile
Dogs tab has a nested stack navigator for Dog Search → Dog Profile

## API (Direct from gsdcp.org)
- `GET /api/mobile/dogs` — Dog list
- `GET /api/mobile/dogs/{id}` — Dog detail with pedigree and show results

## Pedigree
- 4-generation tree displayed in a horizontal scrollable layout
- Each ancestor cell is clickable — navigates to dog search with that name
- Sire cells are blue-tinted, dam cells are pink-tinted
- API returns `pedigree` as either `[]` (no data) or object with `gen1`-`gen4` keys

## Dog Fields (nullable)
`KP`, `dob`, `color`, `imageUrl`, `owner`, `breeder`, `sire`, `dam`, `microchip`

## Development
- Workflow runs `cd mobile && npx expo start --web --port 5000`
- Preview available in Replit webview
- To build for devices: use `expo build` or EAS Build
- QR code in terminal can be scanned with Expo Go app on physical device

## Building for Production
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure: `eas build:configure`
3. Build Android: `eas build --platform android`
4. Build iOS: `eas build --platform ios`
