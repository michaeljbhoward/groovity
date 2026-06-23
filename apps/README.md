# FitTrack - Mobile Fitness Tracking App

A mobile-first fitness tracking application built with React Native (Expo) and Node.js/Express.

## Architecture

```
apps/
  mobile/          React Native (Expo) mobile app
    src/
      App.tsx                 App bootstrap & auth gating
      context/AuthContext.tsx  Auth state management
      navigation/
        AppNavigator.tsx      Bottom tabs + stack screens
        AuthNavigator.tsx     Login/Register flow
      screens/
        LoginScreen.tsx       Email/password login
        RegisterScreen.tsx    Account creation
        FeedScreen.tsx        Activity feed (followed users)
        RecordScreen.tsx      Map-centric activity recording
        ActivityDetailScreen  Activity detail with route, likes, comments
        ActivitySummaryScreen Post-activity summary card
        StatsScreen.tsx       Stats, goals, achievements
        ProfileScreen.tsx     User profile & own activities
        UserProfileScreen.tsx Other user's profile
        NotificationsScreen   Social notifications
      components/
        FeedCard.tsx          Activity summary card for feeds
        Button.tsx            Reusable button component
        StatCard.tsx          Stats display tile
        EmptyState.tsx        Empty list placeholder
      services/
        api.ts                API client (all endpoints)
        location.ts           GPS tracking via expo-location
        activityRecorder.ts   Recording state machine + upload
  backend/           Express/TypeScript API server
    src/
      index.ts        Server entry point
      app.ts          Express app setup & route mounting
      db.ts           SQLite (better-sqlite3) connection
      middleware/
        auth.ts       JWT authentication middleware
      routes/
        auth.ts       Register, login, profile CRUD
        activities.ts Activity CRUD + route points
        feed.ts       Social feed (followed users' activities)
        social.ts     Follow, like, comment + notifications
        users.ts      User search & profile lookup
        stats.ts      Stats, goals, achievements, notifications
    db/
      schema.sql      SQLite DDL (all tables + indexes)
      schema.ts       TypeScript type definitions
    tests/
      auth.test.ts       Auth endpoint tests
      activities.test.ts Activity CRUD + route tests
      feed.test.ts       Feed rendering tests
      social.test.ts     Follow/like/comment + notification tests
```

## Tech Stack

### Mobile
- **React Native** with Expo SDK 51
- **React Navigation** 6 (bottom tabs + native stack)
- **expo-location** for GPS tracking
- **expo-notifications** for push notifications
- **expo-secure-store** for token storage
- **TypeScript** throughout

### Backend
- **Express** 4 with TypeScript
- **better-sqlite3** for persistence (WAL mode)
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT auth
- **express-validator** for input validation
- **Jest** + **Supertest** for API tests

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (or Android/iOS emulator)

### Backend Setup

```bash
cd apps/backend
npm install
npm run dev        # Starts API on http://localhost:3000
```

### Mobile Setup

```bash
cd apps/mobile
npm install
npx expo start     # Opens Expo dev tools
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### Running Tests

```bash
# Backend API tests
cd apps/backend
npm test

# Mobile unit tests
cd apps/mobile
npm test
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/activities` | Create activity (with route) |
| GET | `/api/activities/:id` | Activity detail + route + social |
| GET | `/api/activities` | List activities |
| DELETE | `/api/activities/:id` | Delete activity |
| GET | `/api/feed` | Social feed |
| POST | `/api/social/follow/:userId` | Follow user |
| DELETE | `/api/social/follow/:userId` | Unfollow user |
| POST | `/api/social/like/:activityId` | Like activity |
| DELETE | `/api/social/like/:activityId` | Unlike activity |
| POST | `/api/social/comment/:activityId` | Add comment |
| GET | `/api/social/followers/:userId` | List followers |
| GET | `/api/social/following/:userId` | List following |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:id` | User profile + stats |
| GET | `/api/stats/summary` | Activity stats |
| GET | `/api/stats/goals` | Goals with progress |
| POST | `/api/stats/goals` | Create goal |
| DELETE | `/api/stats/goals/:id` | Delete goal |
| GET | `/api/stats/achievements` | List achievements |
| GET | `/api/stats/notifications` | List notifications |
| PUT | `/api/stats/notifications/read` | Mark all read |

## Features

- **Authentication**: Email/password with JWT tokens stored in secure storage
- **Activity Recording**: GPS route capture with real-time distance, duration, pace display
- **Activity Feed**: Chronological feed of followed users' activities
- **Social**: Follow/unfollow, likes, comments with push notification triggers
- **Stats & Goals**: Weekly/monthly/all-time stats, configurable goals with progress tracking
- **Achievements**: Automatic badge system for activity milestones
- **Mobile-Native UX**: Bottom tab navigation, map-centric recording, optimized feed cards

## Data Model

See `apps/backend/db/schema.sql` for the full SQLite schema covering:
- `users` - Authentication & profiles
- `activities` - Recorded activities with metrics
- `route_points` - GPS coordinates per activity
- `follows` - Social graph
- `likes` / `comments` - Activity interactions
- `goals` - User-defined targets
- `achievements` - Earned badges
- `notifications` - Social interaction alerts
