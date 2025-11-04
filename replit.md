# Hog The Mic - YouTube Karaoke Application

## Overview

Hog The Mic is a web-based karaoke application enabling users to sing along to YouTube videos with synchronized lyrics and real-time vocal performance scoring. It offers an interactive experience with feedback on pitch, timing, and rhythm accuracy, with user authentication and personalized play tracking. Users can log in via Replit Auth (supporting Google, GitHub, X, Apple, and email/password) to track their performances and song history.

## Recent Changes (October 18, 2025)

### Current Session
- **Mobile UI Improvements**: Condensed control buttons to icon-only display on small screens (<md breakpoint)
- **More by Artist Feature**: Added "More by this Artist" section showing up to 3 related songs below the player
- **Playlist System**: Full playlist management system with database schema, API routes, and UI
  - Created `playlists` and `playlistSongs` tables with proper relations
  - Added complete RESTful API for playlist CRUD operations (requires authentication)
  - Built PlaylistManager component with create/delete playlists and add songs functionality
  - Implemented auto-advance feature: automatically plays next song in playlist when current song ends
  - Playlist management accessible via "Playlists" button next to search bar

### Previous Updates
- **User Authentication**: Implemented Replit Auth integration with login/logout UI in header across all pages
- **Database Migration**: Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- **User-Specific Play Tracking**: Added `userSongPlays` table to track each user's song history and play counts
- **UI Updates**: Added user dropdown menu in header showing avatar, name, email, and logout option
- **Backend Routes**: Added auth routes (`/api/auth/user`, `/api/user/plays`, `/api/user/performances`)
- **Lyrics Display**: Changed from word-level to line-level highlighting for easier reading
- **Lyrics Timing Adjustment**: Added adjustable lyrics offset (-20s to +20s) with save feature - settings are shared across all users for each song
- **Demo Songs**: Created three demo songs (two Bruno Mars tracks with synced lyrics, one K-Pop Demon Hunters track)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite, and Wouter for a single-page application (SPA).
- **UI Framework & Styling**: Tailwind CSS, Shadcn/ui (New York variant), and Radix UI for accessible, dark-mode themed components with a neon accent system (cyan, magenta, purple).
- **State Management**: TanStack Query for server state, local React state for UI, and custom hooks for reusable logic (including `useAuth` hook).
- **Key Features**: YouTube IFrame API integration, real-time word-level lyrics synchronization with active line highlighting, Web Audio API for vocal analysis and scoring, "Karaoke Mode" for volume reduction, automatic lyrics persistence via LRCLIB, responsive design, song filtering, and user authentication.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript and ESM for a modern, type-safe API.
- **API Design**: RESTful JSON API with structured error handling and logging.
- **Core API Endpoints**: 
  - `/api/youtube/*` - YouTube interaction and search
  - `/api/songs/*` - Song library management
  - `/api/performances` - Performance scores
  - `/api/lyrics` - LRCLIB integration
  - `/api/auth/user` - Get current logged-in user (requires auth)
  - `/api/user/plays` - Get user's song play counts (requires auth)
  - `/api/user/performances` - Get user's performances (requires auth)
  - `/api/playlists` - Create, read, update, delete playlists (requires auth)
  - `/api/playlists/:id/songs` - Manage songs in playlists (requires auth)
- **Data Storage Strategy**: PostgreSQL database with Drizzle ORM for type-safe queries and schema management.
- **Session & Authentication**: Replit Auth with Express sessions stored in PostgreSQL using `connect-pg-simple`.

### Data Models
- **User Schema**: UUID primary key, email, firstName, lastName, profileImageUrl, timestamps. Managed by Replit Auth.
- **Song Schema**: YouTube video ID, title, artist, thumbnail, genre, gender, year, lyrics (JSON array of time-synced segments), global playCount, lyricsOffset (timing adjustment in seconds, shared across all users), and optional instrumental URLs.
- **UserSongPlay Schema**: Links users to songs with user-specific playCount and lastPlayedAt timestamp for personalized history.
- **Performance Schema**: Links to user and song, with scored metrics (total, pitch, timing, rhythm) and timestamp.
- **Playlist Schema**: UUID primary key, userId (foreign key to users), name, description, timestamps. User-specific playlist collections.
- **PlaylistSong Schema**: Junction table linking playlists to songs with position field for ordering. Supports cascade delete when playlist is removed.
- **Sessions Schema**: PostgreSQL-backed session storage for Replit Auth.

### Authentication System
- **Provider**: Replit Auth supporting Google, GitHub, X (Twitter), Apple, and email/password login.
- **Implementation**: 
  - Backend: `server/replitAuth.ts` sets up OpenID Connect strategy with passport.js
  - Frontend: `useAuth` hook in `client/src/hooks/useAuth.ts` for auth state management
  - UI: Login/logout buttons and user dropdown menu in header components
- **Protected Routes**: Middleware (`isAuthenticated`) protects user-specific endpoints
- **Login/Logout Flow**: `/login` redirects to Replit Auth, `/logout` clears session and redirects home

### Real-Time Audio Processing
- **Vocal Analysis System**: `VocalAnalyzer` class using Web Audio API for microphone input processing, FFT analysis, real-time RMS-based pitch detection, and a scoring algorithm for pitch, timing, and rhythm accuracy. Browser-based analysis minimizes latency.
- **Microphone Monitoring**: Real-time voice monitoring feature routes microphone input to speakers, allowing users to hear themselves while singing.

### Vocal Isolation
- **Gaudio Studio Integration**: Full API infrastructure for Gaudio Studio's AI-powered vocal separation service (`gsep_music_hq_v1`). Includes job creation, status polling, and instrumental URL retrieval. Currently limited to audio file uploads, awaiting YouTube URL support in the API.

## External Dependencies

### Third-Party APIs
- **YouTube Data API v3**: For video search and metadata retrieval, authenticated via Replit Connectors OAuth2.
- **YouTube IFrame Player API**: Client-side library for video playback control and events.
- **Gaudio Studio API (GSEP)**: AI-powered vocal separation service for creating instrumental tracks.
- **LRCLIB API**: For fetching synchronized lyrics.
- **Replit Auth**: Authentication provider via OpenID Connect.

### Database
- **PostgreSQL (via Neon)**: Serverless PostgreSQL using `@neondatabase/serverless` and Drizzle ORM for type-safe queries.

### Development Tools & Services
- **Replit Platform Integration**: Replit Connectors for OAuth, Replit Auth for user authentication, environment-based tokens, and Vite plugins for Replit-specific features.
- **Build & Development Dependencies**: esbuild, TypeScript, PostCSS with Autoprefixer, Drizzle Kit.

### Key Libraries
- **Authentication**: openid-client, passport, passport-local, express-session, connect-pg-simple, memoizee
- **UI & Interaction**: React Hook Form with Zod, date-fns, embla-carousel-react, cmdk, class-variance-authority, clsx, Radix UI Avatar and Dropdown Menu components.
