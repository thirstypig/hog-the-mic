import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socketClient";
import type {
  QRPayload,
  PairingStatus,
  SessionStatePayload,
  PairedPayload,
} from "../types/pairing.types";

export function usePairing() {
  const [status, setStatus] = useState<PairingStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverURL, setServerURL] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionStatePayload | null>(
    null,
  );
  const cleanupRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      disconnectSocket();
    };
  }, []);

  /** Handle a scanned QR code result */
  const handleQRScanned = useCallback(async (qrData: string) => {
    try {
      const payload: QRPayload = JSON.parse(qrData);
      if (!payload.serverURL || !payload.sessionId) {
        setStatus("error");
        setErrorMessage("Invalid QR code");
        return;
      }

      setStatus("connecting");
      setServerURL(payload.serverURL);
      setSessionId(payload.sessionId);

      const socket = connectSocket(payload.serverURL);

      socket.on("connect", () => {
        if (cleanupRef.current) return;

        // Join the session as a singer
        const deviceName =
          Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";
        socket.emit("join_session", {
          sessionId: payload.sessionId,
          role: "singer" as const,
          deviceName,
        });
      });

      socket.on("paired", (data: PairedPayload) => {
        if (cleanupRef.current) return;
        setStatus("paired");
        setSessionId(data.sessionId);
      });

      socket.on("session_state", (state: SessionStatePayload) => {
        if (cleanupRef.current) return;
        setSessionState(state);
      });

      socket.on("error", (err: { message: string }) => {
        if (cleanupRef.current) return;
        setStatus("error");
        setErrorMessage(err.message);
      });

      socket.on("connect_error", () => {
        if (cleanupRef.current) return;
        setStatus("error");
        setErrorMessage("Could not connect to server");
      });

      socket.on("disconnect", () => {
        if (cleanupRef.current) return;
        setStatus("idle");
        setSessionState(null);
      });
    } catch {
      setStatus("error");
      setErrorMessage("Invalid QR code format");
    }
  }, []);

  /** Disconnect from the current session */
  const disconnect = useCallback(() => {
    disconnectSocket();
    setStatus("idle");
    setSessionId(null);
    setServerURL(null);
    setSessionState(null);
    setErrorMessage(null);
  }, []);

  return {
    status,
    sessionId,
    serverURL,
    sessionState,
    errorMessage,
    handleQRScanned,
    disconnect,
    socket: getSocket(),
  };
}
