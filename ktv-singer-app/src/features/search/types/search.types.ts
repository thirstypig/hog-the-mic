export interface LRCLibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
}

export interface SearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}
