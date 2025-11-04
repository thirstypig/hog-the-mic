import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  onReady?: (player: any) => void;
  onStateChange?: (event: any) => void;
}

export default function VideoPlayer({ videoId, onReady, onStateChange }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);

  // Keep refs up to date
  useEffect(() => {
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
  });

  useEffect(() => {
    if (!containerRef.current || !videoId) return;

    const initPlayer = () => {
      if (!(window as any).YT) {
        setTimeout(initPlayer, 100);
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          autoplay: 0,
          fs: 1,
          playsinline: 1,
          start: 0,
        },
        events: {
          onReady: (event: any) => {
            // Ensure video starts from the beginning
            event.target.seekTo(0, true);
            event.target.playVideo();
            onReadyRef.current?.(event.target);
          },
          onStateChange: (event: any) => {
            onStateChangeRef.current?.(event);
          },
        },
      });
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  return (
    <div className="w-full max-w-7xl mx-auto aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" data-testid="video-player" />
    </div>
  );
}
