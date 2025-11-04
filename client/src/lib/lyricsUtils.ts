interface LyricLine {
  time: number;
  text: string;
}

interface LyricWord {
  time: number;
  word: string;
  lineIndex: number;
}

/**
 * Convert line-level lyrics to word-level with estimated timestamps
 * Distributes time evenly across words between current line start and next line start
 */
export function estimateWordTiming(lines: LyricLine[]): LyricWord[] {
  const words: LyricWord[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    // Split line into words
    const lineWords = currentLine.text.split(/\s+/).filter(w => w.length > 0);
    
    if (lineWords.length === 0) continue;

    // Calculate time available for this line
    // If there's a next line, use its start time; otherwise add 5 seconds
    const lineEndTime = nextLine ? nextLine.time : currentLine.time + 5;
    const lineDuration = lineEndTime - currentLine.time;
    
    // Distribute time evenly across words
    const timePerWord = lineDuration / lineWords.length;

    // Create word entries with estimated timestamps
    lineWords.forEach((word, wordIndex) => {
      words.push({
        time: currentLine.time + (wordIndex * timePerWord),
        word,
        lineIndex: i,
      });
    });
  }

  return words;
}

/**
 * Find the currently active word based on current playback time
 */
export function findActiveWord(words: LyricWord[], currentTime: number): number {
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
