import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Search } from "lucide-react-native";
import { useSearch, genres, randomArtistQuery } from "@features/search";
import { usePairingContext } from "@features/pairing";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import { queryClient } from "@common/lib/queryClient";
import { colors } from "@theme/colors";
import type { LRCLibSearchResult, SearchResult, Genre } from "@features/search";
import type { Song } from "@shared/schema";

export default function SessionSearchScreen() {
  const { addToQueue, isQueueFull } = usePairingContext();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const {
    lrclibResults,
    visibleResults,
    searchMutation,
    handleSearch,
    loadMore,
  } = useSearch();

  const handleGenreTap = (genre: Genre) => {
    setActiveGenre(genre.name);
    const query = randomArtistQuery(genre);
    handleSearch(query);
  };

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
            thumbnail:
              ytResults[0].thumbnail ||
              `https://i.ytimg.com/vi/${ytResults[0].videoId}/hqdefault.jpg`,
          };
        }
      }
    } catch {
      // fall through
    }
    return null;
  }

  const handleAddToQueue = async (result: LRCLibSearchResult) => {
    if (loadingId || isQueueFull) return;
    setLoadingId(result.id);

    try {
      toast({
        title: "Loading Song...",
        description: `${result.trackName} by ${result.artistName}`,
      });

      const video = await findYouTubeVideo(result.trackName, result.artistName);
      const videoId =
        video?.videoId || `search:${result.trackName} ${result.artistName}`;
      const thumbnail = video?.thumbnail || "";

      // Check if song already exists
      let existingSong: Song | null = null;
      if (video?.videoId) {
        const existingRes = await fetch(
          apiUrl(`/api/songs/video/${video.videoId}`),
        );
        if (existingRes.ok) {
          existingSong = await existingRes.json();
        }
      }

      if (existingSong) {
        await fetch(apiUrl(`/api/songs/${existingSong.id}/play`), {
          method: "POST",
        });
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

      // Fetch lyrics & save
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
      if (!saveRes.ok) throw new Error("Failed to save song");

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
      className="flex-row items-center p-3 bg-card rounded-lg border border-border mb-2 mx-4"
      onPress={() => handleAddToQueue(item)}
      disabled={loadingId === item.id || isQueueFull}
    >
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
          {item.trackName}
        </Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {item.artistName}
          {item.albumName ? ` — ${item.albumName}` : ""}
        </Text>
      </View>
      {loadingId === item.id ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View className="flex-row items-center">
          <Text className="text-muted-foreground text-xs mr-2">
            {Math.floor(item.duration / 60)}:
            {String(item.duration % 60).padStart(2, "0")}
          </Text>
          <View
            className={`px-3 py-1.5 rounded-lg ${
              isQueueFull ? "bg-muted" : "bg-primary/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isQueueFull ? "text-muted-foreground" : "text-primary"
              }`}
            >
              {isQueueFull ? "Full" : "+ Add"}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );

  const visibleData = lrclibResults.slice(0, visibleResults);
  const totalResults = lrclibResults.length;
  const remaining = totalResults - visibleData.length;
  const hasMore = remaining > 0;
  const hasSearched = searchMutation.isSuccess || searchMutation.isError;

  const renderFooter = () => {
    if (visibleData.length === 0) return null;

    if (hasMore) {
      return (
        <Pressable
          className="mx-4 mb-4 py-3 rounded-lg bg-card border border-border items-center"
          onPress={loadMore}
        >
          <Text className="text-primary font-semibold text-sm">
            Show More ({remaining} remaining)
          </Text>
        </Pressable>
      );
    }

    return (
      <View className="mx-4 mb-4 py-3 items-center">
        <Text className="text-muted-foreground text-xs">End of results</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-card border border-border rounded-lg px-3 py-2">
          <Search size={20} color={colors.mutedForeground} />
          <TextInput
            className="flex-1 ml-2 text-base text-foreground"
            placeholder="Search for a song or artist..."
            placeholderTextColor={colors.mutedForeground}
            onSubmitEditing={(e) => {
              setActiveGenre(null);
              handleSearch(e.nativeEvent.text);
            }}
            returnKeyType="search"
          />
        </View>
        {/* Results count */}
        {hasSearched && !searchMutation.isPending && totalResults > 0 && (
          <Text className="text-muted-foreground text-xs mt-2 ml-1">
            {totalResults} results
          </Text>
        )}
      </View>

      {/* Genre pills */}
      <View className="pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {genres.map((genre) => (
            <Pressable
              key={genre.name}
              className={`px-4 py-2 rounded-full border ${
                activeGenre === genre.name
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
              onPress={() => handleGenreTap(genre)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeGenre === genre.name
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {genre.emoji} {genre.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {searchMutation.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted-foreground mt-2">Searching...</Text>
        </View>
      ) : searchMutation.isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-destructive text-base text-center mb-2">
            Search failed
          </Text>
          <Text className="text-muted-foreground text-sm text-center">
            Please check your connection and try again.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleData}
          renderItem={renderResult}
          keyExtractor={(item) => String(item.id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 px-6">
              <Text className="text-muted-foreground text-base text-center">
                Search for songs or tap a genre to browse
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
