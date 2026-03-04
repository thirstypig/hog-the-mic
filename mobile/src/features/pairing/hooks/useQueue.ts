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

    socket.on("queue_updated", handleQueueUpdated);
    socket.on("play_song", handlePlaySong);

    return () => {
      socket.off("queue_updated", handleQueueUpdated);
      socket.off("play_song", handlePlaySong);
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

  const isPaired = useMemo(() => {
    const socket = getSocket();
    return socket?.connected ?? false;
  }, [queueState]); // re-evaluate when queue state changes (proxy for connection)

  return {
    currentlyPlaying: queueState.currentlyPlaying,
    upcoming: queueState.upcoming,
    isPaired,
    addToQueue,
    removeFromQueue,
    skipSong,
  };
}
