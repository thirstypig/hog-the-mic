import { View, Text, Pressable } from "react-native";
import type { PairingStatus as PairingStatusType } from "../types/pairing.types";

interface PairingStatusProps {
  status: PairingStatusType;
  sessionId: string | null;
  singerCount: number;
  errorMessage: string | null;
  onDisconnect: () => void;
}

export function PairingStatus({
  status,
  sessionId,
  singerCount,
  errorMessage,
  onDisconnect,
}: PairingStatusProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      {status === "connecting" && (
        <View className="items-center gap-4">
          <Text className="text-4xl">...</Text>
          <Text className="text-xl text-foreground font-bold">Connecting</Text>
          <Text className="text-muted-foreground text-center">
            Connecting to your TV...
          </Text>
        </View>
      )}

      {status === "paired" && (
        <View className="items-center gap-4">
          <Text className="text-6xl">&#x2713;</Text>
          <Text className="text-xl text-foreground font-bold">
            Connected to TV
          </Text>
          <Text className="text-muted-foreground text-center">
            {singerCount} singer{singerCount !== 1 ? "s" : ""} connected
          </Text>
          {sessionId && (
            <Text className="text-xs text-muted-foreground">
              Session: {sessionId.slice(0, 8)}...
            </Text>
          )}
          <Pressable
            className="mt-4 px-6 py-3 rounded-lg bg-destructive"
            onPress={onDisconnect}
          >
            <Text className="text-foreground font-bold">Disconnect</Text>
          </Pressable>
        </View>
      )}

      {status === "error" && (
        <View className="items-center gap-4">
          <Text className="text-6xl">!</Text>
          <Text className="text-xl text-foreground font-bold">
            Connection Error
          </Text>
          <Text className="text-muted-foreground text-center">
            {errorMessage ?? "Something went wrong"}
          </Text>
          <Pressable
            className="mt-4 px-6 py-3 rounded-lg bg-primary"
            onPress={onDisconnect}
          >
            <Text className="text-primary-foreground font-bold">Try Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
