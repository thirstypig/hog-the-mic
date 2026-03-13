# KTV Singer - Project Setup Guide

## Overview

This guide will help you set up the KTV Singer tvOS app from scratch. The app consists of:
- **tvOS app**: Main karaoke experience
- **iOS app** (future): Companion microphone app
- **Supabase backend**: Database, authentication, real-time sync
- **Feature module architecture**: Clean, isolated features

## Prerequisites

- macOS with Xcode 15.0 or later
- iOS 17.0+ / tvOS 17.0+ deployment targets
- Supabase account (free tier works)
- YouTube Data API key (optional, for metadata fetching)

## Step 1: Create Xcode Project

### 1.1 Create tvOS Target

1. Open Xcode
2. File → New → Project
3. Select tvOS → App
4. Product Name: `KTVSinger`
5. Organization Identifier: `com.yourcompany`
6. Interface: **SwiftUI**
7. Language: **Swift**
8. Create

### 1.2 Add Swift Package Dependencies

1. File → Add Package Dependencies
2. Add Supabase Swift:
   ```
   https://github.com/supabase/supabase-swift.git
   ```
3. Version: 2.0.0 or later
4. Add to target: KTVSinger

## Step 2: Set Up Project Structure

Create the following folder structure in your project:

```
KTVSinger/
├── App/
│   ├── KTVSingerApp.swift
│   └── ContentView.swift
├── Features/
│   ├── Authentication/
│   │   └── Views/
│   │       └── AuthenticationView.swift
│   ├── SongBrowser/
│   │   ├── Views/
│   │   │   └── SongBrowserView.swift
│   │   └── ViewModels/
│   │       └── SongBrowserViewModel.swift
│   ├── Player/
│   │   ├── Views/
│   │   │   ├── PlayerView.swift
│   │   │   └── LyricsView.swift
│   │   ├── ViewModels/
│   │   │   └── PlayerViewModel.swift
│   │   └── Services/
│   │       ├── YouTubePlayerService.swift
│   │       └── LyricsSyncService.swift
│   ├── Favorites/
│   │   └── Views/
│   │       └── FavoritesView.swift
│   ├── Settings/
│   │   └── Views/
│   │       └── SettingsView.swift
│   └── Pairing/
│       └── Views/
│           └── PairingView.swift
├── Shared/
│   ├── Models/
│   │   ├── Song.swift
│   │   └── DeviceConnection.swift
│   ├── Database/
│   │   └── SupabaseClient.swift
│   └── Services/
│       └── DevicePairingService.swift
└── Resources/
    ├── Assets.xcassets
    └── Info.plist
```

## Step 3: Copy Source Files

Copy all the Swift files that were created in this session into their respective folders.

## Step 4: Configure Supabase

Follow the `SUPABASE_SETUP.md` guide to:
1. Create a Supabase project
2. Set up database schema
3. Configure authentication
4. Get API credentials

## Step 5: Configure Xcode Project

### 5.1 Set Environment Variables

1. Product → Scheme → Edit Scheme
2. Run → Arguments → Environment Variables
3. Add:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `your-anon-key`

### 5.2 Configure Info.plist

Add the following keys to your Info.plist:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>KTV Singer needs local network access to connect to companion devices</string>

<key>NSBonjourServices</key>
<array>
    <string>_ktvsinfer._tcp</string>
</array>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>processing</string>
</array>
```

### 5.3 Enable Required Capabilities

In Xcode, select your target → Signing & Capabilities:

1. **Networking**: Should be enabled by default
2. **Access WiFi Information** (if needed for local network)
3. **Background Modes** (for audio processing)

## Step 6: Fix Import Issues

Some files use `UIKit` which is not directly available on tvOS. Update these:

### In `DevicePairingService.swift`:

Replace:
```swift
import UIKit
```

With:
```swift
#if os(iOS)
import UIKit
#elseif os(tvOS)
import UIKit  // UIKit is available on tvOS but with limited APIs
#endif
```

### For UIImage in QR code generation:

```swift
#if os(iOS) || os(tvOS)
return UIImage(cgImage: cgImage)
#else
return NSImage(cgImage: cgImage, size: .zero)
#endif
```

## Step 7: Create Initial Build

1. Select "KTVSinger (tvOS)" target
2. Choose "Apple TV" simulator or device
3. Product → Build (⌘B)
4. Fix any compilation errors

Common issues:
- Missing imports: Add necessary `import` statements
- Platform-specific APIs: Wrap in `#if os(tvOS)` checks
- Missing dependencies: Ensure Supabase package is added

## Step 8: Set Up YouTube Video Playback

### Option 1: Use Backend Service (Recommended)

The `YouTubePlayerService.swift` expects a backend endpoint to extract YouTube stream URLs.

Update your Node.js backend to add this endpoint:

```typescript
// Add to your server/index.ts
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

app.get('/api/youtube/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Use youtube-dl or yt-dlp to extract stream URL
    // This is a placeholder - implement actual extraction
    const streamURL = await extractYouTubeURL(videoId);
    res.json({ streamURL });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract URL' });
  }
});
```

### Option 2: Use YouTube IFrame Player (Web Only)

For web-based approach, you'd need to embed a WebView, but this isn't recommended for tvOS.

## Step 9: Test Authentication

1. Run the app
2. You should see the authentication screen
3. Try signing up with a test email
4. Check Supabase dashboard → Authentication → Users
5. You should see your test user

## Step 10: Add Sample Data

1. Go to Supabase dashboard
2. SQL Editor
3. Run the sample data insert from `SUPABASE_SETUP.md`
4. Reload app and browse songs

## Step 11: Test Player

1. Browse songs
2. Select a song
3. Player screen should appear
4. Lyrics should sync (if available)
5. Test offset adjustment buttons

## Step 12: Future - iOS Companion App

To add the iOS microphone companion:

1. File → New → Target
2. iOS → App
3. Product Name: `KTVSinger-iOS`
4. Share code with tvOS app:
   - Use the `Shared` folder
   - Add iOS-specific features:
     - QR code scanner
     - Microphone capture
     - Audio streaming

## Troubleshooting

### Build Errors

**"Cannot find 'SupabaseClient' in scope"**
- Make sure Package.swift is in project root
- Product → Clean Build Folder
- Rebuild

**"Module 'Supabase' not found"**
- File → Packages → Resolve Package Versions
- Restart Xcode

### Runtime Errors

**"Supabase configuration is missing"**
- Check environment variables are set
- Verify SUPABASE_URL and SUPABASE_ANON_KEY

**"Failed to connect to Supabase"**
- Check internet connection
- Verify Supabase project is active
- Check API keys are correct

**"YouTube player failed"**
- Backend URL extraction not implemented
- See Step 8 above

## Next Steps

1. ✅ Basic tvOS app structure
2. ✅ Supabase integration
3. ✅ Authentication
4. ✅ Song browsing
5. ✅ Player with lyrics sync
6. ⏳ YouTube URL extraction backend
7. ⏳ iOS companion app
8. ⏳ Device pairing (QR code)
9. ⏳ Audio streaming
10. ⏳ Real-time sync between devices

## Resources

- [Supabase Swift Docs](https://github.com/supabase/supabase-swift)
- [SwiftUI tvOS Guide](https://developer.apple.com/documentation/swiftui/)
- [AVKit Documentation](https://developer.apple.com/documentation/avkit/)
- [Network Framework](https://developer.apple.com/documentation/network/)

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Supabase logs in dashboard
3. Check Xcode console for error messages
4. Verify all environment variables are set
