# GSDCP Mobile - German Shepherd Dog Club of Pakistan

## Overview
A mobile-first web application for the German Shepherd Dog Club of Pakistan. Built with React + TypeScript frontend and Express backend, imported from Figma design.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI)
- **Backend**: Express 5 (Node.js), TypeScript
- **Routing**: wouter (client-side), Express (server API)
- **State**: TanStack React Query
- **Database**: Drizzle ORM + PostgreSQL (schema defined, using MemStorage currently)
- **Styling**: Tailwind CSS with GSDCP brand colors as CSS variables

## Project Structure
```
client/src/
  components/          # Reusable app widgets
    ui/                # shadcn/ui base components
    AppCard.tsx         # Branded card component
    AppLayout.tsx       # Layout wrapper with BottomNavBar
    BottomNavBar.tsx    # 5-tab bottom navigation
    DogListTile.tsx     # Dog card for lists
    EmptyState.tsx      # Empty state placeholder
    PrimaryButton.tsx   # Branded green button
    SearchInput.tsx     # Styled search input
    SectionHeader.tsx   # Section title with action
  pages/               # Screen components
    DashboardScreen.tsx
    DogSearchScreen.tsx
    DogProfileScreen.tsx
    BreederDirectoryScreen.tsx
    BreederProfileScreen.tsx
    ShowsScreen.tsx
    ShowResultsScreen.tsx
    ProfileScreen.tsx
    LoginRegistration.tsx
  lib/
    constants.ts       # Brand colors, spacing, nav items, app config
    mock-data.ts       # Dummy data for all entities
    queryClient.ts     # React Query client config
    utils.ts           # cn() helper
server/
  index.ts             # Express server entry point
  routes.ts            # API placeholder endpoints
  storage.ts           # Storage interface (MemStorage)
  vite.ts              # Vite dev middleware
  static.ts            # Production static serving
shared/
  schema.ts            # TypeScript types: Dog, Breeder, ShowEvent, ShowResult, UserProfile
```

## Design System
- **Primary**: #0F5C3A (deep green)
- **Dark Green**: #083A24
- **Accent Gold**: #C7A45C
- **Background**: #F5F5F2
- **Rounded Corners**: 10-14px on cards
- **Spacing Scale**: 4, 8, 12, 16, 24, 32px

## Navigation
Bottom navigation with 5 tabs: Home, Dogs, Breeders, Shows, Profile

## Routes
- `/` - Dashboard
- `/login` - Login/Registration
- `/dogs` - Dog Search
- `/dogs/:id` - Dog Profile
- `/breeders` - Breeder Directory
- `/breeders/:id` - Breeder Profile
- `/shows` - Shows listing
- `/shows/:id` - Show Results
- `/profile` - User Profile

## API Endpoints (Placeholders)
- `GET /api/dogs`, `GET /api/dogs/:id`
- `GET /api/breeders`, `GET /api/breeders/:id`
- `GET /api/shows`, `GET /api/shows/:id`
- `GET /api/show-results`, `GET /api/show-results/:showId`
- `GET /api/profile`

## Development
- Server runs on port 5000
- `npm run dev` starts development server
- `npm run build` creates production build
- Currently using mock data; ready to connect to real API
