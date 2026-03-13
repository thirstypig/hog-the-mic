import { useState } from "react";
import { useToast } from "@common/hooks/use-toast";
import type { Song } from "@shared/schema";

interface UsePlaylistQueueOptions {
  onPlaySong: (id: string) => void;
}

export function usePlaylistQueue({ onPlaySong }: UsePlaylistQueueOptions) {
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const { toast } = useToast();

  const advanceToNextSong = () => {
    if (currentPlaylist.length > 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < currentPlaylist.length) {
        const nextSong = currentPlaylist[nextIndex];
        setCurrentPlaylistIndex(nextIndex);
        onPlaySong(nextSong.id);
        toast({
          title: "Auto-Advancing",
          description: `Now playing: ${nextSong.title}`,
        });
      } else {
        setCurrentPlaylist([]);
        setCurrentPlaylistIndex(0);
        toast({
          title: "Playlist Complete",
          description: "You've reached the end of the playlist!",
        });
      }
    }
  };

  return {
    currentPlaylist,
    setCurrentPlaylist,
    currentPlaylistIndex,
    setCurrentPlaylistIndex,
    advanceToNextSong,
    isPlaylistActive: currentPlaylist.length > 0,
  };
}
