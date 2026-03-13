import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from "react-native";
import { X, ListMusic, Plus } from "lucide-react-native";
import { colors } from "@theme/colors";
import { useToast } from "@common/hooks/use-toast";
import { usePlaylists, usePlaylistSongs } from "../hooks/usePlaylists";
import type { Playlist } from "@shared/schema";
import type { Song } from "@shared/schema";

interface PlaylistPickerProps {
  visible: boolean;
  onClose: () => void;
  addToQueue: (song: {
    songId: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string | null;
  }) => void;
  isQueueFull: boolean;
  currentQueueSize: number;
}

export function PlaylistPicker({
  visible,
  onClose,
  addToQueue,
  isQueueFull,
  currentQueueSize,
}: PlaylistPickerProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { data: playlists, isLoading: loadingPlaylists } = usePlaylists();
  const { data: songs, isLoading: loadingSongs } = usePlaylistSongs(
    selectedPlaylist?.id ?? null,
  );
  const { toast } = useToast();

  const handleClose = () => {
    setSelectedPlaylist(null);
    onClose();
  };

  const handleAddAll = () => {
    if (!songs || songs.length === 0) return;

    const availableSlots = 10 - currentQueueSize;
    const songsToAdd = songs.slice(0, availableSlots);

    for (const song of songsToAdd) {
      addToQueue({
        songId: song.id,
        videoId: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
      });
    }

    toast({
      title: "Added to Queue",
      description:
        songsToAdd.length < songs.length
          ? `Added ${songsToAdd.length} of ${songs.length} songs (queue limit)`
          : `Added ${songsToAdd.length} songs`,
    });

    handleClose();
  };

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <Pressable
      className="flex-row items-center p-4 bg-card rounded-lg border border-border mb-2"
      onPress={() => setSelectedPlaylist(item)}
    >
      <ListMusic size={20} color={colors.primary} />
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-semibold">{item.name}</Text>
        {item.description && (
          <Text className="text-muted-foreground text-sm" numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
    </Pressable>
  );

  const renderSong = ({ item }: { item: Song }) => (
    <View className="flex-row items-center p-3 bg-card rounded-lg border border-border mb-2">
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          {selectedPlaylist ? (
            <Pressable onPress={() => setSelectedPlaylist(null)}>
              <Text className="text-primary font-semibold">Back</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text className="text-foreground font-bold text-lg">
            {selectedPlaylist ? selectedPlaylist.name : "Playlists"}
          </Text>
          <Pressable onPress={handleClose}>
            <X size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Content */}
        {!selectedPlaylist ? (
          // Playlist list
          loadingPlaylists ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !playlists || playlists.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <ListMusic size={40} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-center mt-4">
                No playlists yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              renderItem={renderPlaylist}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
            />
          )
        ) : (
          // Playlist songs
          <View className="flex-1">
            {loadingSongs ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : !songs || songs.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-muted-foreground text-center">
                  This playlist is empty
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={songs}
                  renderItem={renderSong}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: 16 }}
                />
                <View className="px-4 pb-6">
                  <Pressable
                    className={`flex-row items-center justify-center py-3 rounded-xl ${
                      isQueueFull ? "bg-muted" : "bg-primary"
                    }`}
                    onPress={handleAddAll}
                    disabled={isQueueFull}
                  >
                    <Plus
                      size={18}
                      color={isQueueFull ? colors.mutedForeground : colors.primaryForeground}
                    />
                    <Text
                      className={`ml-2 font-bold ${
                        isQueueFull
                          ? "text-muted-foreground"
                          : "text-primary-foreground"
                      }`}
                    >
                      {isQueueFull
                        ? "Queue is Full"
                        : `Add All to Queue (${songs.length} songs)`}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
