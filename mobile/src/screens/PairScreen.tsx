import { View, Text, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePairing, QRScannerView, PairingStatus } from "@features/pairing";

export default function PairScreen() {
  const navigation = useNavigation();
  const {
    status,
    sessionId,
    sessionState,
    errorMessage,
    handleQRScanned,
    disconnect,
  } = usePairing();

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
