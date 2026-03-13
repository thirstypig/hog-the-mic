import { useState, useEffect, useRef } from "react";

/**
 * Player state hook adapted for react-native-youtube-iframe.
 *
 * The web version polled a YouTube IFrame player instance every 250ms.
 * react-native-youtube-iframe exposes `onChangeState` and `getCurrentTime()`
 * via a ref, so we keep the same interface but wire it differently.
 */
export function usePlayer() {
  const [playerRef, setPlayerRef] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const onVideoEndedRef = useRef<(() => void) | null>(null);

  const handlePlayerReady = (ref: any) => {
    setPlayerRef(ref);
  };

  const handleStateChange = (state: string) => {
    setIsPlaying(state === "playing");
    if (state === "ended") {
      onVideoEndedRef.current?.();
    }
  };

  // Poll current time while playing
  useEffect(() => {
    if (!playerRef || !isPlaying) return;

    const interval = setInterval(async () => {
      try {
        const time = await playerRef.getCurrentTime();
        setCurrentTime(time);
      } catch {
        // player might not be ready yet
      }
    }, 250);

    return () => clearInterval(interval);
  }, [playerRef, isPlaying]);

  return {
    playerRef,
    currentTime,
    setCurrentTime,
    isPlaying,
    volume,
    setVolume,
    onVideoEndedRef,
    handlePlayerReady,
    handleStateChange,
  };
}
