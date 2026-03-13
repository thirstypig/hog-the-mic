# KTV Singer tvOS - Implementation Checklist

## 📋 Phase 1: Initial Setup (1-2 hours)

### Supabase Setup
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project named "ktv-singer"
- [ ] Save database password securely
- [ ] Go to SQL Editor
- [ ] Run songs table creation script (from SUPABASE_SETUP.md)
- [ ] Run user_favorites table creation script
- [ ] Run playback_history table creation script
- [ ] Run user_preferences table creation script
- [ ] Enable RLS policies (run RLS scripts)
- [ ] Insert sample songs data
- [ ] Go to Settings → API
- [ ] Copy Project URL
- [ ] Copy anon/public API key
- [ ] Go to Authentication → Settings
- [ ] Enable Email authentication
- [ ] (Optional) Configure Sign in with Apple

### Xcode Project Setup
- [x] Install XcodeGen: `brew install xcodegen`
- [x] Project spec: `tvos/project.yml` (declarative, version-controlled)
- [x] Generate project: `cd tvos && xcodegen generate`
- [x] SPM dependency: supabase-swift v2.0.0+ (configured in project.yml)
- [x] Bundle ID: `com.ktvsinger.tvos`
- [x] Deployment target: tvOS 17.0

### Environment Configuration
- [x] Supabase credentials are optional (app works in server-only mode)
- [x] If using Supabase auth: set SUPABASE_URL and SUPABASE_ANON_KEY in scheme environment variables
- [x] APIClient base URL defaults to local server (configurable in code or in-app Settings)

### Initial Build
- [x] Build for Apple TV Simulator (⌘B) — **WORKING**
- [x] Run on Apple TV Simulator (⌘R) — **WORKING**
- [x] App launches to song browser (no auth wall)

### Real Apple TV Deployment
- [x] Pair Apple TV via Xcode → Window → Devices and Simulators
- [x] Set `CODE_SIGN_STYLE: Automatic` in project.yml, regenerate
- [x] Select team in Xcode Signing & Capabilities
- [x] Update APIClient default URL to Mac's local IP
- [x] Build and run on Apple TV 4K — **WORKING**
- [x] Trust developer profile on Apple TV (Settings → General → Device Management)

## 📋 Phase 2: Backend Integration (1-2 hours)

