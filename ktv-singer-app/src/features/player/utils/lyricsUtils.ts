import type { LyricLine, LyricWord } from "../types/player.types";

/**
 * Convert line-level lyrics to word-level with estimated timestamps.
 * Distributes time evenly across words between current and next line start.
 */
export function estimateWordTiming(lines: LyricLine[]): LyricWord[] {
  const words: LyricWord[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    const lineWords = currentLine.text.split(/\s+/).filter((w) => w.length > 0);
    if (lineWords.length === 0) continue;

    const lineEndTime = nextLine ? nextLine.time : currentLine.time + 5;
    const lineDuration = lineEndTime - currentLine.time;
    const timePerWord = lineDuration / lineWords.length;

    lineWords.forEach((word, wordIndex) => {
      words.push({
        time: currentLine.time + wordIndex * timePerWord,
        word,
        lineIndex: i,
      });
    });
  }

  return words;
}

/**
 * Find the currently active word based on current playback time.
 */
export function findActiveWord(
  words: LyricWord[],
  currentTime: number,
): number {
  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (currentTime >= words[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
