import type { Express } from "express";
import { searchYouTubeVideos, getVideoDetails, extractVideoId } from "./youtube.service";
import { searchLyrics, searchLRCLibDatabase } from "./lrclib.service";

export function registerSearchRoutes(app: Express) {
  // YouTube search route — tries Google API first, falls back to Invidious
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      // Try Google API first (requires YOUTUBE_API_KEY)
      if (process.env.YOUTUBE_API_KEY) {
        const results = await searchYouTubeVideos(query, 20);
        return res.json(results);
      }

      // Fallback: use Invidious public API (no key needed)
      const invidiousInstances = [
        "https://inv.nadeko.net",
        "https://invidious.nerdvpn.de",
        "https://invidious.privacyredirect.com",
        "https://vid.puffyan.us",
      ];

      let lastError: Error | null = null;
      for (const instance of invidiousInstances) {
        try {
          const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
          const resp = await fetch(url, {
            headers: { "User-Agent": "Karaoke-Stage/1.0" },
            signal: AbortSignal.timeout(5000),
          });
          if (!resp.ok) continue;
          const data = await resp.json() as any[];
          const results = data
            .filter((item: any) => item.type === "video")
            .slice(0, 20)
            .map((item: any) => ({
              videoId: item.videoId,
              title: item.title,
              description: item.description || "",
              thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
              channelTitle: item.author || "",
            }));
          return res.json(results);
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }

      // Fallback: scrape YouTube search results page
      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const resp = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          const html = await resp.text();
          // Extract video IDs from ytInitialData
          const videoIds: string[] = [];
          const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
          let m;
          while ((m = regex.exec(html)) !== null) {
            if (!videoIds.includes(m[1])) videoIds.push(m[1]);
          }
          if (videoIds.length > 0) {
            const results = videoIds.slice(0, 10).map((id) => ({
              videoId: id,
              title: "",
              description: "",
              thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              channelTitle: "",
            }));
            return res.json(results);
          }
        }
      } catch (scrapeErr) {
        console.error("YouTube scrape fallback failed:", scrapeErr);
      }

      console.error("All YouTube search methods failed:", lastError);
      res.status(500).json({ error: "Failed to search YouTube" });
    } catch (error) {
      console.error("YouTube search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  // Get video details from URL
  app.post("/api/youtube/video-details", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const details = await getVideoDetails(videoId);
      if (!details) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Video details error:", error);
      res.status(500).json({ error: "Failed to get video details" });
    }
  });

  // Search LRCLIB database for songs with synced lyrics
  app.get("/api/lrclib/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchLRCLibDatabase(query);
      res.json(results);
    } catch (error) {
      console.error("LRCLIB search error:", error);
      res.status(500).json({ error: "Failed to search LRCLIB" });
    }
  });

  // Get synced lyrics from LRCLIB
  app.get("/api/lyrics", async (req, res) => {
    try {
      const { track, artist, duration } = req.query;

      if (!track || !artist) {
        return res.status(400).json({ error: "Track and artist are required" });
      }

      const durationNum = duration ? parseInt(duration as string) : undefined;
      const lyrics = await searchLyrics(track as string, artist as string, durationNum);

      if (!lyrics) {
        return res.status(404).json({ error: "No synced lyrics found" });
      }

      res.json(lyrics);
    } catch (error) {
      console.error("Lyrics search error:", error);
      res.status(500).json({ error: "Failed to search lyrics" });
    }
  });
}
