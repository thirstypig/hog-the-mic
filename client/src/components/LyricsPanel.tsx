import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsPanelProps {
  lines: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  position?: 'bottom' | 'right';
}

export default function LyricsPanel({ lines, currentTime, isPlaying, position = 'bottom' }: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find active line index based on current time
  const activeLineIndex = lines.findIndex((line, index) => {
    const nextLine = lines[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "backdrop-blur-xl bg-black/80 border-border overflow-y-auto rounded-lg",
        position === 'bottom' 
          ? "fixed bottom-0 left-0 right-0 h-48 md:h-64 border-t"
          : "w-96 h-[500px] border"
      )}
      data-testid="lyrics-panel"
    >
      <div className={cn(
        "flex flex-col items-center py-8 px-4",
        position === 'bottom' ? 'justify-center min-h-full' : 'justify-start'
      )}>
        {lines.length === 0 ? (
          <div className="text-center text-muted-foreground" data-testid="no-lyrics-message">
            <p className="text-xl md:text-2xl mb-2">No synced lyrics available</p>
            <p className="text-sm md:text-base">This song doesn't have synchronized lyrics in the database</p>
          </div>
        ) : (
          lines.map((line, lineIndex) => {
            const isActiveLine = lineIndex === activeLineIndex;
            const isPastLine = lineIndex < activeLineIndex;
            
            return (
              <div
                key={lineIndex}
                ref={isActiveLine ? activeLineRef : null}
                className={cn(
                  'text-center transition-all duration-300 py-2',
                  isActiveLine
                    ? position === 'bottom' 
                      ? 'text-4xl md:text-5xl font-semibold scale-105 text-primary'
                      : 'text-2xl md:text-3xl font-semibold scale-105 text-primary'
                    : isPastLine
                    ? position === 'bottom'
                      ? 'text-2xl md:text-3xl font-medium text-muted-foreground/40'
                      : 'text-lg md:text-xl font-medium text-muted-foreground/40'
                    : position === 'bottom'
                      ? 'text-2xl md:text-3xl font-medium text-muted-foreground/60'
                      : 'text-lg md:text-xl font-medium text-muted-foreground/60'
                )}
                style={
                  isActiveLine
                    ? { textShadow: '0 0 20px hsl(var(--primary))' }
                    : undefined
                }
                data-testid={`lyric-line-${lineIndex}`}
                aria-current={isActiveLine ? 'true' : undefined}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
