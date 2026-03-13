import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@common/lib/queryClient";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import type { Song } from "@shared/schema";

interface UseSongsOptions {
  onSongReady: (song: Song) => void;
  onDismissSearch: () => void;
  setGaudioStatus: (status: "idle" | "processing" | "completed") => void;
  checkGaudioStatus: (songId: string) => void;
  setLyricsOffset: (offset: number) => void;
  setCurrentTime: (time: number) => void;
}

export function useSongs({
  onSongReady,
  onDismissSearch,
  setGaudioStatus,
  checkGaudioStatus,
  setLyricsOffset,
  setCurrentTime,
}: UseSongsOptions) {
  const { toast } = useToast();

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const handlePlaySong = async (id: string) => {
    const song = songs.find((s) => s.id === id);
    if (song) {
      setLyricsOffset(song.lyricsOffset || 0);

      await fetch(apiUrl(`/api/songs/${id}/play`), { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });

      if (song.instrumentalUrl) {
        setGaudioStatus("completed");
      } else if (song.gaudioJobId) {
        setGaudioStatus("processing");
        checkGaudioStatus(song.id);
      } else {
        setGaudioStatus("idle");
      }

      let updatedSong = { ...song };
      if (!song.lyrics || song.lyrics.length === 0) {
        try {
          const lyricsResponse = await fetch(
            apiUrl(
              `/api/lyrics?track=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`,
            ),
          );
          if (lyricsResponse.ok) {
            const lyrics = await lyricsResponse.json();
            updatedSong.lyrics = lyrics;

            try {
              await fetch(apiUrl(`/api/songs/${song.id}`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lyrics }),
              });
            } catch (saveError) {
              console.error("Failed to save lyrics to storage:", saveError);
            }

            toast({
              title: "Synced Lyrics Loaded!",
              description: "Using latest synchronized lyrics from LRCLIB.",
            });
          }
        } catch {
          console.log("Using existing lyrics, LRCLIB fetch failed");
        }
      }

      onSongReady(updatedSong);
      setCurrentTime(0);
      onDismissSearch();
    }
  };

  return { songs, handlePlaySong };
}
