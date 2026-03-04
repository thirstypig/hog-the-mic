export { usePairing } from "./hooks/usePairing";
export { useQRScanner } from "./hooks/useQRScanner";
export { useQueue } from "./hooks/useQueue";
export { QRScannerView } from "./components/QRScannerView";
export { PairingStatus } from "./components/PairingStatus";
export { PairingProvider, usePairingContext } from "./context/PairingContext";
export { connectSocket, disconnectSocket, getSocket } from "./utils/socketClient";
export type {
  QRPayload,
  PairedPayload,
  PairingStatus as PairingStatusType,
  SessionStatePayload,
} from "./types/pairing.types";
export type { QueueEntry } from "./hooks/useQueue";
