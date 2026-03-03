# Development Log - KTV Singer tvOS Port

## Project Overview
Port of React Native KTV Singer karaoke app to native tvOS using Swift, SwiftUI, and Supabase.

**Started:** March 2, 2026
**Status:** In Active Development - Phase 1 (Setup)

---

## 📅 Development Timeline

### Session 1: Initial Port & Architecture (March 2, 2026)

#### ✅ Completed

**Project Architecture**
- ✅ Designed feature module isolation architecture
- ✅ Established MVVM pattern throughout
- ✅ Created 16 Swift source files (~3,000 lines)
- ✅ Created 9 comprehensive documentation files
- ✅ Set up project structure for tvOS + future iOS companion

**Documentation Created**
- ✅ INDEX.md - Navigation and overview
- ✅ README-TVOS.md - Project overview
- ✅ QUICK_START.md - Fast-track setup guide
- ✅ PROJECT_SETUP.md - Detailed Xcode setup
- ✅ SUPABASE_SETUP.md - Database schema and config
- ✅ SUMMARY.md - React Native comparison
- ✅ ARCHITECTURE.md - System diagrams
- ✅ CHECKLIST.md - Implementation tasks
- ✅ DEVELOPMENT_LOG.md - This file!

**Code Files Created**
- ✅ Shared/Models/Song.swift
- ✅ Shared/Models/DeviceConnection.swift
- ✅ Shared/Database/SupabaseClient.swift
- ✅ Shared/Services/DevicePairingService.swift
- ✅ Features/Player/Views/PlayerView.swift
- ✅ Features/Player/ViewModels/PlayerViewModel.swift
- ✅ Features/Player/Services/LyricsSyncService.swift
- ✅ Features/Player/Services/YouTubePlayerService.swift
- ✅ Features/SongBrowser/Views/SongBrowserView.swift
- ✅ Features/SongBrowser/ViewModels/SongBrowserViewModel.swift
- ✅ Features/Authentication/Views/AuthenticationView.swift
- ✅ Features/Favorites/Views/FavoritesView.swift
- ✅ Features/Settings/Views/SettingsView.swift
- ✅ Features/Pairing/Views/PairingView.swift
- ✅ tvOS/KTVSingerApp.swift
- ✅ Package.swift

**Features Ported from React Native**
- ✅ PlayerScreen.tsx → PlayerView.swift
- ✅ useLyricsSync hook → LyricsSyncService.swift
- ✅ estimateWordTiming() → Built into LyricsSyncService
- ✅ Lyrics offset adjustment controls
- ✅ Side-by-side video + lyrics layout
- ✅ Auto-scrolling lyrics

**Backend Setup**
- ✅ Created Supabase project
- ✅ Configured database schema (songs, user_favorites, playback_history, user_preferences)
- ⚠️ tvOS tables were dropped on March 3, 2026 during server migration from Neon → Supabase (shared database). Drizzle ORM now owns the schema. tvOS will need to use the Drizzle-managed tables.
- ✅ Set up Row Level Security (RLS) policies
- ✅ Enabled email authentication
- ✅ Configured Sign in with Apple (JWT generation)
- ✅ Retrieved Project URL and API keys

**Apple Developer Account Setup**
- ✅ Registered App ID: `com.yourcompany.ktvsinger`
- ✅ Enabled capabilities: Sign in with Apple, Associated Domains, Network Extensions
- ✅ Created Service ID for authentication
- ✅ Generated private key (.p8 file)
- ✅ Generated JWT for Supabase
- ✅ Configured Sign in with Apple in Supabase

#### 🔄 In Progress

**Xcode Project Setup**
- ⏳ Creating new tvOS project in Xcode
- ⏳ Adding Supabase Swift package dependency
- ⏳ Setting environment variables
- ⏳ Copying Swift source files into project
- ⏳ Initial build and testing

**Authentication**
- ✅ Apple Sign In configured
- ✅ Google Sign In configured (device flow for tvOS)
- ⏳ Testing authentication flow

#### 📋 Next Steps

**Immediate (Today)**
1. Complete Xcode project setup
2. Add all Swift files to project
3. Configure Google Sign In
4. Build and test authentication
5. Verify Supabase connection

**Phase 2 (Next Session)**
1. Implement YouTube URL extraction backend
2. Test player with actual video playback
3. Verify lyrics synchronization
4. Test favorites functionality
5. End-to-end testing

**Phase 3 (Future)**
1. Create iOS companion app target
2. Implement QR code scanner
3. Add microphone capture
4. Implement audio streaming
5. Multi-device testing

---

## 🎯 Architecture Decisions

### Why Feature Module Isolation?

**Decision:** Organize code by feature (Player, Browser, etc.) rather than layer (Views, ViewModels)

