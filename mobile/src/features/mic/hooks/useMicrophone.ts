import { useState, useCallback, useRef, useEffect } from "react";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { File as ExpoFile } from "expo-file-system";
import { getSocket } from "@features/pairing/utils/socketClient";
import type { MicStatus } from "../types/mic.types";

const CHUNK_DURATION_MS = 500;

/** M4A recording (AAC) — most reliable on iOS, then send as base64 */
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: false,
};

export function useMicrophone() {
  const [status, setStatus] = useState<MicStatus>("idle");
  const isStreamingRef = useRef(false);
  const isMutedRef = useRef(false);

  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  const startStreaming = useCallback(async () => {
    try {
      // Request permission
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        console.log("[mic] Permission denied");
        setStatus("error");
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      const socket = getSocket();
      if (!socket?.connected) {
        console.log("[mic] Socket not connected");
        setStatus("error");
        return;
      }

      isStreamingRef.current = true;
      setStatus("streaming");
      socket.emit("audio_start");

      // Recording loop — each iteration is one chunk
      const recordLoop = async () => {
        while (isStreamingRef.current) {
          try {
            await recorder.prepareToRecordAsync();
            recorder.record();

            // Wait for chunk duration
            await new Promise<void>((resolve) =>
              setTimeout(resolve, CHUNK_DURATION_MS),
            );

            if (!isStreamingRef.current) {
              try { await recorder.stop(); } catch {}
              break;
            }

            await recorder.stop();
            const uri = recorder.uri;

            if (uri && !isMutedRef.current && isStreamingRef.current) {
              try {
                const file = new ExpoFile(uri);
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = "";
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                const sock = getSocket();
                if (sock?.connected) {
                  sock.emit("audio_chunk", base64 as unknown as Buffer);
                }
                try { file.delete(); } catch {}
              } catch (readErr) {
                console.log("[mic] file read error:", readErr);
              }
            } else if (uri) {
              try { new ExpoFile(uri).delete(); } catch {}
            }
          } catch (err) {
            console.log("[mic] chunk error:", err);
            // Brief pause before retry to avoid tight error loop
            await new Promise<void>((resolve) => setTimeout(resolve, 200));
          }
        }
      };

      recordLoop();
    } catch (err) {
      console.log("[mic] startStreaming error:", err);
      setStatus("error");
    }
  }, [recorder]);

  const stopStreaming = useCallback(async () => {
    isStreamingRef.current = false;
    setStatus("idle");

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("audio_stop");
    }

    try { await recorder.stop(); } catch {}

    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
  }, [recorder]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setStatus(isMutedRef.current ? "muted" : "streaming");
  }, []);

  return {
    status,
    isMuted: status === "muted",
    startStreaming,
    stopStreaming,
    toggleMute,
  };
}
