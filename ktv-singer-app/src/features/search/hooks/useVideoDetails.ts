import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@common/lib/queryClient";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import type { Song } from "@shared/schema";

interface UseVideoDetailsOptions {
  onSongReady: (song: Song) => void;
  onDismissSearch: () => void;
}

export function useVideoDetails({
  onSongReady,
  onDismissSearch,
}: UseVideoDetailsOptions) {
  const { toast } = useToast();

  const videoDetailsMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(apiUrl("/api/youtube/video-details"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Failed to get video details");
      return response.json();
    },
    onSuccess: async (videoDetails: any) => {
      const response = await fetch(
        apiUrl(`/api/songs/video/${videoDetails.videoId}`),
      );
      if (response.ok) {
        const song = await response.json();
        onSongReady(song);
        onDismissSearch();
        await fetch(apiUrl(`/api/songs/${song.id}/play`), { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      } else {
        let lyrics: any[] = [];
        try {
          const lyricsResponse = await fetch(
            apiUrl(
              `/api/lyrics?track=${encodeURIComponent(videoDetails.title)}&artist=${encodeURIComponent(videoDetails.channelTitle)}`,
            ),
          );
          if (lyricsResponse.ok) {
            lyrics = await lyricsResponse.json();
            toast({
              title: "Synced Lyrics Found!",
              description:
                "Automatically loaded synchronized lyrics for this song.",
            });
          }
        } catch {
          console.log("No synced lyrics found, using empty lyrics");
        }

        if (lyrics.length > 0) {
          try {
            const saveResponse = await fetch(apiUrl("/api/songs"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoId: videoDetails.videoId,
                title: videoDetails.title,
                artist: videoDetails.channelTitle,
                thumbnailUrl: videoDetails.thumbnail,
                genre: "Unknown",
                gender: "male",
                year: new Date().getFullYear(),
                lyrics,
              }),
            });

            if (saveResponse.ok) {
              const savedSong = await saveResponse.json();
              onSongReady(savedSong);
              queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
              await fetch(apiUrl(`/api/songs/${savedSong.id}/play`), {
                method: "POST",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
              toast({
                title: "Song Saved!",
                description:
                  "This song with lyrics has been added to your library.",
              });
              onDismissSearch();
              return;
            }
          } catch (error) {
            console.error("Failed to save song:", error);
          }
        }

        onSongReady({
          id: "",
          videoId: videoDetails.videoId,
          title: videoDetails.title,
          artist: videoDetails.channelTitle,
          thumbnailUrl: videoDetails.thumbnail,
          genre: "Unknown",
          gender: "male",
          year: new Date().getFullYear(),
          lyrics,
          playCount: 0,
        } as Song);
        onDismissSearch();
      }
    },
  });

  const handleVideoLink = (url: string) => {
    videoDetailsMutation.mutate(url);
  };

  return { videoDetailsMutation, handleVideoLink };
}
