# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Set project name: "ktv-singer"
6. Set database password (save this!)
7. Choose region closest to your users
8. Click "Create new project"

## 2. Database Schema

Run these SQL commands in the Supabase SQL Editor:

### Songs Table

```sql
-- Create songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    video_id TEXT NOT NULL UNIQUE,
    duration REAL NOT NULL,
    thumbnail_url TEXT,
    lyrics JSONB,
    genre TEXT,
    year INTEGER,
    language TEXT,
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_songs_title ON songs USING gin(to_tsvector('english', title));
CREATE INDEX idx_songs_artist ON songs USING gin(to_tsvector('english', artist));
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_songs_popularity ON songs(popularity DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### User Favorites Table

```sql
-- Create user_favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_song_id ON user_favorites(song_id);
```

### User Playback History

```sql
-- Create playback_history table
CREATE TABLE playback_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    lyrics_offset REAL DEFAULT 0
);

-- Create index for user history
CREATE INDEX idx_playback_history_user_id ON playback_history(user_id, played_at DESC);
```

### User Preferences

```sql
-- Create user_preferences table
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_lyrics_offset REAL DEFAULT 0,
    auto_play_next BOOLEAN DEFAULT false,
    show_word_highlights BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Row Level Security (RLS)

Enable RLS and set policies:

```sql
-- Enable RLS on all tables
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Songs: Public read, authenticated insert/update
CREATE POLICY "Songs are viewable by everyone"
    ON songs FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert songs"
    ON songs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update songs"
    ON songs FOR UPDATE
    USING (auth.role() = 'authenticated');

-- User Favorites: Users can only access their own
CREATE POLICY "Users can view own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Playback History: Users can only access their own
CREATE POLICY "Users can view own history"
    ON playback_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
    ON playback_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Preferences: Users can only access their own
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);
```

## 4. Sample Data

Insert some sample songs for testing:

```sql
INSERT INTO songs (title, artist, video_id, duration, thumbnail_url, genre, year, language, popularity, lyrics) VALUES
(
    'Bohemian Rhapsody',
    'Queen',
    'fJ9rUzIMcZQ',
    354,
    'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    'Rock',
    1975,
    'en',
    100,
    '[
        {"id": "1", "text": "Is this the real life?", "startTime": 0.5, "endTime": 3.0},
        {"id": "2", "text": "Is this just fantasy?", "startTime": 3.0, "endTime": 5.5},
        {"id": "3", "text": "Caught in a landslide", "startTime": 5.5, "endTime": 8.0},
        {"id": "4", "text": "No escape from reality", "startTime": 8.0, "endTime": 11.0}
    ]'::jsonb
),
(
    'Don''t Stop Believin''',
    'Journey',
    '1k8craCGpgs',
    251,
    'https://i.ytimg.com/vi/1k8craCGpgs/hqdefault.jpg',
    'Rock',
    1981,
    'en',
    95,
    '[]'::jsonb
),
(
    'Sweet Child O'' Mine',
    'Guns N'' Roses',
    '1w7OgIMMRc4',
    356,
    'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg',
    'Rock',
    1987,
    'en',
    90,
    '[]'::jsonb
);
```

## 5. Get API Credentials

1. Go to Project Settings → API
2. Copy the following:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Project API keys → `anon` `public` key

## 6. Configure in Xcode

### Option 1: Environment Variables (Recommended for Development)

Edit your Xcode scheme:
1. Product → Scheme → Edit Scheme
2. Run → Arguments → Environment Variables
3. Add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon public key

### Option 2: Info.plist (For Production)

Add to your Info.plist:

```xml
<key>SupabaseURL</key>
<string>https://xxxxx.supabase.co</string>
<key>SupabaseAnonKey</key>
<string>your-anon-key-here</string>
```

Then update `SupabaseClient.swift`:

```swift
static var supabaseURL: String {
    Bundle.main.infoDictionary?["SupabaseURL"] as? String ?? ""
}

static var supabaseAnonKey: String {
    Bundle.main.infoDictionary?["SupabaseAnonKey"] as? String ?? ""
}
```

### Option 3: Config.xcconfig File

Create `Config.xcconfig`:

```
SUPABASE_URL = https:/$()/xxxxx.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
```

## 7. Enable Authentication

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Enable Email authentication
3. (Optional) Configure OAuth providers:
   - Sign in with Apple (recommended for Apple platforms)
   - Google, GitHub, etc.

### For Sign in with Apple:

1. In Supabase: Authentication → Settings → Auth Providers → Apple
2. Enable Apple provider
3. Follow instructions to get:
   - Services ID
   - Team ID
   - Key ID
   - Private Key (.p8 file)

## 8. Test Connection

Run your app and try:
1. Sign up with a test account
2. Browse songs
3. Add a favorite
4. Check Supabase dashboard to see data

## Next Steps

- Set up YouTube Data API for fetching video metadata
- Implement lyrics scraping/importing
- Add more songs to the database
- Configure real-time subscriptions for multi-device sync
- Set up Supabase Edge Functions for YouTube URL extraction
