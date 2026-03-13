import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socketClient";
import type { Socket } from "../utils/socketClient";
import type {
  QRPayload,
  PairingStatus,
  SessionStatePayload,
  PairedPayload,
} from "../types/pairing.types";

const deviceName =
  Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android" : "Device";

interface PairingSetters {
  setStatus: (s: PairingStatus) => void;
  setSessionId: (id: string | null) => void;
  setSessionState: (state: SessionStatePayload | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

function attachSocketListeners(
  socket: Socket,
  targetSessionId: string,
  { setStatus, setSessionId, setSessionState, setErrorMessage }: PairingSetters,
) {
  socket.on("connect", () => {
    socket.emit("join_session", {
      sessionId: targetSessionId,
      role: "singer",
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
}

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

  // No cleanup effect — socket lifecycle is managed explicitly via disconnect().
  // PairingProvider stays mounted for the entire session, so there is no
  // unmount-triggered teardown needed.

  const setters: PairingSetters = { setStatus, setSessionId, setSessionState, setErrorMessage };

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
      attachSocketListeners(socket, payload.sessionId, setters);
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
      attachSocketListeners(socket, newSessionId, setters);
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
  };
}
