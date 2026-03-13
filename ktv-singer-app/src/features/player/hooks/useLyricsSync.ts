import { useState } from "react";
import { queryClient } from "@common/lib/queryClient";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";

export function useLyricsSync() {
  const [lyricsOffset, setLyricsOffset] = useState(0);
  const { toast } = useToast();

  const saveLyricsOffset = async (songId: string, currentOffset?: number) => {
    const offset = currentOffset ?? lyricsOffset;
    if (!songId) return;

    try {
      const response = await fetch(apiUrl(`/api/songs/${songId}/lyrics-offset`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset }),
      });

      if (!response.ok) throw new Error("Failed to save offset");

      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });

      toast({
        title: "Timing Saved!",
        description: `Lyrics timing (${offset > 0 ? "+" : ""}${offset.toFixed(1)}s) saved for everyone.`,
      });
    } catch {
      toast({
        title: "Save Failed",
        description: "Could not save lyrics timing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const adjustOffset = (delta: number) => {
    setLyricsOffset((prev) => Math.max(-20, Math.min(20, prev + delta)));
  };

  const resetOffset = () => setLyricsOffset(0);

  return {
    lyricsOffset,
    setLyricsOffset,
    saveLyricsOffset,
    adjustOffset,
    resetOffset,
  };
}
