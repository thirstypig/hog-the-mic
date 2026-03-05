import { useState, useEffect, useCallback, useMemo } from "react";
import { getSocket, onSocketChange } from "../utils/socketClient";
import type { Socket } from "socket.io-client";

export interface QueueEntry {
  queueId: string;
  songId: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  addedBy: string;
  addedBySocketId: string;
  addedAt: number;
}

interface QueueState {
  currentlyPlaying: QueueEntry | null;
  upcoming: QueueEntry[];
}

export function useQueue() {
  const [queueState, setQueueState] = useState<QueueState>({
    currentlyPlaying: null,
    upcoming: [],
  });
  const [currentSocket, setCurrentSocket] = useState<Socket | null>(getSocket);

  // Track socket availability reactively
  useEffect(() => {
    return onSocketChange((s) => {
      setCurrentSocket(s);
    });
  }, []);

  // Register queue listeners whenever socket changes
  useEffect(() => {
    if (!currentSocket) return;

    const handleQueueUpdated = (data: {
      currentlyPlaying: QueueEntry | null;
      upcoming: QueueEntry[];
    }) => {
      setQueueState({
        currentlyPlaying: data.currentlyPlaying,
        upcoming: data.upcoming,
      });
    };

    const handlePlaySong = (data: { entry: QueueEntry }) => {
      setQueueState((prev) => ({
        ...prev,
        currentlyPlaying: data.entry,
      }));
    };

    currentSocket.on("queue_updated", handleQueueUpdated);
    currentSocket.on("play_song", handlePlaySong);

    return () => {
      currentSocket.off("queue_updated", handleQueueUpdated);
      currentSocket.off("play_song", handlePlaySong);
    };
  }, [currentSocket]);

  const addToQueue = useCallback(
    (song: {
      songId: string;
      videoId: string;
      title: string;
      artist: string;
      thumbnailUrl: string | null;
    }) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("add_to_queue", song);
    },
    [],
  );

  const removeFromQueue = useCallback((queueId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("remove_from_queue", { queueId });
  }, []);

  const skipSong = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("skip_song");
  }, []);

  const reorderQueue = useCallback((queueId: string, newIndex: number) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("reorder_queue", { queueId, newIndex });
  }, []);

  const isPaired = useMemo(() => {
    return currentSocket?.connected ?? false;
  }, [currentSocket]);

  const isQueueFull = useMemo(() => {
    const total =
      queueState.upcoming.length + (queueState.currentlyPlaying ? 1 : 0);
    return total >= 10;
  }, [queueState]);

  return {
    currentlyPlaying: queueState.currentlyPlaying,
    upcoming: queueState.upcoming,
    isPaired,
    isQueueFull,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    skipSong,
  };
}
