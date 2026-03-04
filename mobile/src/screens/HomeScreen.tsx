import { View, Text, FlatList, Image, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Music } from "lucide-react-native";
import FocusableCard from "@common/components/FocusableCard";
import { useToast } from "@common/hooks/use-toast";
import { colors } from "@theme/colors";
import { useQueue } from "@features/pairing";
import type { Song } from "@shared/schema";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { toast } = useToast();
  const { addToQueue, currentlyPlaying, isPaired } = useQueue();

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const handleSongPress = (song: Song) => {
    if (isPaired) {
      addToQueue({
        songId: song.id,
        videoId: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
      });
      toast({
        title: "Added to Queue",
        description: `${song.title} by ${song.artist}`,
      });
    } else {
      navigation.navigate("Player", { song });
    }
  };

  const renderSongCard = ({ item }: { item: Song }) => (
    <FocusableCard
      className="m-tv-1 p-0 overflow-hidden"
      style={{ width: 280 }}
      onPress={() => handleSongPress(item)}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          className="w-full"
          style={{ height: 160 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full items-center justify-center bg-muted"
          style={{ height: 160 }}
        >
          <Music size={48} color={colors.mutedForeground} />
        </View>
      )}
      <View className="p-tv-2">
        <Text
          className="text-tv-sm font-bold text-foreground"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          className="text-tv-xs text-muted-foreground mt-1"
          numberOfLines={1}
        >
          {item.artist}
        </Text>
      </View>
    </FocusableCard>
  );

  return (
    <View className="flex-1 bg-background px-tv-4 pt-tv-4">
      {/* Header */}
      <View className="flex-row items-center mb-tv-4">
        <View className="w-12 h-12 rounded-tv-md bg-primary/20 items-center justify-center mr-tv-2">
          <Music size={28} color={colors.primary} />
        </View>
        <Text className="text-tv-xl font-bold text-foreground">
          Song Library
        </Text>

        <View className="flex-1" />

        <Pressable
          className="px-tv-3 py-tv-1 rounded-tv-md bg-primary"
          onPress={() => navigation.navigate("Search")}
          {...(Platform.isTV && { isTVSelectable: true })}
        >
          <Text className="text-tv-sm text-primary-foreground font-bold">
            Search
          </Text>
        </Pressable>
      </View>

      {/* Now Playing bar (when paired) */}
      {isPaired && currentlyPlaying && (
        <Pressable
          className="flex-row items-center p-3 bg-primary/10 rounded-lg mb-3 border border-primary/20"
          onPress={() => navigation.navigate("Pair")}
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="text-foreground text-sm font-semibold flex-1" numberOfLines={1}>
            Now Playing: {currentlyPlaying.title} - {currentlyPlaying.artist}
          </Text>
          <Text className="text-primary text-xs">View Queue</Text>
        </Pressable>
      )}

      {/* Song grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-tv-base text-muted-foreground">
            Loading songs...
          </Text>
        </View>
      ) : songs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-tv-base text-muted-foreground">
            No songs yet. Search to add your first song!
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongCard}
          keyExtractor={(item) => item.id}
          numColumns={Platform.isTV ? 5 : 2}
          key={Platform.isTV ? "tv" : "mobile"}
          contentContainerStyle={{ paddingBottom: 48 }}
        />
      )}
    </View>
  );
}
