import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@common/lib/api";
import type { Playlist } from "@shared/schema";
import type { Song } from "@shared/schema";

export function usePlaylists() {
  return useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/playlists"));
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return res.json();
    },
  });
}

export function usePlaylistSongs(playlistId: string | null) {
  return useQuery<Song[]>({
    queryKey: ["playlist-songs", playlistId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/playlists/${playlistId}/songs/details`));
      if (!res.ok) throw new Error("Failed to fetch playlist songs");
      return res.json();
    },
    enabled: !!playlistId,
  });
}
