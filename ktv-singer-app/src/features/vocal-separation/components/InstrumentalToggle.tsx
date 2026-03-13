import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Music } from "lucide-react-native";
import { colors } from "@theme/colors";
import type { SeparationStatus } from "../types/vocal-separation.types";

interface InstrumentalToggleProps {
  songId: string;
  status: SeparationStatus;
  instrumentalUrl: string | null;
  onSeparate: (songId: string) => void;
  onToggle: (songId: string, useInstrumental: boolean, instrumentalUrl: string | null) => void;
}

export function InstrumentalToggle({
  songId,
  status,
  instrumentalUrl,
  onSeparate,
  onToggle,
}: InstrumentalToggleProps) {
  const [active, setActive] = useState(false);

  const handlePress = () => {
    if (status === "idle") {
      onSeparate(songId);
    } else if (status === "completed" && instrumentalUrl) {
      const next = !active;
      setActive(next);
      onToggle(songId, next, instrumentalUrl);
    }
  };

  if (status === "processing") {
    return (
      <View className="flex-row items-center px-2 py-1 rounded-lg bg-muted">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-muted-foreground text-xs ml-1">Processing</Text>
      </View>
    );
  }

  return (
    <Pressable
      className={`flex-row items-center px-2 py-1 rounded-lg ${
        active ? "bg-primary" : "bg-muted"
      }`}
      onPress={handlePress}
    >
      <Music
        size={12}
        color={active ? colors.primaryForeground : colors.mutedForeground}
      />
      <Text
        className={`text-xs ml-1 ${
          active ? "text-primary-foreground font-semibold" : "text-muted-foreground"
        }`}
      >
        Instrumental
      </Text>
    </Pressable>
  );
}
