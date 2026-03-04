import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
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

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function findYouTubeVideo(
    trackName: string,
    artistName: string,
  ): Promise<{ videoId: string; thumbnail: string } | null> {
    const query = `${trackName} ${artistName}`;
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
      // fall through
    }
    return null;
  }

  const handleAddToQueue = async (result: LRCLibSearchResult) => {
    if (loadingId) return;

    if (!isPaired) {
      toast({
        title: "No Active Session",
        description: "Start a karaoke session first to add songs to the queue.",
        variant: "destructive",
      });
      return;
    }

    setLoadingId(result.id);

    try {
      toast({
        title: "Loading Song...",
        description: `${result.trackName} by ${result.artistName}`,
      });

      const video = await findYouTubeVideo(result.trackName, result.artistName);
      const videoId = video?.videoId || `search:${result.trackName} ${result.artistName}`;
      const thumbnail = video?.thumbnail || "";

      // Check if song already exists
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
        return;
      }

      // Fetch lyrics & save new song
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
    } catch (err) {
      console.error("handleAddToQueue error:", err);
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
    <Pressable
      className="mx-4 mb-2 p-3 bg-card rounded-lg border border-border flex-row items-center"
      onPress={() => handleAddToQueue(item)}
    >
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
          {item.trackName}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {item.artistName}
          {item.albumName ? ` — ${item.albumName}` : ""}
        </Text>
      </View>
      {loadingId === item.id ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground mr-2">
            {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, "0")}
          </Text>
          <View className="px-3 py-1.5 rounded-lg bg-primary/20">
            <Text className="text-xs font-semibold text-primary">+ Queue</Text>
          </View>
        </View>
      )}
    </Pressable>
  );

  const visibleData = lrclibResults.slice(0, visibleResults);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <Pressable className="mr-3 p-1" onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">Search</Text>
        {isPaired && (
          <View className="px-2 py-0.5 rounded bg-green-500/20">
            <Text className="text-green-500 text-xs font-semibold">Paired</Text>
          </View>
        )}
      </View>

      {/* Search input */}
      <View className="flex-row items-center bg-card border border-border rounded-xl mx-4 px-4 py-3 mb-4">
        <Search size={20} color={colors.mutedForeground} />
        <TextInput
          className="flex-1 ml-3 text-base text-foreground"
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-base text-muted-foreground mt-2">Searching...</Text>
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
            <View className="items-center justify-center py-12 px-6">
              <Text className="text-base text-muted-foreground text-center">
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
