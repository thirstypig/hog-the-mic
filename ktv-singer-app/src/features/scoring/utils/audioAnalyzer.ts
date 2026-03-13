import type { CalculatedScores } from "../types/scoring.types";

/**
 * Audio analyzer stub for React Native.
 *
 * The web version used the Web Audio API (AudioContext, AnalyserNode,
 * MediaStream).  On React Native / tvOS we need to use expo-av or
 * react-native-audio-api instead.
 *
 * TODO: Implement with expo-av Recording + Audio.Sound for playback monitoring.
 * The interface is kept identical so the useRecording hook works unchanged.
 */
export class VocalAnalyzer {
  private pitchSamples: number[] = [];
  private timingDiffs: number[] = [];

  async initialize(): Promise<boolean> {
    // TODO: Request microphone permission via expo-av
    // const { status } = await Audio.requestPermissionsAsync();
    // return status === 'granted';
    console.warn("VocalAnalyzer: not yet implemented for React Native");
    return false;
  }

  detectPitch(): void {
    // TODO: Analyze audio buffer from expo-av recording
    this.pitchSamples.push(0);
  }

  recordTiming(expectedTime: number, actualTime: number): void {
    this.timingDiffs.push(Math.abs(expectedTime - actualTime));
  }

  enableMonitoring(): void {
    // TODO: Route mic input to speakers via expo-av
  }

  disableMonitoring(): void {
    // TODO: Stop routing mic to speakers
  }

  calculateScores(): CalculatedScores {
    const pitchScore = Math.min(100, Math.max(0, 50));
    const timingScore =
      this.timingDiffs.length > 0
        ? Math.min(
            100,
            Math.max(
              0,
              100 -
                (this.timingDiffs.reduce((a, b) => a + b, 0) /
                  this.timingDiffs.length) *
                  20,
            ),
          )
        : 50;
    const rhythmScore = 50;
    const totalScore = Math.round(
      pitchScore * 0.4 + timingScore * 0.35 + rhythmScore * 0.25,
    );

    return { totalScore, pitchScore, timingScore, rhythmScore };
  }

  cleanup(): void {
    this.pitchSamples = [];
    this.timingDiffs = [];
    // TODO: Release expo-av resources
  }
}
