import { useState, useMemo } from "react";
import type { Song } from "@shared/schema";

export function useFilters(songs: Song[]) {
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      if (
        selectedGenders.length > 0 &&
        !selectedGenders.some((g) => g.toLowerCase() === song.gender)
      )
        return false;
      if (selectedGenres.length > 0 && !selectedGenres.includes(song.genre))
        return false;
      if (selectedDecades.length > 0) {
        const decade = `${Math.floor(song.year / 10) * 10}s`;
        if (!selectedDecades.includes(decade)) return false;
      }
      return true;
    });
  }, [songs, selectedGenders, selectedGenres, selectedDecades]);

  const clearAll = () => {
    setSelectedGenders([]);
    setSelectedGenres([]);
    setSelectedDecades([]);
  };

  return {
    selectedGenders,
    selectedGenres,
    selectedDecades,
    setSelectedGenders,
    setSelectedGenres,
    setSelectedDecades,
    filteredSongs,
    clearAll,
  };
}
