import { useState } from "react";
import { View, Text, Pressable, Platform, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QRScannerView, connectSocket } from "@features/pairing";
import { setApiBaseUrl } from "@common/lib/api";
import type { RootStackParamList } from "@navigation/types";
import type { PairedPayload } from "@features/pairing";

type Nav = NativeStackNavigationProp<RootStackParamList, "Pair">;

const DEFAULT_SERVER_URL = "http://localhost:4040";

type Mode = "choose" | "scan" | "host";

export default function PairScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("choose");
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  /** QR scanned — connect as singer, then navigate to Session tabs */
  const handleQRScanned = async (qrData: string) => {
    try {
      const payload = JSON.parse(qrData);
      if (!payload.serverURL || !payload.sessionId) {
        setError("Invalid QR code");
        return;
      }

      setStatusText("Connecting...");
      setApiBaseUrl(payload.serverURL);
      const socket = connectSocket(payload.serverURL);

      socket.on("connect", () => {
        const deviceName =
          Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";
        socket.emit("join_session", {
          sessionId: payload.sessionId,
          role: "singer" as const,
          deviceName,
        });
      });

      socket.on("paired", (_data: PairedPayload) => {
        navigation.replace("Session");
      });

      socket.on("error", (err: { message: string }) => {
        setError(err.message);
        setStatusText(null);
      });

      socket.on("connect_error", () => {
        setError("Could not connect to server");
        setStatusText(null);
      });
    } catch {
      setError("Invalid QR code format");
    }
  };

  /** Host mode — create a session, connect, then navigate to Session tabs */
  const handleHost = async () => {
    try {
      setError(null);
      setStatusText("Creating session...");

      const res = await fetch(`${serverUrl}/api/pairing/sessions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create session");

      const { sessionId } = await res.json();
      setStatusText("Connecting...");
      setApiBaseUrl(serverUrl);

      const socket = connectSocket(serverUrl);

      socket.on("connect", () => {
        const deviceName =
          Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";
        socket.emit("join_session", {
          sessionId,
          role: "singer" as const,
          deviceName,
        });
      });

      socket.on("paired", (_data: PairedPayload) => {
        navigation.replace("Session");
      });

      socket.on("error", (err: { message: string }) => {
        setError(err.message);
        setStatusText(null);
      });

      socket.on("connect_error", () => {
        setError("Could not connect to server");
        setStatusText(null);
      });
    } catch {
      setError("Failed to create session");
      setStatusText(null);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable
          className="px-4 py-2 rounded-lg bg-muted"
          onPress={mode === "choose" ? handleBack : () => { setMode("choose"); setError(null); setStatusText(null); }}
        >
          <Text className="text-foreground">
            {mode === "choose" ? "Back" : "Cancel"}
          </Text>
        </Pressable>
        <Text className="text-lg text-foreground font-bold ml-4">
          {mode === "choose" ? "Connect" : mode === "scan" ? "Scan QR Code" : "Host Session"}
        </Text>
      </View>

      {/* Choose mode */}
      {mode === "choose" && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-xl font-bold mb-2">
            Start Karaoke
          </Text>
          <Text className="text-muted-foreground text-center mb-8">
            Host a session for others to join, or scan a TV's QR code
          </Text>

          <Pressable
            className="w-full bg-primary rounded-xl py-4 px-6 mb-4"
            onPress={() => setMode("host")}
          >
            <Text className="text-primary-foreground text-center font-bold text-lg">
              Host a Session
            </Text>
            <Text className="text-primary-foreground/70 text-center text-sm mt-1">
              Create a session and invite others
            </Text>
          </Pressable>

          <Pressable
            className="w-full bg-card border border-border rounded-xl py-4 px-6"
            onPress={() => setMode("scan")}
          >
            <Text className="text-foreground text-center font-bold text-lg">
              Scan QR Code
            </Text>
            <Text className="text-muted-foreground text-center text-sm mt-1">
              Join an existing session from a TV
            </Text>
          </Pressable>
        </View>
      )}

      {/* Scan mode */}
      {mode === "scan" && (
        <View className="flex-1">
          {statusText ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-foreground text-lg">{statusText}</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-destructive text-center mb-4">{error}</Text>
              <Pressable
                className="px-6 py-3 bg-muted rounded-lg"
                onPress={() => setError(null)}
              >
                <Text className="text-foreground">Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="px-4 py-3">
                <Text className="text-muted-foreground text-center">
                  Point your camera at the QR code on your TV
                </Text>
              </View>
              <QRScannerView onScanned={handleQRScanned} />
            </>
          )}
        </View>
      )}

      {/* Host mode */}
      {mode === "host" && (
        <View className="flex-1 px-6 pt-8">
          <Text className="text-foreground font-bold text-base mb-2">
            Server URL
          </Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-6"
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.x.x:4040"
            placeholderTextColor="#a3a3a3"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {error && (
            <Text className="text-destructive text-center mb-4">{error}</Text>
          )}

          {statusText ? (
            <View className="items-center py-6">
              <Text className="text-foreground text-lg">{statusText}</Text>
            </View>
          ) : (
            <Pressable
              className="bg-primary rounded-xl py-4"
              onPress={handleHost}
            >
              <Text className="text-primary-foreground text-center font-bold text-lg">
                Create Session
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