**Reasoning:**
- Each feature is self-contained and independently testable
- Multiple developers can work on different features without conflicts
- Easy to reuse features across iOS and tvOS
- Clear boundaries between features
- Easier to add/remove features

**Structure:**
```
Features/
  Player/
    ├── Views/
    ├── ViewModels/
    └── Services/
  SongBrowser/
    ├── Views/
    └── ViewModels/
```

### Why Supabase Over Node.js?

**Decision:** Use Supabase for database, auth, and real-time; keep Node.js for YouTube API

**Reasoning:**
- Supabase provides built-in authentication (less code to maintain)
- PostgreSQL with auto-generated REST API
- Real-time subscriptions out of the box
- Type-safe Swift client
- Free tier is generous
- BUT: Keep Node.js for YouTube URL extraction (it's better at this)

**Hybrid Approach:**
```
[tvOS App] → [Supabase] (database, auth)
           → [Node.js]   (YouTube URLs)
```

### Why MVVM Pattern?

**Decision:** Use Model-View-ViewModel architecture

**Reasoning:**
- Clear separation of concerns
- ViewModels are easily testable (no UI dependencies)
- Works naturally with SwiftUI's reactive patterns
- Industry standard for Swift/SwiftUI apps
- Easy to understand for team members

**Flow:**
```
View (SwiftUI) 
  → ViewModel (Business Logic) 
    → Service (Data/Network)
```

### Why Swift Concurrency?

**Decision:** Use async/await throughout instead of Combine publishers or callbacks

**Reasoning:**
- Modern, cleaner syntax
- Better error handling
- Easier to read and maintain
- Built-in to Swift 5.5+
- Reduces callback hell

---

## 🐛 Issues & Solutions

### Issue #1: Supabase Sign in with Apple Configuration

**Problem:** Supabase "Secret Key" field rejected raw .p8 private key with error "Secret key is not a correctly generated JWT"

**Root Cause:** Supabase requires a JWT generated FROM the private key, not the raw key itself

**Solution:** Created Node.js script to generate JWT with ES256 algorithm:
- Set algorithm to ES256 (not RS256)
- Include Team ID, Key ID, Service ID
- Set proper audience: `https://appleid.apple.com`
- Generate with 180-day expiration (Apple's max)

**Script:** `generate-apple-jwt.js` (to be added to Node.js backend)

**Status:** ✅ Resolved

**Learnings:**
- Apple Sign In requires specific JWT format
- JWT.io can work but easy to misconfigure
- Node.js script is most reliable method
- JWT expires after 180 days (need calendar reminder)

---

### Issue #2: Understanding File Organization in Xcode

**Problem:** Initial confusion about where files are created vs. where they exist

**Root Cause:** In Xcode environment, I can only see files user explicitly opens

**Solution:** 
- Created comprehensive INDEX.md to navigate all files
- Listed all 16 source files with paths
- Provided complete file tree diagram

**Status:** ✅ Resolved

**Learnings:**
- Always provide clear file navigation
- Use INDEX.md as single source of truth
- Include file trees in documentation

---

### Issue #3: Google Sign In on tvOS

**Problem:** tvOS doesn't have a browser or keyboard for traditional OAuth

**Root Cause:** tvOS is a "limited input device" - can't use standard web OAuth flow

**Solution:** Implemented Google's device flow (TV & Limited Input Devices):
- User gets a code on TV (e.g., "ABCD-1234")
- User goes to google.com/device on phone/computer
- User enters code
- TV polls Google API and auto-signs in when complete

**Implementation:**
- Created OAuth client for "TV and Limited Input devices" in Google Cloud Console
- Also created Web OAuth client for Supabase integration
- Added `signInWithGoogleDeviceFlow()` method to SupabaseClient
- Added `pollGoogleAuthentication()` for background polling
- Created `GoogleDeviceCodeView` to display code to user
- Used Task for async polling without blocking UI

**Status:** ✅ Resolved (code ready, needs testing)

**Learnings:**
- tvOS requires special OAuth flows
- Google device flow is perfect for TV apps
- Polling can be done with async/await Task
- User experience: Show big code + clear instructions
- Need both TV client and Web client IDs for full flow

---

## 🔬 Compound Engineering Practices

### Learning & Understanding Focus

We're prioritizing:

1. **Understanding Each Component**
   - Not just copying code, but understanding WHY
   - Explaining architecture decisions
   - Documenting reasoning

2. **Catching Issues Early**
   - Testing as we go (not big-bang at end)
   - Building incrementally
   - Verifying each step before moving forward

3. **Clean Code Practices**
   - Type safety throughout
   - Proper error handling
   - Clear naming conventions
   - Inline documentation

4. **Sustainable Development**
   - Creating reusable components
   - Feature isolation for maintainability
   - Comprehensive documentation for future reference

### Current Learning Path

**Phase 1: Foundation** (Current)
- Understanding Supabase setup
- Learning Apple Developer account configuration
- Understanding JWT generation for Sign in with Apple
- Xcode project structure

**Phase 2: Implementation**
- Swift concurrency patterns
- SwiftUI view lifecycle
- tvOS focus engine
- AVKit video playback

**Phase 3: Advanced**
- Multi-device communication
- WebSocket real-time sync
- Audio streaming
- Performance optimization

---

## 📊 Progress Tracking

### Overall Project: 15% Complete

#### Setup & Architecture: 90% ✅
- [x] Architecture design
- [x] Documentation
- [x] Source code creation
- [x] Supabase setup
- [x] Apple Developer setup
- [ ] Xcode project setup (in progress)

#### Core Features: 0%
- [ ] Authentication (UI ready, needs testing)
- [ ] Song browsing (UI ready, needs testing)
- [ ] Player (UI ready, needs YouTube backend)
- [ ] Lyrics sync (logic ready, needs testing)
- [ ] Favorites (UI ready, needs testing)

#### Multi-Device: 0%
- [ ] QR pairing (UI ready)
- [ ] iOS companion app
- [ ] Audio streaming
- [ ] Real-time sync

#### Polish: 0%
- [ ] Error handling testing
- [ ] Performance optimization
- [ ] UI refinements
- [ ] User testing

---

## 🔄 Active Decisions Log

### Current Decision Point: Google Sign In

**Question:** Should we add Google Sign In alongside Apple Sign In?

**Decision Made:** ✅ Yes, implement with device flow for tvOS

**Reasoning:**
- Provides more user options
- Required for Android companion support
- Device flow is perfect for TV (no keyboard/browser needed)
- User-friendly: shows code on TV, enter on phone

**Implementation:**
- Using Google's "TV and Limited Input Devices" OAuth flow
- Created both TV client and Web client in Google Cloud
- Device flow: TV shows code → user enters on phone → TV auto-signs in
- Background polling with Swift async/await
- Clear UI with large code display

**Status:** ✅ Implemented (needs testing)

---

## 📝 Notes & Observations

### Code Quality
- All Swift files use modern Swift 5.9+ features
- 100% type-safe (no `Any` types)
- Proper error handling with Swift's Result/throws
- Using actors for thread safety where needed
- SwiftUI previews on all views

### Documentation Quality
- 9 comprehensive markdown files
- Clear navigation with INDEX.md
- Step-by-step guides
- Visual diagrams in ARCHITECTURE.md
- Real code examples throughout

### Testing Strategy (To Implement)
- Unit tests for ViewModels
- Integration tests for Services
- UI tests for critical flows
- Performance tests for lyrics sync

---

## 🎯 Success Metrics

### MVP Launch Criteria
- [ ] User can sign up/sign in
- [ ] User can browse songs
- [ ] User can play a song with video
- [ ] Lyrics sync correctly with ±0.5s accuracy
- [ ] User can adjust lyrics offset
- [ ] User can favorite songs
- [ ] App runs smoothly on Apple TV (60fps)
- [ ] No crashes during normal use

### Full Launch Criteria
- [ ] iOS companion app works
- [ ] QR pairing works
- [ ] Audio streaming from iPhone works
- [ ] Multi-device sync works
- [ ] Performance is excellent (<80MB memory)
- [ ] App Store ready (icons, screenshots, description)
- [ ] Privacy policy and terms of service

---

## 🤔 Open Questions

1. **YouTube Backend:** Should we use Node.js, Supabase Edge Functions, or third-party service?
2. **Lyrics Source:** How will we populate lyrics? Manual entry, API, scraping?
3. **iOS Companion:** Should it also be standalone karaoke app, or microphone-only?
4. **Android Support:** Full app or just microphone companion?
5. **Monetization:** Free with ads, premium subscription, or one-time purchase?

---

## 📚 Resources Used

### Apple Documentation
- Sign in with Apple: https://developer.apple.com/sign-in-with-apple/
- SwiftUI tvOS: https://developer.apple.com/documentation/swiftui/
- AVKit: https://developer.apple.com/documentation/avkit/

### Supabase
- Swift SDK: https://github.com/supabase/supabase-swift
- Auth Docs: https://supabase.com/docs/guides/auth

### Tools
- Xcode 15.0+
- Supabase Dashboard
- Apple Developer Portal
- JWT.io for token generation

---

## 🎉 Milestones

- ✅ **March 2, 2026** - Project kicked off, architecture designed
- ✅ **March 2, 2026** - All source files created (~3,000 lines)
- ✅ **March 2, 2026** - Supabase project configured
- ✅ **March 2, 2026** - Apple Sign In configured
- ⏳ **March 2, 2026** - Xcode project setup (in progress)
- 🎯 **Target: March 3, 2026** - First successful build
- 🎯 **Target: March 3, 2026** - Authentication working
- 🎯 **Target: March 4, 2026** - Song browsing working
- 🎯 **Target: March 5, 2026** - Video playback working
- 🎯 **Target: March 10, 2026** - MVP complete

---

## 💡 Ideas for Future

- Voice effects (echo, reverb, pitch shift)
- Performance recording and playback
- Social features (share recordings)
- Leaderboards and scoring
- Custom playlists
- Offline mode
- Song recommendations based on history
- Duet mode (two microphones)
- Party mode (queue management)
- Lyrics editing interface

---

---

### Session 2: Working MVP — Compilation, Data Alignment, Streaming (March 2, 2026)

#### Goal
Get the tvOS app to a working state: compiles, launches to song browser (no auth gate), loads songs from Express API, plays YouTube video via AVPlayer.

#### Completed

**Phase 0: Fix Compilation & Remove Auth Gate**
- Fixed `DevicePairingService.swift` — added `import UIKit` for `UIImage`/`UIDevice`
- Fixed `SupabaseClient.swift` — removed `fatalError` when env vars missing; now optional init (server-only mode)
- Removed auth gate from `KTVSingerApp.swift` — app always shows TabView (Browse, Favorites, Settings)
- Added `notConfigured` error case to `SupabaseError`

**Phase 1: Data Layer Alignment**
- Created `Shared/Networking/APIClient.swift` — HTTP client targeting Express server at localhost:3000
- Created `Shared/Networking/APIError.swift` — typed error enum
- Rewrote `Song.swift` to match server schema (String id, snake_case fields, simplified LyricLine with `time`+`text`)
- Updated `LyricsSyncService.swift` — works with new `LyricLine.time` (not `startTime`/`endTime`)
- Updated `SongBrowserViewModel.swift` — uses `APIClient` instead of `SupabaseClient` for songs
- Updated `PlayerViewModel.swift` — sets per-song lyrics offset from server
- Updated `SongBrowserView.swift` — uses `song.thumbnailImageURL`, `song.genre` (non-optional), `song.year`
- Updated `PlayerView.swift` — added "Try Again" button in error state
- Updated `FavoritesView.swift` — shows sign-in prompt when Supabase not configured
- Updated `SettingsView.swift` — shows server API URL, handles no-auth state
- Trimmed `SupabaseClient` — removed song CRUD methods, kept auth + favorites only
- Changed favorite methods to use `String` song IDs (matching server schema)

**Phase 2: YouTube Streaming**
- Created `server/features/streaming/` feature module (3 files: index, routes, service)
- `GET /api/youtube/stream/:videoId` — extracts playable stream URL via `@distube/ytdl-core`
- Prefers combined mp4 formats for AVPlayer compatibility
- In-memory cache with 4-hour TTL (YouTube URLs expire ~6hrs)
- Registered streaming routes in `server/routes.ts`
- Installed `@distube/ytdl-core` dependency
- Updated `YouTubePlayerService.swift` — uses `APIClient.shared.getStreamURL()` instead of placeholder URL
- Server TypeScript compiles cleanly (`npx tsc --noEmit` passes)

**Architecture Decision: tvOS → Express API (not direct Supabase)**
- Songs now flow: tvOS → Express API → Supabase PostgreSQL
- Supabase client on tvOS is auth-only (sign in, favorites RLS)
- This matches the mobile app's architecture
- Updated ARCHITECTURE.md diagram

#### Files Changed (17 total)

New files (5):
- `tvos/Shared/Networking/APIClient.swift`
- `tvos/Shared/Networking/APIError.swift`
- `server/features/streaming/index.ts`
- `server/features/streaming/streaming.routes.ts`
- `server/features/streaming/streaming.service.ts`

Modified files (12):
- `tvos/KTVSingerApp.swift`
- `tvos/Shared/Database/SupabaseClient.swift`
- `tvos/Shared/Services/DevicePairingService.swift`
- `tvos/Shared/Models/Song.swift`
- `tvos/Features/Player/Services/LyricsSyncService.swift`
- `tvos/Features/Player/Services/YouTubePlayerService.swift`
- `tvos/Features/Player/Views/PlayerView.swift`
- `tvos/Features/Player/ViewModels/PlayerViewModel.swift`
- `tvos/Features/SongBrowser/Views/SongBrowserView.swift`
- `tvos/Features/SongBrowser/ViewModels/SongBrowserViewModel.swift`
- `tvos/Features/Favorites/Views/FavoritesView.swift`
- `server/routes.ts`

New dependency: `@distube/ytdl-core`

---

**Last Updated:** March 2, 2026
**Next Review:** After first successful build in Xcode
