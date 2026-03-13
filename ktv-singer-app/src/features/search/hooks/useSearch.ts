import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import { rankSearchResults } from "../utils/searchRanking";
import type { LRCLibSearchResult } from "../types/search.types";

export function useSearch(initialQuery?: string) {
  const [lrclibResults, setLrclibResults] = useState<LRCLibSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visibleResults, setVisibleResults] = useState(12);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(
        apiUrl(`/api/lrclib/search?q=${encodeURIComponent(query)}`),
      );
      if (!response.ok) throw new Error("LRCLIB search failed");
      return { results: await response.json(), query };
    },
    onSuccess: ({
      results,
      query,
    }: {
      results: LRCLibSearchResult[];
      query: string;
    }) => {
      const rankedResults = rankSearchResults(results, query);
      setLrclibResults(rankedResults);
      setShowSearchResults(true);
      setVisibleResults(12);

      if (results.length === 0) {
        toast({
          title: "No Songs Found",
          description:
            "No songs with synced lyrics found in the database. Try a different search.",
        });
      }
    },
  });

  const handleSearch = (query: string) => {
    searchMutation.mutate(query);
  };

  const loadMore = () => {
    setVisibleResults((prev) => prev + 12);
  };

  return {
    lrclibResults,
    showSearchResults,
    setShowSearchResults,
    visibleResults,
    searchMutation,
    handleSearch,
    loadMore,
  };
}
