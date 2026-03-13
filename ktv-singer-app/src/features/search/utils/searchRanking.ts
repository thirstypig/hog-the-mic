import type { LRCLibSearchResult } from "../types/search.types";

interface RankedResult extends LRCLibSearchResult {
  searchScore: number;
}

export function rankSearchResults(
  results: LRCLibSearchResult[],
  searchQuery: string,
): RankedResult[] {
  const queryLower = searchQuery.toLowerCase().trim();
  const isShortQuery = queryLower.length <= 3;

  return results
    .map((result) => {
      let score = 0;

      const fullArtist = result.artistName.toLowerCase().trim();
      const trackName = result.trackName.toLowerCase().trim();
      const albumName = result.albumName?.toLowerCase().trim() || "";

      const primaryArtist = result.artistName
        .split(/\s*(?:feat\.?|ft\.?|featuring|,|&)\s*/i)[0]
        .toLowerCase()
        .trim();

      const isPrimaryArtist =
        primaryArtist === queryLower ||
        primaryArtist.startsWith(queryLower) ||
        fullArtist.startsWith(queryLower);

      const isFeatured = /(?:feat\.?|ft\.?|featuring)/i.test(
        result.artistName,
      );

      // Short query boost: heavily favor exact/starts-with artist matches
      if (isShortQuery) {
        if (primaryArtist === queryLower) score += 5000;
        else if (primaryArtist.startsWith(queryLower)) score += 3000;
        else if (fullArtist.includes(queryLower)) score += 1000;
      }

      if (isPrimaryArtist) {
        score += 1000;
        if (primaryArtist === queryLower) score += 500;
      }

      if (trackName.includes(queryLower) || queryLower.includes(trackName)) {
        score += 800;
        if (trackName === queryLower) score += 300;
      }

      if (!isPrimaryArtist && fullArtist.includes(queryLower)) {
        score += 400;
      }

      if (
        albumName &&
        (albumName === queryLower || albumName.includes(queryLower))
      ) {
        score += 200;
      }

      if (isFeatured && !isPrimaryArtist && fullArtist.includes(queryLower)) {
        score -= 600;
      }

      return { ...result, searchScore: score };
    })
    .sort((a, b) => b.searchScore - a.searchScore);
}
