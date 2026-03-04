import { View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePairing, QRScannerView, PairingStatus, useQueue } from "@features/pairing";
import type { QueueEntry } from "@features/pairing";

export default function PairScreen() {
  const navigation = useNavigation();
  const {
    status,
    sessionId,
    serverURL,
    sessionState,
    errorMessage,
    handleQRScanned,
    disconnect,
  } = usePairing();

  const { currentlyPlaying, upcoming, skipSong, removeFromQueue } = useQueue();

  const handleBack = () => {
    disconnect();
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable
          className="px-4 py-2 rounded-lg bg-muted"
          onPress={handleBack}
          {...(Platform.isTV && { isTVSelectable: true })}
        >
          <Text className="text-foreground">Back</Text>
        </Pressable>
        <Text className="text-lg text-foreground font-bold ml-4">
          Connect to TV
        </Text>
      </View>

      {/* Content */}
      {status === "idle" || status === "scanning" ? (
        <View className="flex-1">
          <View className="px-4 py-3">
            <Text className="text-muted-foreground text-center">
              Point your camera at the QR code on your TV
            </Text>
          </View>
          <QRScannerView onScanned={handleQRScanned} />
        </View>
      ) : status === "paired" ? (
        <ScrollView className="flex-1 px-4 py-3">
          {/* Pairing status */}
          <PairingStatus
            status={status}
            sessionId={sessionId}
            singerCount={sessionState?.singers.length ?? 0}
            errorMessage={errorMessage}
            onDisconnect={disconnect}
          />

          {/* Share QR for others to join */}
          {sessionId && serverURL && (
            <View className="mt-4 p-4 bg-card rounded-xl border border-border items-center">
              <Text className="text-foreground font-bold text-base mb-2">
                Invite Others
              </Text>
              <Text className="text-muted-foreground text-sm text-center mb-3">
                Have friends scan this screen's QR code from their phone to join the session
              </Text>
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-black text-xs text-center font-mono">
                  Session: {sessionId.slice(0, 8)}...
                </Text>
              </View>
              <Text className="text-muted-foreground text-xs mt-2">
                Or open KTV Singer app and scan the TV's QR code
              </Text>
            </View>
          )}

          {/* Now Playing */}
          {currentlyPlaying && (
            <View className="mt-4 p-4 bg-card rounded-xl border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-bold text-base">
                  Now Playing
                </Text>
                <Pressable
                  className="px-3 py-1.5 rounded-lg bg-muted"
                  onPress={skipSong}
                >
                  <Text className="text-foreground text-sm">Skip</Text>
                </Pressable>
              </View>
              <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                {currentlyPlaying.title}
              </Text>
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {currentlyPlaying.artist} — added by {currentlyPlaying.addedBy}
              </Text>
            </View>
          )}

          {/* Up Next */}
          {upcoming.length > 0 && (
            <View className="mt-4">
              <Text className="text-foreground font-bold text-base mb-2">
                Up Next ({upcoming.length})
              </Text>
              {upcoming.map((entry: QueueEntry) => (
                <View
                  key={entry.queueId}
                  className="flex-row items-center p-3 bg-card rounded-lg border border-border mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      {entry.artist} — {entry.addedBy}
                    </Text>
                  </View>
                  <Pressable
                    className="px-2 py-1 rounded bg-muted ml-2"
                    onPress={() => removeFromQueue(entry.queueId)}
                  >
                    <Text className="text-muted-foreground text-xs">Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Empty queue state */}
          {!currentlyPlaying && upcoming.length === 0 && (
            <View className="mt-6 items-center">
              <Text className="text-muted-foreground text-sm text-center">
                No songs in queue. Go to Search to add songs!
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <PairingStatus
          status={status}
          sessionId={sessionId}
          singerCount={sessionState?.singers.length ?? 0}
          errorMessage={errorMessage}
          onDisconnect={disconnect}
        />
      )}
    </View>
  );
}
