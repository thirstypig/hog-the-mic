import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Search, ArrowLeft } from "lucide-react-native";
import { useSearch } from "@features/search";
import { useQueue } from "@features/pairing";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import { queryClient } from "@common/lib/queryClient";
import FocusableCard from "@common/components/FocusableCard";
import { colors } from "@theme/colors";
import type { RootStackParamList } from "@navigation/types";
import type { LRCLibSearchResult, SearchResult } from "@features/search";
import type { Song } from "@shared/schema";

type Nav = NativeStackNavigationProp<RootStackParamList, "Search">;
type Route = RouteProp<RootStackParamList, "Search">;

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialQuery = route.params?.query;
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { addToQueue, isPaired } = useQueue();

  const {
    lrclibResults,
    visibleResults,
    searchMutation,
    handleSearch,
    loadMore,
  } = useSearch(initialQuery);

  // Auto-search if navigated with a query
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  /**
   * Search YouTube for a video matching this song.
   * Tries the server endpoint first (Google API or Invidious fallback).
   * If that fails, falls back to YouTube's internal search via page scraping.
   */
  async function findYouTubeVideo(
    trackName: string,
    artistName: string,
  ): Promise<{ videoId: string; thumbnail: string } | null> {
    const query = `${trackName} ${artistName}`;

    // Attempt 1: Server-side YouTube search
    try {
      const ytRes = await fetch(
        apiUrl(`/api/youtube/search?q=${encodeURIComponent(query)}`),
      );
      if (ytRes.ok) {
        const ytResults: SearchResult[] = await ytRes.json();
        if (ytResults.length > 0 && ytResults[0].videoId) {
          return {
            videoId: ytResults[0].videoId,
            thumbnail: ytResults[0].thumbnail || `https://i.ytimg.com/vi/${ytResults[0].videoId}/hqdefault.jpg`,
          };
        }
      }
    } catch {
      // fall through to next method
    }

    // Attempt 2: YouTube page scrape (works from browser)
    if (Platform.OS === "web") {
      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " karaoke lyrics")}`;
        const resp = await fetch(searchUrl);
        if (resp.ok) {
          const html = await resp.text();
          // Extract first video ID from ytInitialData
          const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (match) {
            return {
              videoId: match[1],
              thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`,
            };
          }
        }
      } catch {
        // fall through
      }
    }

    return null;
  }

  const handlePlayResult = async (result: LRCLibSearchResult) => {
    if (loadingId) return; // prevent double-tap
    setLoadingId(result.id);

    try {
      toast({
        title: "Loading Song...",
        description: `${result.trackName} by ${result.artistName}`,
      });

      // Step 1: Find a YouTube video
      const video = await findYouTubeVideo(result.trackName, result.artistName);

      // If we can't find a video, use a search-based video ID
      const videoId = video?.videoId || `search:${result.trackName} ${result.artistName}`;
      const thumbnail = video?.thumbnail || "";

      // Step 2: Check if song already exists by video ID (only if we have a real ID)
      let existingSong: Song | null = null;
      if (video?.videoId) {
        const existingRes = await fetch(apiUrl(`/api/songs/video/${video.videoId}`));
        if (existingRes.ok) {
          existingSong = await existingRes.json();
        }
      }

      if (existingSong) {
        await fetch(apiUrl(`/api/songs/${existingSong.id}/play`), { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/songs"] });

        if (isPaired) {
          addToQueue({
            songId: existingSong.id,
            videoId: existingSong.videoId,
            title: existingSong.title,
            artist: existingSong.artist,
            thumbnailUrl: existingSong.thumbnailUrl,
          });
          toast({
            title: "Added to Queue",
            description: `${existingSong.title} by ${existingSong.artist}`,
          });
        } else {
          navigation.navigate("Player", { song: existingSong });
        }
        return;
      }

      // Step 3: Fetch lyrics from LRCLIB
      const lyricsRes = await fetch(
        apiUrl(
          `/api/lyrics?track=${encodeURIComponent(result.trackName)}&artist=${encodeURIComponent(result.artistName)}&duration=${result.duration}`,
        ),
      );
      if (!lyricsRes.ok) {
        toast({
          title: "Lyrics Error",
          description: "Could not load synced lyrics for this song.",
          variant: "destructive",
        });
        return;
      }
      const lyrics = await lyricsRes.json();

      // Step 4: Save new song to database
      const saveRes = await fetch(apiUrl("/api/songs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: result.trackName,
          artist: result.artistName,
          thumbnailUrl: thumbnail,
          genre: "Unknown",
          gender: "male",
          year: new Date().getFullYear(),
          lyrics,
        }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.text();
        throw new Error(`Failed to save song: ${err}`);
      }
      const savedSong: Song = await saveRes.json();
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      await fetch(apiUrl(`/api/songs/${savedSong.id}/play`), { method: "POST" });

      if (isPaired) {
        addToQueue({
          songId: savedSong.id,
          videoId: savedSong.videoId,
          title: savedSong.title,
          artist: savedSong.artist,
          thumbnailUrl: savedSong.thumbnailUrl,
        });
        toast({
          title: "Added to Queue",
          description: `${savedSong.title} by ${savedSong.artist}`,
        });
      } else {
        navigation.navigate("Player", { song: savedSong });
      }
    } catch (err) {
      console.error("handlePlayResult error:", err);
      toast({
        title: "Error",
        description: "Failed to load this song. Please try another.",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const renderResult = ({ item }: { item: LRCLibSearchResult }) => (
    <FocusableCard
      className="mx-tv-2 mb-tv-2 p-tv-3 flex-row items-center"
      onPress={() => handlePlayResult(item)}
    >
      <View className="flex-1">
        <Text className="text-tv-sm font-bold text-foreground" numberOfLines={1}>
          {item.trackName}
        </Text>
        <Text className="text-tv-xs text-muted-foreground" numberOfLines={1}>
          {item.artistName}
          {item.albumName ? ` — ${item.albumName}` : ""}
        </Text>
      </View>
      {loadingId === item.id ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text className="text-tv-xs text-muted-foreground ml-tv-2">
          {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, "0")}
        </Text>
      )}
    </FocusableCard>
  );

  const visibleData = lrclibResults.slice(0, visibleResults);

  return (
    <View className="flex-1 bg-background px-tv-4 pt-tv-4">
      {/* Header */}
      <View className="flex-row items-center mb-tv-4">
        <Pressable
          className="mr-tv-2 p-tv-1"
          onPress={() => navigation.goBack()}
          {...(Platform.isTV && { isTVSelectable: true })}
        >
          <ArrowLeft size={28} color={colors.foreground} />
        </Pressable>
        <Text className="text-tv-xl font-bold text-foreground">Search</Text>
        {isPaired && (
          <View className="ml-2 px-2 py-0.5 rounded bg-green-500/20">
            <Text className="text-green-500 text-xs font-semibold">Paired</Text>
          </View>
        )}
      </View>

      {/* Search input */}
      <View className="flex-row items-center bg-card border border-border rounded-tv-md px-tv-3 py-tv-2 mb-tv-4">
        <Search size={22} color={colors.mutedForeground} />
        <TextInput
          className="flex-1 ml-tv-2 text-tv-base text-foreground"
          placeholder="Search for a song..."
          placeholderTextColor={colors.mutedForeground}
          defaultValue={initialQuery}
          onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
          returnKeyType="search"
        />
      </View>

      {/* Results */}
      {searchMutation.isPending ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-tv-base text-muted-foreground">Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleData}
          renderItem={renderResult}
          keyExtractor={(item) => String(item.id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 48 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-tv-8">
              <Text className="text-tv-base text-muted-foreground">
                {initialQuery
                  ? "No results found. Try a different search."
                  : "Enter a search query to find songs."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
