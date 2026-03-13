import { useState, useCallback } from "react";
import { useCameraPermissions } from "expo-camera";

export function useQRScanner(onScanned: (data: string) => void) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      onScanned(data);
    },
    [scanned, onScanned],
  );

  const resetScanner = useCallback(() => {
    setScanned(false);
  }, []);

  return {
    permission,
    requestPermission,
    scanned,
    handleBarCodeScanned,
    resetScanner,
  };
}
