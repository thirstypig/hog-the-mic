# KTV Singer Architecture Diagrams

## System Architecture

> **Updated March 2, 2026**: tvOS app now fetches songs from the Express API
> (not Supabase directly). Supabase is auth-only on the client.

```
┌──────────────────────────────────────────────────────────────────┐
│                         tvOS App (Main)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browse    │  │   Player    │  │  Favorites  │              │
│  │   Songs     │  │   Screen    │  │   Screen    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                  │                     │
│         └────────────────┴──────────────────┘                     │
│                          │                                        │
│                          ▼                                        │
│         ┌────────────────────────────────┐                       │
│         │     Feature ViewModels         │                       │
│         │  (Business Logic & State)      │                       │
│         └────────────────────────────────┘                       │
│                          │                                        │
│    ┌─────────────────────┼─────────────────────┐                 │
│    │                     │                     │                  │
│    ▼                     ▼                     ▼                  │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐            │
│  │ Supabase │    │  APIClient  │    │  YouTube     │            │
│  │ (auth    │    │  (songs,    │    │  Player      │            │
│  │  only)   │    │   search)   │    │  (AVPlayer)  │            │
│  └──────────┘    └─────────────┘    └──────────────┘            │
│        │                │                    │                    │
└────────┼────────────────┼────────────────────┼───────────────────┘
         │                │                    │
         │                ▼                    │
         │    ┌─────────────────────┐          │
         │    │   Express Server    │          │
         │    │   (Node.js API)     │◄─────────┘
         │    │                     │  stream URL
         │    │  GET /api/songs     │
         │    │  GET /api/youtube/* │
         │    └─────────────────────┘
         │                │
         │                ▼
         │    ┌─────────────────────┐
         ▼    │  Supabase           │
┌─────────────│  PostgreSQL         │
│  Supabase   │  (song data)       │
│  Auth       └─────────────────────┘
└─────────────┘
```

## Multi-Device Architecture

```
                    ┌──────────────────────┐
                    │   Supabase Cloud     │
                    │  (Database + Auth)   │
                    └──────────────────────┘
                              ▲
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   tvOS App  │  │  iOS App    │  │ Android App │
    │  (Display)  │  │ (Microphone)│  │ (Microphone)│
    └─────────────┘  └─────────────┘  └─────────────┘
              ▲               │               │
              │               │               │
              │    WebSocket  │               │
              └───────────────┴───────────────┘
                   (Audio + Sync)


Pairing Flow:
─────────────

   tvOS                            iOS/Android
    │                                   │
    │  1. Generate QR Code              │
    │  ┌──────────────┐                 │
    │  │  Session ID  │                 │
    │  │  Server URL  │                 │
    │  │  Port: 8765  │                 │
    │  └──────────────┘                 │
    │         │                         │
    │         └────────────────────────>│ 2. Scan QR
    │                                   │
    │<──────────────────────────────────│ 3. Connect via WebSocket
    │         Connection Request        │
    │                                   │
    │──────────────────────────────────>│ 4. Accept Connection
    │         Connection Accepted       │
    │                                   │
    │<══════════════════════════════════│ 5. Stream Audio
    │         Audio Data Packets        │
    │                                   │
    │══════════════════════════════════>│ 6. Sync Playback State
    │      Current Time, Song Info      │
    │                                   │
```

## Feature Module Structure

```
┌───────────────────────────────────────────────────────────┐
│                     Feature: Player                        │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Views/                     (SwiftUI Views)                │
│  ├── PlayerView.swift       Main player screen            │
│  └── LyricsView.swift       Optional: separate component  │
│                                                            │
│  ViewModels/               (Business Logic)                │
│  └── PlayerViewModel.swift  Coordinates services          │
│                                                            │
│  Services/                 (Feature-specific logic)        │
│  ├── YouTubePlayerService.swift   Video playback          │
│  └── LyricsSyncService.swift      Lyrics timing           │
│                                                            │
│  Models/                   (Feature-specific models)       │
│  └── (Uses shared Song model)                             │
│                                                            │
└───────────────────────────────────────────────────────────┘
                              │
                              │ Clean boundaries
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   Feature: Song Browser                    │
├───────────────────────────────────────────────────────────┤
│  Views/                                                    │
│  └── SongBrowserView.swift                                │
│                                                            │
│  ViewModels/                                               │
│  └── SongBrowserViewModel.swift                           │
│                                                            │
│  (No services - uses shared SupabaseClient)               │
└───────────────────────────────────────────────────────────┘
```

