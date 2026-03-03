# Quick Start — KTV Singer tvOS

## Prerequisites

- **Xcode 15+** (with tvOS SDK)
- **XcodeGen**: `brew install xcodegen`
- **Node.js 20+** (for the Express server)
- **Express server running** at `http://localhost:3000` (or your Mac's local IP)

## 1. Start the Server

```bash
# From project root
npm install          # first time only
npm run dev:server   # starts on port 3000
```

Verify it works:
```bash
curl http://localhost:3000/api/songs
# Should return JSON array of songs
```

## 2. Generate Xcode Project

```bash
cd tvos
xcodegen generate
# Creates KTVSinger.xcodeproj
```

## 3. Open and Run

```bash
open KTVSinger.xcodeproj
```

In Xcode:
1. Select **Apple TV** simulator as destination
2. Press **Cmd+R** to build and run
3. App launches to song browser → tap a song → player with video + lyrics

## Testing on Real Apple TV

### Pair Your Apple TV
1. Apple TV must be on the **same Wi-Fi** as your Mac
2. On Apple TV: Settings → Remotes and Devices → Remote App and Devices
3. In Xcode: Window → Devices and Simulators → find your Apple TV → pair

### Configure Code Signing
1. In Xcode, click KTVSinger project → KTVSinger target → Signing & Capabilities
2. Check "Automatically manage signing"
3. Select your Apple ID team
4. If bundle ID conflicts, change `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml` and regenerate

### Update Server URL
The app defaults to `http://192.168.6.12:3000`. Update for your network:

Edit `tvos/Shared/Networking/APIClient.swift`, line ~37:
```swift
?? "http://YOUR_MAC_IP:3000"
```

Then regenerate and rebuild.

### Deploy
1. Select your Apple TV as the Xcode destination
2. Cmd+R
3. First time: trust the developer on Apple TV (Settings → General → Device Management)

**Note:** Free Apple Developer accounts expire apps after 7 days. Re-deploy from Xcode when needed. For TestFlight/App Store, enroll in the Apple Developer Program ($99/year).

## Project Structure

```
tvos/
├── project.yml                    # XcodeGen spec (edit this, not .pbxproj)
├── KTVSinger.xcodeproj/          # Generated — do not hand-edit
├── KTVSingerApp.swift            # App entry point, TabView (Browse/Favorites/Settings)
├── Info.plist                    # Generated
├── Shared/
│   ├── Models/
│   │   ├── Song.swift            # Song + LyricLine (matches server schema)
│   │   └── DeviceConnection.swift
│   ├── Database/
│   │   └── SupabaseClient.swift  # AppSupabaseClient — auth only
│   ├── Networking/
│   │   ├── APIClient.swift       # HTTP client for Express API
│   │   └── APIError.swift
│   └── Services/
│       └── DevicePairingService.swift
└── Features/
    ├── Player/
    │   ├── Views/PlayerView.swift
    │   ├── ViewModels/PlayerViewModel.swift
    │   └── Services/
    │       ├── YouTubePlayerService.swift  # AVPlayer + stream URL
    │       └── LyricsSyncService.swift     # Lyric timing sync
    ├── SongBrowser/
    │   ├── Views/SongBrowserView.swift
    │   └── ViewModels/SongBrowserViewModel.swift
    ├── Favorites/Views/FavoritesView.swift
    ├── Settings/Views/SettingsView.swift
    ├── Authentication/Views/AuthenticationView.swift
    └── Pairing/Views/PairingView.swift
```

## Key APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/songs` | Fetch all songs |
| `GET /api/songs/:id` | Fetch single song |
| `GET /api/youtube/stream/:videoId` | Extract playable stream URL |
| `GET /api/youtube/search?q=...` | Search YouTube |

## Common Issues

| Problem | Solution |
|---------|----------|
| "Module 'Supabase' not found" | Cmd+Shift+K (clean), then Cmd+B |
| Song cards don't respond to remote | Must use `Button`, not `.onTapGesture` (tvOS focus engine) |
| "Untrusted Developer" on Apple TV | Settings → General → Device Management → Trust |
| No songs appear | Check Express server is running, check APIClient base URL |
| Video plays but no audio | Known issue with ytdl-core format selection |
| Build error about code signing | Set `CODE_SIGN_STYLE: Automatic` in project.yml, regenerate |

## Architecture

```
tvOS App
  │
  ├── APIClient ──→ Express Server (localhost:3000)
  │                    ├── GET /api/songs ──→ Supabase PostgreSQL
  │                    └── GET /api/youtube/stream/:id ──→ ytdl-core ──→ YouTube CDN
  │
  ├── AppSupabaseClient ──→ Supabase Auth (optional, for favorites)
  │
  └── AVPlayer ──→ YouTube CDN (direct stream URL from server)
```
