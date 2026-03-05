import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { connectSocket, disconnectSocket, getSocket, onSocketChange } from "../utils/socketClient";
import type {
  QRPayload,
  PairingStatus,
  SessionStatePayload,
  PairedPayload,
} from "../types/pairing.types";

export function usePairing() {
  const [status, setStatus] = useState<PairingStatus>(() => {
    const s = getSocket();
    return s?.connected ? "paired" : "idle";
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverURL, setServerURL] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionStatePayload | null>(
    null,
  );

  // Track socket changes reactively (no destructive cleanup)
  useEffect(() => {
    return onSocketChange((s) => {
      if (!s) {
        setStatus("idle");
        setSessionState(null);
      }
    });
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
        const deviceName =
          Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";
        socket.emit("join_session", {
          sessionId: payload.sessionId,
          role: "singer" as const,
          deviceName,
        });
      });

      socket.on("paired", (data: PairedPayload) => {
        setStatus("paired");
        setSessionId(data.sessionId);
      });

      socket.on("session_state", (state: SessionStatePayload) => {
        setSessionState(state);
      });

      socket.on("error", (err: { message: string }) => {
        setStatus("error");
        setErrorMessage(err.message);
      });

      socket.on("connect_error", () => {
        setStatus("error");
        setErrorMessage("Could not connect to server");
      });

      socket.on("disconnect", () => {
        setStatus("idle");
        setSessionState(null);
      });
    } catch {
      setStatus("error");
      setErrorMessage("Invalid QR code format");
    }
  }, []);

  /** Create a new session (host mode) and connect as singer */
  const createSession = useCallback(async (serverBaseUrl: string) => {
    try {
      setStatus("connecting");
      setServerURL(serverBaseUrl);

      const res = await fetch(`${serverBaseUrl}/api/pairing/sessions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create session");

      const { sessionId: newSessionId } = await res.json();
      setSessionId(newSessionId);

      const socket = connectSocket(serverBaseUrl);

      socket.on("connect", () => {
        const deviceName =
          Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";
        socket.emit("join_session", {
          sessionId: newSessionId,
          role: "singer" as const,
          deviceName,
        });
      });

      socket.on("paired", (data: PairedPayload) => {
        setStatus("paired");
        setSessionId(data.sessionId);
      });

      socket.on("session_state", (state: SessionStatePayload) => {
        setSessionState(state);
      });

      socket.on("error", (err: { message: string }) => {
        setStatus("error");
        setErrorMessage(err.message);
      });

      socket.on("connect_error", () => {
        setStatus("error");
        setErrorMessage("Could not connect to server");
      });

      socket.on("disconnect", () => {
        setStatus("idle");
        setSessionState(null);
      });
    } catch {
      setStatus("error");
      setErrorMessage("Failed to create session");
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
    createSession,
    disconnect,
    socket: getSocket(),
  };
}
