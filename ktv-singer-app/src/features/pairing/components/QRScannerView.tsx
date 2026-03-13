import { View, Text, Pressable } from "react-native";
import { CameraView } from "expo-camera";
import { useQRScanner } from "../hooks/useQRScanner";

interface QRScannerViewProps {
  onScanned: (data: string) => void;
}

export function QRScannerView({ onScanned }: QRScannerViewProps) {
  const { permission, requestPermission, scanned, handleBarCodeScanned, resetScanner } =
    useQRScanner(onScanned);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-4">
        <Text className="text-foreground text-center px-8">
          Camera access is needed to scan the QR code on your TV
        </Text>
        <Pressable
          className="px-6 py-3 rounded-lg bg-primary"
          onPress={requestPermission}
        >
          <Text className="text-primary-foreground font-bold">
            Grant Camera Access
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <Pressable
            className="px-6 py-3 rounded-lg bg-primary"
            onPress={resetScanner}
          >
            <Text className="text-primary-foreground font-bold">
              Scan Again
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
