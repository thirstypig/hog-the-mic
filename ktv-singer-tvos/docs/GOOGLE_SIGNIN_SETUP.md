# Google Sign In Setup - Complete Guide

## ✅ What We Set Up

Google Sign In for tvOS using the **Device Flow** (TV & Limited Input Devices OAuth)

---

## 📋 Google Cloud Console Configuration

### Created OAuth Credentials:

1. **OAuth Consent Screen**
   - App name: KTV Singer
   - Scopes: email, profile, openid
   - User type: External

2. **TV & Limited Input OAuth Client**
   - Type: TVs and Limited Input devices
   - Name: KTV Singer tvOS
   - **Client ID**: `YOUR_TV_CLIENT_ID`
   - **Client Secret**: `YOUR_TV_CLIENT_SECRET`

3. **Web OAuth Client** (for Supabase)
   - Type: Web application
   - Name: KTV Singer Supabase
   - Authorized redirect: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - **Client ID**: `YOUR_WEB_CLIENT_ID`
   - **Client Secret**: `YOUR_WEB_CLIENT_SECRET`

---

## 🔐 Supabase Configuration

In Supabase Dashboard → Authentication → Providers → Google:

- ✅ Enabled: Yes
- **Client ID**: Use Web Client ID
- **Client Secret**: Use Web Client Secret
- **Authorized Client IDs**: Add TV Client ID here

---

## 🎯 How It Works (User Flow)

```
1. User taps "Sign in with Google" on TV
2. TV requests device code from Google
3. TV displays:
   ┌─────────────────────────────────┐
   │  Go to: google.com/device       │
   │                                 │
   │  Enter this code:               │
   │       ABCD-1234                 │
   │                                 │
   │  ⏳ Waiting...                  │
   └─────────────────────────────────┘
4. User opens phone/computer browser
5. User goes to google.com/device
6. User enters code: ABCD-1234
7. User signs in with Google account
8. User authorizes KTV Singer
9. TV automatically detects completion
10. TV exchanges token with Supabase
11. User is signed in! ✅
```

---

## 💻 Code Changes Made

### 1. SupabaseClient.swift

**Added methods:**
```swift
signInWithGoogleDeviceFlow() -> GoogleDeviceFlowResponse
pollGoogleAuthentication(deviceCode: String) -> String
exchangeGoogleTokenWithSupabase(accessToken: String)
```

**Added models:**
```swift
GoogleDeviceFlowResponse
GoogleDeviceCodeResponse
GoogleTokenResponse
GoogleErrorResponse
```

**Added configuration:**
```swift
googleTVClientID
googleTVClientSecret
```

### 2. AuthenticationView.swift

**Added:**
- Google Sign In button
- GoogleDeviceFlowViewModel state
- startGoogleSignIn() method
- Conditional display of device code view

### 3. GoogleDeviceCodeView.swift (NEW FILE)

**Created:**
- Full-screen overlay showing device code
- Large, readable code display
- Instructions for user
- Waiting/loading indicator
- Cancel button

### 4. Environment Variables

**Added to Xcode scheme:**
```
GOOGLE_TV_CLIENT_ID=your-tv-client-id
GOOGLE_TV_CLIENT_SECRET=your-tv-client-secret
```

---

## 📱 Technical Implementation Details

### Device Flow API Calls

**Step 1: Request Device Code**
```
POST https://oauth2.googleapis.com/device/code
Body: client_id=YOUR_TV_CLIENT_ID&scope=email profile openid
Response: { device_code, user_code, verification_url, expires_in, interval }
```

**Step 2: Poll for Token** (every 5 seconds)
```
POST https://oauth2.googleapis.com/token
Body: client_id, client_secret, device_code, grant_type
Response (pending): 428 status
Response (success): { access_token, id_token, ... }
```

**Step 3: Exchange with Supabase**
```
Supabase.auth.signInWithIdToken(provider: .google, idToken: ...)
```

### Async/Await Implementation

Using Swift Concurrency:
```swift
Task {
    // Start device flow
    let response = try await signInWithGoogleDeviceFlow()
    
    // Poll in background
    Task {
        let token = try await pollGoogleAuthentication(...)
        // Auto signs in when complete
    }
}
```

---

## ✅ Testing Checklist

Once Xcode project is set up:

- [ ] Build succeeds
- [ ] "Sign in with Google" button appears
- [ ] Tapping button shows device code screen
- [ ] Code is readable and large
- [ ] Instructions are clear
- [ ] Can enter code on phone successfully
- [ ] TV automatically signs in when code entered
- [ ] User appears in Supabase auth dashboard
- [ ] Can access protected features after sign in
- [ ] Cancel button works

---

## 🐛 Troubleshooting

### "Invalid client" error
- ✅ Check TV Client ID is correct in environment variables
- ✅ Check Client Secret matches

### "Redirect URI mismatch"
- ✅ Verify Supabase callback URL in Google Console
- ✅ Use Web client ID in Supabase, not TV client ID

### Code expires before user enters it
- Default: 15 minutes
- User sees: "Code expired"
- Solution: User must start flow again

### Polling too frequent
- Respect `interval` from Google (usually 5 seconds)
- Too frequent = rate limited

### Token exchange fails
- ✅ Check Supabase Google provider is enabled
- ✅ Verify Web Client credentials in Supabase
- ✅ Check TV Client ID in "Authorized Client IDs"

---

## 🎨 UI/UX Considerations

### Device Code Display
- ✅ Very large font (72pt)
- ✅ Monospaced font for clarity
- ✅ High contrast (white on gradient)
- ✅ Letter spacing for readability
- ✅ Clear URL (google.com/device)

### User Instructions
- ✅ Step-by-step numbered
- ✅ No technical jargon
- ✅ "On your phone or computer" (makes it clear)
- ✅ Waiting indicator (user knows it's working)
- ✅ Cancel option (user can back out)

### Accessibility
- Large text for visibility from couch
- High contrast for readability
- Clear focus states for tvOS remote
- Timeout handling with user feedback

---

## 📊 Comparison with Apple Sign In

| Feature | Apple Sign In | Google Sign In |
|---------|---------------|----------------|
| **Native to tvOS** | ✅ Yes | ❌ No (needs device flow) |
| **User experience** | 1-tap | Multi-step (enter code) |
| **Setup complexity** | High (JWT, keys) | Medium (OAuth clients) |
| **Works with Android** | ❌ No | ✅ Yes |
| **Privacy** | Excellent (hide email) | Good (standard OAuth) |
| **Required for App Store** | Yes (if other auth) | No |

**Recommendation:** Offer both, Apple as primary for tvOS users

---

## 🔒 Security Notes

1. **Client Secret**: Stored in environment variable, not in code
2. **Token Exchange**: Happens server-side via Supabase
3. **HTTPS Only**: All API calls use HTTPS
4. **Token Expiry**: Access tokens expire, refresh handled by Supabase
5. **Scope Limitation**: Only requesting email, profile, openid (minimal)

---

## 🚀 Future Enhancements

- [ ] Remember last sign-in method
- [ ] Show QR code instead of text code
- [ ] Auto-refresh when code expires
- [ ] Better error messages
- [ ] Retry logic for network failures
- [ ] Analytics for auth completion rate

---

## 📚 References

- [Google OAuth Device Flow](https://developers.google.com/identity/protocols/oauth2/limited-input-device)
- [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Swift Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)

---

**Status:** ✅ Configuration complete, code written, ready for testing

**Next:** Add code to Xcode project and test the full flow