## Data Flow - Playing a Song

```
User taps song card
       │
       ▼
┌─────────────────┐
│  SongBrowserView│  (SwiftUI View)
└─────────────────┘
       │
       │ selectedSong = song
       ▼
┌─────────────────┐
│   PlayerView    │  (SwiftUI View)
└─────────────────┘
       │
       │ init(song: Song)
       ▼
┌─────────────────┐
│ PlayerViewModel │  (Observable Object)
└─────────────────┘
       │
       ├──────────────────────┬────────────────────┐
       ▼                      ▼                    ▼
┌──────────────┐   ┌───────────────────┐   ┌──────────────┐
│ LyricsSync   │   │ YouTubePlayer     │   │  Supabase    │
│ Service      │   │ Service           │   │  Client      │
└──────────────┘   └───────────────────┘   └──────────────┘
       │                      │                    │
       │ Load lyrics          │ Load video         │ Track play
       │                      │                    │
       ▼                      ▼                    ▼
┌──────────────┐   ┌───────────────────┐   ┌──────────────┐
│ Sync timing  │   │ AVPlayer          │   │ Playback     │
│ with video   │   │ (System)          │   │ History      │
└──────────────┘   └───────────────────┘   └──────────────┘
       │                      │
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
           ┌─────────────┐
           │ Update UI   │
           │ in real-time│
           └─────────────┘
```

## Lyrics Synchronization Algorithm

```
Input: 
  - Current playback time
  - Lyrics offset (user adjustment)
  - List of lyric lines with timestamps

Process:
  ┌────────────────────────────────────┐
  │ 1. Adjust time by offset           │
  │    adjustedTime = time + offset    │
  └────────────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────┐
  │ 2. Find active line                │
  │    where line.startTime <= time    │
  │    and line.endTime > time         │
  └────────────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────┐
  │ 3. Estimate word timing            │
  │    (if no word-level timestamps)   │
  │    duration = line.duration        │
  │    words = line.text.split(" ")    │
  │    wordDuration = duration / count │
  └────────────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────┐
  │ 4. Find active word                │
  │    within active line              │
  └────────────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────┐
  │ 5. Publish to UI                   │
  │    @Published activeLine           │
  │    @Published activeWord           │
  └────────────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────┐
  │ 6. Auto-scroll to active line      │
  │    ScrollViewReader.scrollTo()     │
  └────────────────────────────────────┘

Example Timeline:
─────────────────────────────────────────────────────────────
Time:     0s        3s        6s        9s        12s
          │─────────│─────────│─────────│─────────│
Lines:    │ Line 1  │ Line 2  │ Line 3  │ Line 4  │
          │         │         │         │         │
Offset:   │◄─ +2s ─►│         │         │         │
          │         │         │         │         │
Adjusted: │    -2s  │    1s   │    4s   │    7s   │
          │         │         │         │         │
Active:   │ (none)  │ Line 1  │ Line 2  │ Line 3  │
─────────────────────────────────────────────────────────────
```

## Authentication Flow

```
┌──────────────────┐
│  App Launch      │
└──────────────────┘
         │
         ▼
    ┌─────────┐
    │ Supabase│  Check session
    │ Client  │
    └─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│Valid │  │ No   │
│Token │  │Token │
└──────┘  └──────┘
    │         │
    │         ▼
    │    ┌──────────────────┐
    │    │  Show Auth Screen│
    │    └──────────────────┘
    │         │
    │         ▼
    │    ┌──────────────────┐
    │    │ User Signs In/Up │
    │    └──────────────────┘
    │         │
    │         ▼
    │    ┌──────────────────┐
    │    │ Supabase.auth    │
    │    │ .signIn()        │
    │    └──────────────────┘
    │         │
    └─────────┴────────┐
                       │
                       ▼
            ┌──────────────────┐
            │  Session Token   │
            │  (auto-refresh)  │
            └──────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │   Show Main App  │
            │  (Song Browser)  │
            └──────────────────┘
```

