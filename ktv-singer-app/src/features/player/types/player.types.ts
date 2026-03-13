export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricWord {
  time: number;
  word: string;
  lineIndex: number;
}
