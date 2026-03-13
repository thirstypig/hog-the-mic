import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { LogOut, Tv, Smartphone } from "lucide-react-native";
import { usePairingContext } from "@features/pairing";
import { disconnectSocket } from "@features/pairing";
import { colors } from "@theme/colors";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SessionInfoScreen() {
  const navigation = useNavigation<Nav>();
  const { sessionId, serverURL, sessionState, disconnect } = usePairingContext();

  const handleDisconnect = () => {
    disconnect();
    disconnectSocket();
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  const qrValue = JSON.stringify({ serverURL, sessionId });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      {/* Session QR Code */}
      {sessionId && serverURL && (
        <View className="bg-card rounded-xl border border-border p-6 items-center mb-4">
          <Text className="text-foreground font-bold text-lg mb-1">
            Invite Others
          </Text>
          <Text className="text-muted-foreground text-sm text-center mb-4">
            Have others scan this QR code with the KTV Singer app to join
          </Text>
          <View className="bg-white p-4 rounded-xl">
            <QRCode value={qrValue} size={200} />
          </View>
          <Text className="text-muted-foreground text-xs mt-3">
            Session: {sessionId.slice(0, 8)}...
          </Text>
        </View>
      )}

      {/* Connected Devices */}
      <View className="bg-card rounded-xl border border-border p-4 mb-4">
        <Text className="text-foreground font-bold text-base mb-3">
          Connected Devices
        </Text>

        {/* TV status */}
        <View className="flex-row items-center py-2 border-b border-border">
          <Tv size={18} color={sessionState?.tvConnected ? colors.primary : colors.mutedForeground} />
          <Text className="text-foreground ml-3 flex-1">TV</Text>
          <View
            className={`px-2 py-0.5 rounded-full ${
              sessionState?.tvConnected ? "bg-green-500/20" : "bg-muted"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                sessionState?.tvConnected ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              {sessionState?.tvConnected ? "Connected" : "Waiting..."}
            </Text>
          </View>
        </View>

        {/* Singers */}
        {sessionState?.singers.map((singer) => (
          <View
            key={singer.socketId}
            className="flex-row items-center py-2 border-b border-border"
          >
            <Smartphone size={18} color={colors.primary} />
            <Text className="text-foreground ml-3 flex-1">
              {singer.deviceName}
            </Text>
            <View className="px-2 py-0.5 rounded-full bg-green-500/20">
              <Text className="text-green-500 text-xs font-semibold">
                Connected
              </Text>
            </View>
          </View>
        ))}

        {(!sessionState?.singers || sessionState.singers.length === 0) && !sessionState?.tvConnected && (
          <Text className="text-muted-foreground text-sm py-2">
            No devices connected yet
          </Text>
        )}
      </View>

      {/* Disconnect */}
      <Pressable
        className="flex-row items-center justify-center py-4 bg-destructive/10 rounded-xl border border-destructive/30"
        onPress={handleDisconnect}
      >
        <LogOut size={18} color={colors.destructive} />
        <Text className="text-destructive font-bold text-base ml-2">
          Leave Session
        </Text>
      </Pressable>
    </ScrollView>
  );
}
