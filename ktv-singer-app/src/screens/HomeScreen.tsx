import { View, Text, FlatList, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Music, ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@common/hooks/use-toast";
import { colors } from "@theme/colors";
import { useQueue } from "@features/pairing";
import type { Song } from "@shared/schema";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { addToQueue, currentlyPlaying, isPaired } = useQueue();

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const handleSongPress = (song: Song) => {
    if (!isPaired) {
      toast({
        title: "No Active Session",
        description: "Start a karaoke session first to add songs to the queue.",
        variant: "destructive",
      });
      return;
    }
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
  };

  const renderSongCard = ({ item }: { item: Song }) => (
    <Pressable
      className="flex-1 m-1.5 bg-card rounded-xl overflow-hidden border border-border"
      onPress={() => handleSongPress(item)}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          className="w-full"
          style={{ height: 120 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full items-center justify-center bg-muted"
          style={{ height: 120 }}
        >
          <Music size={32} color={colors.mutedForeground} />
        </View>
      )}
      <View className="p-2.5">
        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <Pressable className="mr-3 p-1" onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Music size={24} color={colors.primary} />
        <Text className="text-xl font-bold text-foreground ml-2 flex-1">
          Song Library
        </Text>
      </View>

      {/* Now Playing bar (when paired) */}
      {isPaired && currentlyPlaying && (
        <Pressable
          className="flex-row items-center mx-4 p-3 bg-primary/10 rounded-lg mb-3 border border-primary/20"
          onPress={() => navigation.navigate("Pair")}
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="text-foreground text-sm font-semibold flex-1" numberOfLines={1}>
            {currentlyPlaying.title} - {currentlyPlaying.artist}
          </Text>
          <Text className="text-primary text-xs">Queue</Text>
        </Pressable>
      )}

      {/* Song grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading songs...</Text>
        </View>
      ) : songs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-muted-foreground text-center">
            No songs yet. Search to add your first song!
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 48 }}
        />
      )}
    </View>
  );
}
