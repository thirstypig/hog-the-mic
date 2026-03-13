# ktv-singer-tvos

Native Apple TV (tvOS) app for the KTV Singer karaoke system. Built with SwiftUI, AVPlayer, and Socket.IO.

## Setup

```bash
xcodegen generate    # Generate Xcode project from project.yml
# Open KTVSinger.xcodeproj in Xcode, Cmd+R to build and run
```

## Prerequisites

- Xcode 16+
- XcodeGen (`brew install xcodegen`)
- tvOS 17.0+ target

## Features

- YouTube video playback via AVPlayer (server-extracted stream URLs)
- Synced lyrics display with adjustable offset
- QR code pairing with mobile devices
- Song queue auto-advance
- Microphone audio playback from paired phones
- Home dashboard with Now Playing, Up Next, Most Played, Recently Added

## Architecture

- `KTVSingerApp.swift` — App entry point
- `Features/` — Player, SongBrowser (Home), Pairing, Settings
- `Shared/` — Models, Networking (APIClient), Database (SupabaseClient), Services (QueueService, AudioStreamService)
- `project.yml` — XcodeGen project spec (source of truth)
- `docs/` — tvOS-specific documentation

## Dependencies (SPM)

- `supabase-swift` v2.0.0+ — auth only
- `socket.io-client-swift` v16.1.1+ — real-time pairing and queue sync

## Notes

- Bundle ID: `com.ktvsinger.tvos`
- APIClient defaults to `localhost:4040` (simulator). Physical devices get URL from QR pairing or Settings.
- Uses `AppSupabaseClient` (not `SupabaseClient`) to avoid SDK naming conflict.
