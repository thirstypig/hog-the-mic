# CLAUDE.md — KTV Singer tvOS

## Overview

Native Apple TV app for KTV Singer. SwiftUI + AVPlayer + Socket.IO.

## Build & Dev

```bash
xcodegen generate    # Regenerate Xcode project from project.yml
# Cmd+R in Xcode to build and run
```

## Key Paths

- `KTVSingerApp.swift` — App entry point
- `project.yml` — XcodeGen spec (source of truth, do not hand-edit .pbxproj)
- `Features/Player/` — Player view, view model, YouTube/lyrics services
- `Features/SongBrowser/` — Home dashboard
- `Features/Pairing/` — QR code pairing + Socket.IO
- `Shared/Networking/APIClient.swift` — HTTP client for Express API
- `Shared/Database/SupabaseClient.swift` — Auth wrapper (`AppSupabaseClient`)
- `Shared/Services/QueueService.swift` — Queue state management

## Rules

- Xcode project generated from `project.yml` — run `xcodegen generate` after changes
- Use `AppSupabaseClient` not `SupabaseClient` (avoid SDK naming conflict)
- Use `Button` not `.onTapGesture` (Siri Remote compat)
- PlayerView uses GeometryReader with proportional sizing
- Bundle ID: `com.ktvsinger.tvos`, deployment target: tvOS 17.0
