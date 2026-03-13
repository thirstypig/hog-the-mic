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
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No synced lyrics found for: ${artistName} - ${trackName}`);
        return null;
      }
      throw new Error(`LRCLIB API error: ${response.status}`);
    }

    const data = await response.json() as LRCLibResponse;

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
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`LRCLIB search API error: ${response.status}`);
    }

    const data = await response.json() as LRCLibResponse[];

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

    // Smart ranking for search results
    const queryLower = query.trim().toLowerCase();
    const queryWords = query.trim().split(/\s+/);
    const isShortQuery = queryLower.length <= 3;

    songsWithSyncedLyrics.sort((a, b) => {
      let aScore = 0;
      let bScore = 0;

      const aTitle = a.trackName.toLowerCase();
      const bTitle = b.trackName.toLowerCase();
      const aArtist = a.artistName.toLowerCase();
      const bArtist = b.artistName.toLowerCase();
      const aPrimaryArtist = a.artistName.split(/\s*(?:feat\.?|ft\.?|featuring|,|&)\s*/i)[0].toLowerCase().trim();
      const bPrimaryArtist = b.artistName.split(/\s*(?:feat\.?|ft\.?|featuring|,|&)\s*/i)[0].toLowerCase().trim();

      // For short queries (like "U2"), heavily boost artist matches
      if (isShortQuery) {
        // Exact artist name match
        if (aPrimaryArtist === queryLower) aScore += 5000;
        if (bPrimaryArtist === queryLower) bScore += 5000;

        // Artist name starts with query
        if (aPrimaryArtist.startsWith(queryLower)) aScore += 3000;
        if (bPrimaryArtist.startsWith(queryLower)) bScore += 3000;

        // Full artist field contains query
        if (aArtist.includes(queryLower)) aScore += 1000;
        if (bArtist.includes(queryLower)) bScore += 1000;
      }

      // Exact title match
      if (aTitle === queryLower) aScore += 2000;
      if (bTitle === queryLower) bScore += 2000;

      // Title starts with query
      if (aTitle.startsWith(queryLower)) aScore += 800;
      if (bTitle.startsWith(queryLower)) bScore += 800;

      // For single-word queries, prefer single-word titles
      if (queryWords.length === 1) {
        const aWords = a.trackName.trim().split(/\s+/).length;
        const bWords = b.trackName.trim().split(/\s+/).length;
        if (aWords === 1) aScore += 500;
        if (bWords === 1) bScore += 500;
        // Prefer shorter titles
        aScore -= aWords * 10;
        bScore -= bWords * 10;
      }

      if (aScore !== bScore) return bScore - aScore;
      return aTitle.localeCompare(bTitle);
    });

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