## Supabase Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                        Songs Table                           │
├─────────────────────────────────────────────────────────────┤
│  Policy: "Anyone can view"                                   │
│  SELECT: true (public read)                                  │
│                                                              │
│  Policy: "Authenticated users can insert"                   │
│  INSERT: auth.role() = 'authenticated'                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    User Favorites Table                      │
├─────────────────────────────────────────────────────────────┤
│  Policy: "Users see only their favorites"                   │
│  SELECT: auth.uid() = user_id                               │
│                                                              │
│  Policy: "Users manage their favorites"                     │
│  INSERT/DELETE: auth.uid() = user_id                        │
└─────────────────────────────────────────────────────────────┘

Example:
─────────
User A (id: 123) tries to access favorites:
  Query: SELECT * FROM user_favorites
  RLS Filter: WHERE user_id = '123'
  Result: Only User A's favorites ✓

User A tries to access User B's favorites:
  Query: SELECT * FROM user_favorites WHERE user_id = '456'
  RLS Filter: WHERE user_id = '123'
  Result: Empty (blocked by RLS) ✓
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Production Setup                         │
└──────────────────────────────────────────────────────────────┘

              ┌─────────────────┐
              │   Apple TV      │
              │   (tvOS App)    │
              └─────────────────┘
                      │
                      │ HTTPS
                      ▼
         ┌────────────────────────┐
         │    Supabase Cloud      │
         │  ┌──────────────────┐  │
         │  │   PostgreSQL     │  │
         │  │   (Database)     │  │
         │  └──────────────────┘  │
         │  ┌──────────────────┐  │
         │  │   Auth Service   │  │
         │  └──────────────────┘  │
         │  ┌──────────────────┐  │
         │  │  Realtime Server │  │
         │  └──────────────────┘  │
         └────────────────────────┘
                      ▲
                      │ HTTPS
                      │
              ┌───────┴────────┐
              │                │
        ┌─────────┐      ┌─────────┐
        │  iPhone │      │ Android │
        │   App   │      │   App   │
        └─────────┘      └─────────┘

              Optional:
         ┌────────────────┐
         │   Your Node.js │
         │     Server     │
         │  (YouTube API) │
         └────────────────┘
                │
                ▼
         ┌────────────────┐
         │  YouTube API   │
         └────────────────┘
```

## File Dependencies Graph

```
KTVSingerApp.swift
    │
    ├── ContentView.swift
    │      │
    │      ├── SongBrowserView.swift
    │      │      │
    │      │      └── SongBrowserViewModel.swift
    │      │             │
    │      │             └── SupabaseClient.swift
    │      │                    │
    │      │                    └── Song.swift
    │      │
    │      ├── PlayerView.swift
    │      │      │
    │      │      └── PlayerViewModel.swift
    │      │             │
    │      │             ├── YouTubePlayerService.swift
    │      │             │
    │      │             └── LyricsSyncService.swift
    │      │                    │
    │      │                    └── Song.swift
    │      │
    │      ├── FavoritesView.swift
    │      │      │
    │      │      └── SupabaseClient.swift
    │      │
    │      └── SettingsView.swift
    │             │
    │             └── SupabaseClient.swift
    │
    ├── AuthenticationView.swift
    │      │
    │      └── SupabaseClient.swift
    │
    └── PairingView.swift
           │
           └── DevicePairingService.swift
                  │
                  └── DeviceConnection.swift
```

## Build & Run Flow

```
1. Xcode Build
   ┌────────────────────┐
   │ Swift Compiler     │
   │ (type checking)    │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ SwiftUI Compiler   │
   │ (view hierarchy)   │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Link Frameworks    │
   │ (AVKit, Network)   │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Package Resolution │
   │ (Supabase Swift)   │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Code Signing       │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Deploy to Device   │
   └────────────────────┘

2. App Launch
   ┌────────────────────┐
   │ @main entry point  │
   │ KTVSingerApp.swift │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Initialize Services│
   │ - SupabaseClient   │
   │ - PairingService   │
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │ Check Auth State   │
   └────────────────────┘
            │
       ┌────┴────┐
       │         │
       ▼         ▼
  ┌──────┐  ┌────────────┐
  │ Auth │  │ Main App   │
  │ View │  │ (Browser)  │
  └──────┘  └────────────┘
```

---

These diagrams show the complete architecture of your KTV Singer tvOS app!
