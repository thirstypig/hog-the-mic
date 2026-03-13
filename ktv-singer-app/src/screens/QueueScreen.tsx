import { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { ChevronUp, ChevronDown, X, SkipForward, Search, ListMusic } from "lucide-react-native";
import { usePairingContext, getSocket } from "@features/pairing";
import { PlaylistPicker } from "@features/playlist";
import { useVocalSeparation, InstrumentalToggle } from "@features/vocal-separation";
import { colors } from "@theme/colors";
import type { QueueEntry } from "@features/pairing";
import type { SessionTabParamList } from "@navigation/types";

type Nav = BottomTabNavigationProp<SessionTabParamList, "Queue">;

export default function QueueScreen() {
  const navigation = useNavigation<Nav>();
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const { getStatus, getInstrumentalUrl, separateVocals } = useVocalSeparation();
  const {
    currentlyPlaying,
    upcoming,
    isQueueFull,
    addToQueue,
    skipSong,
    removeFromQueue,
    reorderQueue,
  } = usePairingContext();

  const totalSongs = upcoming.length + (currentlyPlaying ? 1 : 0);

  const handleSwitchAudio = (songId: string, useInstrumental: boolean, instrumentalUrl: string | null) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("switch_audio", { songId, useInstrumental, instrumentalUrl });
  };

  const handleMoveUp = (entry: QueueEntry, index: number) => {
    if (index === 0) return;
    reorderQueue(entry.queueId, index - 1);
  };

  const handleMoveDown = (entry: QueueEntry, index: number) => {
    if (index >= upcoming.length - 1) return;
    reorderQueue(entry.queueId, index + 1);
  };

  const renderQueueItem = ({ item, index }: { item: QueueEntry; index: number }) => (
    <View className="flex-row items-center p-3 bg-card rounded-lg border border-border mb-2 mx-4">
      {/* Reorder buttons */}
      <View className="mr-2">
        <Pressable
          className="p-1"
          onPress={() => handleMoveUp(item, index)}
          disabled={index === 0}
        >
          <ChevronUp
            size={18}
            color={index === 0 ? colors.border : colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          className="p-1"
          onPress={() => handleMoveDown(item, index)}
          disabled={index >= upcoming.length - 1}
        >
          <ChevronDown
            size={18}
            color={
              index >= upcoming.length - 1
                ? colors.border
                : colors.mutedForeground
            }
          />
        </Pressable>
      </View>

      {/* Song info */}
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {item.artist} — {item.addedBy}
        </Text>
      </View>

      {/* Remove button */}
      <Pressable
        className="p-2 rounded-lg bg-muted ml-2"
        onPress={() => removeFromQueue(item.queueId)}
      >
        <X size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-foreground text-xl font-bold">Queue</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="flex-row items-center px-3 py-1 rounded-full bg-muted"
            onPress={() => setShowPlaylistPicker(true)}
          >
            <ListMusic size={14} color={colors.mutedForeground} />
            <Text className="text-muted-foreground text-sm font-semibold ml-1">
              Playlists
            </Text>
          </Pressable>
          <View className="px-3 py-1 rounded-full bg-muted">
            <Text className="text-muted-foreground text-sm font-semibold">
              {totalSongs}/10 songs
            </Text>
          </View>
        </View>
      </View>

      {/* Now Playing */}
      {currentlyPlaying && (
        <View className="mx-4 mb-3 p-4 bg-card rounded-xl border border-primary/30">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-primary font-bold text-xs uppercase tracking-wider">
              Now Playing
            </Text>
            <Pressable
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-muted"
              onPress={skipSong}
            >
              <SkipForward size={14} color={colors.foreground} />
              <Text className="text-foreground text-sm ml-1">Skip</Text>
            </Pressable>
          </View>
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {currentlyPlaying.title}
          </Text>
          <Text className="text-muted-foreground text-sm" numberOfLines={1}>
            {currentlyPlaying.artist} — added by {currentlyPlaying.addedBy}
          </Text>
          <View className="mt-2">
            <InstrumentalToggle
              songId={currentlyPlaying.songId}
              status={getStatus(currentlyPlaying.songId)}
              instrumentalUrl={getInstrumentalUrl(currentlyPlaying.songId)}
              onSeparate={separateVocals}
              onToggle={handleSwitchAudio}
            />
          </View>
        </View>
      )}

      {/* Up Next */}
      {upcoming.length > 0 && (
        <View className="px-4 mb-2">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
            Up Next
          </Text>
        </View>
      )}

      <FlatList
        data={upcoming}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.queueId}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-6">
            <Search size={40} color={colors.mutedForeground} />
            <Text className="text-muted-foreground text-base text-center mt-4 mb-1">
              {currentlyPlaying
                ? "No more songs queued up"
                : "Your queue is empty"}
            </Text>
            <Text className="text-muted-foreground text-sm text-center mb-5">
              Search for songs to add to your session
            </Text>
            <Pressable
              className="px-6 py-3 rounded-xl bg-primary"
              onPress={() => navigation.navigate("SessionSearch")}
            >
              <Text className="text-primary-foreground font-semibold text-sm">
                Search Songs
              </Text>
            </Pressable>
          </View>
        }
      />

      {isQueueFull && (
        <View className="px-4 pb-4">
          <Text className="text-destructive text-sm text-center">
            Queue is full (10 songs max)
          </Text>
        </View>
      )}

      <PlaylistPicker
        visible={showPlaylistPicker}
        onClose={() => setShowPlaylistPicker(false)}
        addToQueue={addToQueue}
        isQueueFull={isQueueFull}
        currentQueueSize={totalSongs}
      />
    </View>
  );
}