### Node.js Backend (YouTube URL Extraction)
- [x] Open your existing Node.js backend project
- [x] Install @distube/ytdl-core package
- [x] Create endpoint: GET /api/youtube/stream/:videoId
- [x] Implement YouTube URL extraction logic (with in-memory caching)
- [ ] Test endpoint with curl or Postman
- [ ] Deploy to your hosting (Heroku, Railway, etc.)
- [ ] Get backend URL (e.g., https://your-app.com)
- [x] Update YouTubePlayerService.swift with backend URL (uses APIClient)
- [ ] Rebuild tvOS app
- [ ] Test video playback

### Test Core Features
- [x] Launch app
- [x] App should show song browser (no auth wall)
- [x] Songs from Express API should appear
- [x] Click on a song (must use Button, not onTapGesture on tvOS)
- [x] Player screen should appear
- [x] Video should load via stream endpoint
- [x] Lyrics should display and sync
- [x] Test +0.5s / -0.5s offset buttons
- [x] Back button should return to browser
- [ ] **Known issue**: Audio can drop during playback (video continues)

## 📋 Phase 3: Polish & Testing (2-3 hours)

### UI Testing
- [ ] Test navigation between screens
- [ ] Test search functionality
- [ ] Test genre filtering
- [ ] Test sorting options
- [ ] Test favorites (add/remove)
- [ ] Test settings screen
- [ ] Test sign out
- [ ] Test pairing QR code display

### Focus Engine Testing
- [ ] Use Apple TV remote (or simulator)
- [ ] Test focus navigation in browser
- [ ] Test focus on search field
- [ ] Test focus on filter buttons
- [ ] Test focus on song cards
- [ ] Test focus on player controls
- [ ] Ensure all interactive elements are focusable

### Error Handling
- [ ] Test with no internet connection
- [ ] Test with invalid YouTube video ID
- [ ] Test with song that has no lyrics
- [ ] Test authentication with wrong password
- [ ] Test with missing Supabase credentials
- [ ] Verify error messages are user-friendly

### Performance
- [ ] Check memory usage (should be <100MB)
- [ ] Check CPU usage during playback
- [ ] Check frame rate (should be 60fps)
- [ ] Test with 50+ songs in database
- [ ] Test scrolling performance
- [ ] Test video playback smoothness

## 📋 Phase 4: iOS Companion App (3-4 hours)

### Create iOS Target
- [ ] File → New → Target
- [ ] iOS → App
- [ ] Product Name: "KTVSinger-iOS"
- [ ] Add to project
- [ ] Add Supabase package to iOS target
- [ ] Share Shared/ folder with iOS target

### QR Scanner
- [ ] Create QRScannerView.swift
- [ ] Import AVFoundation
- [ ] Implement AVCaptureMetadataOutput
- [ ] Handle QR code detection
- [ ] Parse PairingPayload
- [ ] Connect to tvOS via WebSocket

### Microphone Capture
- [ ] Create MicrophoneService.swift
- [ ] Request microphone permission in Info.plist
- [ ] Set up AVAudioEngine
- [ ] Capture audio buffer
- [ ] Convert to Data packets
- [ ] Send via WebSocket to tvOS

### Test Multi-Device
- [ ] Run tvOS app on simulator/device
- [ ] Open pairing screen, show QR code
- [ ] Run iOS app on device (camera needed)
- [ ] Scan QR code
- [ ] Verify connection in tvOS app
- [ ] Test microphone streaming
- [ ] Test playback sync

## 📋 Phase 5: App Store Preparation (2-3 hours)

### App Assets
- [ ] Create app icon (1280x768 for tvOS)
- [ ] Create screenshots for App Store
- [ ] Create promotional images
- [ ] Write app description
- [ ] Write keywords for ASO

### App Configuration
- [ ] Set app version number
- [ ] Set build number
- [ ] Configure App Privacy details
- [ ] Add usage descriptions to Info.plist
  - [ ] NSMicrophoneUsageDescription (iOS)
  - [ ] NSLocalNetworkUsageDescription
  - [ ] NSBonjourServices

### Code Signing
- [ ] Ensure you have Apple Developer account
- [ ] Create App ID in developer portal
- [ ] Create provisioning profiles
- [ ] Configure signing in Xcode
- [ ] Test on real Apple TV device

### TestFlight
- [ ] Archive app (Product → Archive)
- [ ] Upload to App Store Connect
- [ ] Add build to TestFlight
- [ ] Add internal testers
- [ ] Test on real devices
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Submit for review

## 📋 Optional Enhancements

### Advanced Features
- [ ] Implement voice effects
- [ ] Add recording functionality
- [ ] Add score/rating system
- [ ] Implement social sharing
- [ ] Add custom playlists
- [ ] Implement offline mode
- [ ] Add lyrics editor
- [ ] Implement song recommendations

### Analytics
- [ ] Add analytics SDK (e.g., Mixpanel)
- [ ] Track app launches
- [ ] Track song plays
- [ ] Track feature usage
- [ ] Track errors/crashes

### Monetization (Optional)
- [ ] Implement StoreKit
- [ ] Create in-app purchases
- [ ] Add premium features
- [ ] Test purchase flow
- [ ] Add restore purchases

## 📋 Maintenance

### Regular Tasks
- [ ] Monitor Supabase usage/costs
- [ ] Update dependencies regularly
- [ ] Review crash reports
- [ ] Respond to user reviews
- [ ] Add new songs to database
- [ ] Update lyrics as needed
- [ ] Monitor YouTube API usage
- [ ] Backup database regularly

### Future Updates
- [ ] Add new song sources (Spotify, etc.)
- [ ] Improve lyrics sync algorithm
- [ ] Add more languages
- [ ] Implement AI-powered features
- [ ] Add multiplayer/party mode
- [ ] Implement achievements
- [ ] Add social features

## ✅ Verification Checklist

Before launching:
- [ ] App builds without errors
- [ ] App runs on real Apple TV
- [ ] Authentication works
- [ ] Songs load from database
- [ ] Video playback works
- [ ] Lyrics sync correctly
- [ ] Favorites work
- [ ] Settings work
- [ ] QR pairing works (if implemented)
- [ ] No crashes during normal use
- [ ] Performance is acceptable
- [ ] UI is polished
- [ ] All text is correct (no typos)
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Support email set up

## 📝 Documentation

- [ ] Update README.md
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Write user guide
- [ ] Create FAQ
- [ ] Document known issues
- [ ] Create troubleshooting guide
- [ ] Document deployment process

## 🎉 Launch!

- [ ] Final testing on all devices
- [ ] Submit to App Store
- [ ] Wait for approval
- [ ] Prepare launch marketing
- [ ] Monitor crash reports
- [ ] Respond to user feedback
- [ ] Plan next update

---

## Quick Command Reference

### Xcode
- Build: `⌘B`
- Run: `⌘R`
- Clean: `⌘⇧K`
- Archive: `Product → Archive`

### Git (if using version control)
```bash
git init
git add .
git commit -m "Initial tvOS port"
git remote add origin <your-repo>
git push -u origin main
```

### Supabase CLI (optional)
```bash
npm install -g supabase
supabase login
supabase db push
```

---

**Pro Tip**: Don't try to do everything at once! Follow the phases in order, and celebrate small wins along the way. 🎉

**Current Status**: ✅ All code written, ready for implementation!

**Next Step**: Start with Phase 1 setup (should take 1-2 hours).

Good luck! 🚀
