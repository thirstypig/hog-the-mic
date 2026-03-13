import React, { createContext, useContext, type ReactNode } from "react";
import { usePairing } from "../hooks/usePairing";
import { useQueue } from "../hooks/useQueue";
import type { PairingStatus, SessionStatePayload } from "../types/pairing.types";
import type { QueueEntry } from "../hooks/useQueue";

interface PairingContextValue {
  // Pairing state
  status: PairingStatus;
  sessionId: string | null;
  serverURL: string | null;
  sessionState: SessionStatePayload | null;
  errorMessage: string | null;
  handleQRScanned: (qrData: string) => Promise<void>;
  createSession: (serverBaseUrl: string) => Promise<void>;
  disconnect: () => void;
  // Queue state
  currentlyPlaying: QueueEntry | null;
  upcoming: QueueEntry[];
  isQueueFull: boolean;
  addToQueue: (song: {
    songId: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string | null;
  }) => void;
  removeFromQueue: (queueId: string) => void;
  reorderQueue: (queueId: string, newIndex: number) => void;
  skipSong: () => void;
}

const PairingCtx = createContext<PairingContextValue | null>(null);

export function PairingProvider({ children }: { children: ReactNode }) {
  const pairing = usePairing();
  const queue = useQueue();

  const value: PairingContextValue = {
    // Pairing
    status: pairing.status,
    sessionId: pairing.sessionId,
    serverURL: pairing.serverURL,
    sessionState: pairing.sessionState,
    errorMessage: pairing.errorMessage,
    handleQRScanned: pairing.handleQRScanned,
    createSession: pairing.createSession,
    disconnect: pairing.disconnect,
    // Queue
    currentlyPlaying: queue.currentlyPlaying,
    upcoming: queue.upcoming,
    isQueueFull: queue.isQueueFull,
    addToQueue: queue.addToQueue,
    removeFromQueue: queue.removeFromQueue,
    reorderQueue: queue.reorderQueue,
    skipSong: queue.skipSong,
  };

  return <PairingCtx.Provider value={value}>{children}</PairingCtx.Provider>;
}

export function usePairingContext(): PairingContextValue {
  const ctx = useContext(PairingCtx);
  if (!ctx) {
    throw new Error("usePairingContext must be used within a PairingProvider");
  }
  return ctx;
}
