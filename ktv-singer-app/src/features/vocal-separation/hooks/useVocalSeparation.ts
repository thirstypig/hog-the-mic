import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@common/lib/queryClient";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import type { SeparationStatus } from "../types/vocal-separation.types";

export function useVocalSeparation() {
  const [statuses, setStatuses] = useState<Record<string, SeparationStatus>>({});
  const [instrumentalUrls, setInstrumentalUrls] = useState<Record<string, string>>({});
  const pollingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { toast } = useToast();

  const getStatus = useCallback(
    (songId: string): SeparationStatus => statuses[songId] ?? "idle",
    [statuses],
  );

  const getInstrumentalUrl = useCallback(
    (songId: string): string | null => instrumentalUrls[songId] ?? null,
    [instrumentalUrls],
  );

  const checkStatus = useCallback(
    async (songId: string) => {
      try {
        const response = await fetch(
          apiUrl(`/api/songs/${songId}/separation-status`),
        );
        const data = await response.json();

        if (data.status === "completed" && data.instrumentalUrl) {
          setStatuses((prev) => ({ ...prev, [songId]: "completed" }));
          setInstrumentalUrls((prev) => ({
            ...prev,
            [songId]: data.instrumentalUrl,
          }));
          queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
          toast({
            title: "Instrumental Ready",
            description: "Vocal separation complete!",
          });
        } else if (data.status === "processing") {
          pollingRef.current[songId] = setTimeout(
            () => checkStatus(songId),
            10000,
          );
        }
      } catch (error) {
        console.error("Failed to check separation status:", error);
      }
    },
    [toast],
  );

  const separateMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await fetch(
        apiUrl(`/api/songs/${songId}/separate-vocals`),
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start vocal separation");
      }
      return data;
    },
    onSuccess: (data, songId) => {
      if (data.status === "processing") {
        setStatuses((prev) => ({ ...prev, [songId]: "processing" }));
        toast({
          title: "Processing Started",
          description: "Separating vocals with AI...",
        });
        checkStatus(songId);
      } else if (data.status === "completed") {
        setStatuses((prev) => ({ ...prev, [songId]: "completed" }));
        if (data.instrumentalUrl) {
          setInstrumentalUrls((prev) => ({
            ...prev,
            [songId]: data.instrumentalUrl,
          }));
        }
        toast({
          title: "Instrumental Ready",
          description: "Vocal separation already complete!",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Separation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const separateVocals = useCallback(
    (songId: string) => {
      separateMutation.mutate(songId);
    },
    [separateMutation],
  );

  return {
    getStatus,
    getInstrumentalUrl,
    separateVocals,
    isProcessing: separateMutation.isPending,
  };
}
