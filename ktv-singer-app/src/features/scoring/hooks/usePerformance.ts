import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@common/lib/api";

export function usePerformance() {
  const savePerformanceMutation = useMutation({
    mutationFn: async (data: {
      songId: string;
      totalScore: number;
      pitchScore: number;
      timingScore: number;
      rhythmScore: number;
    }) => {
      const response = await fetch(apiUrl("/api/performances"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save performance");
      return response.json();
    },
  });

  const handleSaveScore = (
    songId: string,
    scores: {
      totalScore: number;
      pitchScore: number;
      timingScore: number;
      rhythmScore: number;
    },
  ) => {
    if (songId) {
      savePerformanceMutation.mutate({ songId, ...scores });
    }
  };

  return { savePerformanceMutation, handleSaveScore };
}
