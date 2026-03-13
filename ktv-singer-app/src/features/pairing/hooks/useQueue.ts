import { useState, useEffect, useCallback, useMemo } from "react";
import { getSocket } from "../utils/socketClient";

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
  const [isPaired, setIsPaired] = useState(() => getSocket()?.connected ?? false);

  // Register queue + connection listeners on mount.
  // Socket already exists by the time PairingProvider mounts (PairScreen connects first).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

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

    const handleConnect = () => setIsPaired(true);
    const handleDisconnect = () => setIsPaired(false);

    // Set initial state from current connection
    setIsPaired(socket.connected);

    socket.on("queue_updated", handleQueueUpdated);
    socket.on("play_song", handlePlaySong);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("queue_updated", handleQueueUpdated);
      socket.off("play_song", handlePlaySong);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

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
