import { View, Text, Pressable } from "react-native";
import { MotiView } from "moti";
import { Mic, MicOff } from "lucide-react-native";
import { useMicrophone } from "@features/mic";
import { usePairingContext } from "@features/pairing";
import { colors } from "@theme/colors";

export default function MicScreen() {
  const { status, isMuted, startStreaming, stopStreaming, toggleMute } =
    useMicrophone();
  const { currentlyPlaying } = usePairingContext();

  const isActive = status === "streaming" || status === "muted";

  const handleMicPress = () => {
    if (isActive) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  const statusText = () => {
    switch (status) {
      case "idle":
        return "Tap to start singing";
      case "requesting":
        return "Requesting mic access...";
      case "streaming":
        return "Streaming to TV";
      case "muted":
        return "Muted";
      case "error":
        return "Microphone error — try again";
      default:
        return "";
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      {/* Mic button with pulse */}
      <View className="items-center mb-8">
        <MotiView
          from={{ scale: 1, opacity: 0.3 }}
          animate={{
            scale: isActive && !isMuted ? [1, 1.2, 1] : 1,
            opacity: isActive && !isMuted ? 0.3 : 0,
          }}
          transition={{
            type: "timing",
            duration: 1500,
            loop: isActive && !isMuted,
          }}
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: colors.primary,
          }}
        />
        <Pressable
          className={`w-40 h-40 rounded-full items-center justify-center ${
            isActive ? "bg-primary" : "bg-card border-2 border-border"
          }`}
          onPress={handleMicPress}
        >
          {isActive ? (
            <Mic size={56} color={colors.primaryForeground} />
          ) : (
            <Mic size={56} color={colors.mutedForeground} />
          )}
        </Pressable>
      </View>

      {/* Status text */}
      <Text
        className={`text-lg font-bold mb-2 ${
          status === "error" ? "text-destructive" : "text-foreground"
        }`}
      >
        {statusText()}
      </Text>

      {/* Mute button */}
      {isActive && (
        <Pressable
          className={`flex-row items-center px-6 py-3 rounded-full mt-4 ${
            isMuted ? "bg-destructive/20" : "bg-muted"
          }`}
          onPress={toggleMute}
        >
          {isMuted ? (
            <MicOff size={20} color={colors.destructive} />
          ) : (
            <MicOff size={20} color={colors.mutedForeground} />
          )}
          <Text
            className={`ml-2 font-semibold ${
              isMuted ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Text>
        </Pressable>
      )}

      {/* Current song info */}
      {currentlyPlaying && (
        <View className="absolute bottom-8 left-6 right-6 bg-card rounded-xl border border-border p-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Now Playing
          </Text>
          <Text className="text-foreground font-semibold" numberOfLines={1}>
            {currentlyPlaying.title}
          </Text>
          <Text className="text-muted-foreground text-sm" numberOfLines={1}>
            {currentlyPlaying.artist}
          </Text>
        </View>
      )}
    </View>
  );
}
