// LRCLIB API integration for synchronized lyrics
// API docs: https://lrclib.net/docs

interface LRCLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

interface LRCLibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
}

interface ParsedLyric {
  time: number;
  text: string;
}

/**
 * Search for synced lyrics on LRCLIB
 */
export async function searchLyrics(
  trackName: string,
  artistName: string,
  duration?: number
): Promise<ParsedLyric[] | null> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });

    if (duration) {
      params.append('duration', duration.toString());
    }

    const url = `https://lrclib.net/api/get?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Karaoke-Stage/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No synced lyrics found for: ${artistName} - ${trackName}`);
        return null;
      }
      throw new Error(`LRCLIB API error: ${response.status}`);
    }

    const data: LRCLibResponse = await response.json();

    // Prefer synced lyrics, fallback to plain if needed
    if (data.syncedLyrics) {
      return parseLRCFormat(data.syncedLyrics);
    }

    console.log(`Only plain lyrics available for: ${artistName} - ${trackName}`);
    return null;
  } catch (error) {
    console.error('Error fetching lyrics from LRCLIB:', error);
    return null;
  }
}

/**
 * Search LRCLIB database for songs with synced lyrics
 * Returns a list of matching songs
 */
export async function searchLRCLibDatabase(query: string): Promise<LRCLibSearchResult[]> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Karaoke-Stage/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`LRCLIB search API error: ${response.status}`);
    }

    const data: LRCLibResponse[] = await response.json();
    
    // Filter to only return songs with synced lyrics
    let songsWithSyncedLyrics = data
      .filter(song => song.syncedLyrics !== null)
      .map(song => ({
        id: song.id,
        trackName: song.trackName,
        artistName: song.artistName,
        albumName: song.albumName,
        duration: song.duration,
      }));

    // If query is a single word, prioritize single-word matches
    const queryWords = query.trim().split(/\s+/);
    if (queryWords.length === 1) {
      const searchWord = queryWords[0].toLowerCase();
      
      songsWithSyncedLyrics.sort((a, b) => {
        const aTitle = a.trackName.toLowerCase();
        const bTitle = b.trackName.toLowerCase();
        const aWords = a.trackName.trim().split(/\s+/).length;
        const bWords = b.trackName.trim().split(/\s+/).length;
        
        // Exact match gets highest priority
        if (aTitle === searchWord && bTitle !== searchWord) return -1;
        if (bTitle === searchWord && aTitle !== searchWord) return 1;
        
        // Single-word titles get priority over multi-word
        if (aWords === 1 && bWords > 1) return -1;
        if (bWords === 1 && aWords > 1) return 1;
        
        // For single-word titles, sort alphabetically
        if (aWords === 1 && bWords === 1) {
          return aTitle.localeCompare(bTitle);
        }
        
        // Otherwise, prefer shorter titles (fewer words)
        if (aWords !== bWords) return aWords - bWords;
        
        // Finally, sort alphabetically
        return aTitle.localeCompare(bTitle);
      });
    }

    return songsWithSyncedLyrics;
  } catch (error) {
    console.error('Error searching LRCLIB database:', error);
    return [];
  }
}

/**
 * Parse LRC format lyrics into time/text pairs
 * LRC format: [mm:ss.xx] Lyric text
 * Example: [00:17.12] First line of lyrics
 */
export function parseLRCFormat(lrcContent: string): ParsedLyric[] {
  const lines = lrcContent.split('\n');
  const lyrics: ParsedLyric[] = [];

  // Regex to match LRC timestamps: [mm:ss.xx] or [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeRegex));
    
    if (matches.length === 0) continue;

    // Get the last timestamp in the line (in case of multiple)
    const lastMatch = matches[matches.length - 1];
    const minutes = parseInt(lastMatch[1], 10);
    const seconds = parseInt(lastMatch[2], 10);
    const centiseconds = lastMatch[3] ? parseInt(lastMatch[3].padEnd(2, '0').slice(0, 2), 10) : 0;

    // Calculate total time in seconds
    const totalSeconds = minutes * 60 + seconds + centiseconds / 100;

    // Extract text after the last timestamp
    const textStartIndex = lastMatch.index! + lastMatch[0].length;
    const text = line.slice(textStartIndex).trim();

    if (text) {
      lyrics.push({
        time: totalSeconds,
        text,
      });
    }
  }

  // Sort by time (should already be sorted, but ensure it)
  lyrics.sort((a, b) => a.time - b.time);

  return lyrics;
}
