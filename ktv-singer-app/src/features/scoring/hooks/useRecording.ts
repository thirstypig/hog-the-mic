import { useState, useRef, useEffect } from "react";
import { useToast } from "@common/hooks/use-toast";
import { VocalAnalyzer } from "../utils/audioAnalyzer";
import type { CalculatedScores } from "../types/scoring.types";
import type { Song } from "@shared/schema";

interface UseRecordingOptions {
  currentSong: Song | null;
  currentTime: number;
}

export function useRecording({ currentSong, currentTime }: UseRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMicMonitoring, setIsMicMonitoring] = useState(false);
  const [calculatedScores, setCalculatedScores] = useState<CalculatedScores>({
    totalScore: 0,
    pitchScore: 0,
    timingScore: 0,
    rhythmScore: 0,
  });
  const [showScoring, setShowScoring] = useState(false);
  const vocalAnalyzerRef = useRef<VocalAnalyzer | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    if (!vocalAnalyzerRef.current) {
      vocalAnalyzerRef.current = new VocalAnalyzer();
    }

    const success = await vocalAnalyzerRef.current.initialize();
    if (success) {
      setIsRecording(true);
      toast({
        title: "Microphone Active",
        description: "Your performance is being analyzed!",
      });

      const interval = setInterval(() => {
        if (vocalAnalyzerRef.current) {
          vocalAnalyzerRef.current.detectPitch();
          if (currentSong?.lyrics && currentSong.lyrics.length > 0) {
            let activeIndex = -1;
            for (let i = 0; i < currentSong.lyrics.length; i++) {
              if (currentTime >= currentSong.lyrics[i].time) {
                activeIndex = i;
              }
            }
            if (activeIndex >= 0) {
              vocalAnalyzerRef.current.recordTiming(
                currentSong.lyrics[activeIndex].time,
                currentTime,
              );
            }
          }
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecordingAndShowScore = () => {
    if (vocalAnalyzerRef.current) {
      const scores = vocalAnalyzerRef.current.calculateScores();
      setCalculatedScores(scores);
      vocalAnalyzerRef.current.cleanup();
      vocalAnalyzerRef.current = null;
    }
    setIsRecording(false);
    setIsMicMonitoring(false);
    setShowScoring(true);
  };

  const toggleMicMonitoring = async () => {
    if (!vocalAnalyzerRef.current) {
      vocalAnalyzerRef.current = new VocalAnalyzer();
      const initialized = await vocalAnalyzerRef.current.initialize();
      if (!initialized) {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use this feature.",
          variant: "destructive",
        });
        return;
      }
    }

    if (isMicMonitoring) {
      vocalAnalyzerRef.current.disableMonitoring();
      setIsMicMonitoring(false);
      toast({
        title: "Mic Monitoring OFF",
        description: "Your voice is no longer playing through speakers.",
      });
    } else {
      vocalAnalyzerRef.current.enableMonitoring();
      setIsMicMonitoring(true);
      toast({
        title: "Mic Monitoring ON",
        description:
          "You can now hear yourself through the speakers while singing!",
      });
    }
  };

  const resetScores = () => {
    setCalculatedScores({
      totalScore: 0,
      pitchScore: 0,
      timingScore: 0,
      rhythmScore: 0,
    });
  };

  useEffect(() => {
    return () => {
      if (vocalAnalyzerRef.current) {
        vocalAnalyzerRef.current.cleanup();
      }
    };
  }, []);

  return {
    isRecording,
    isMicMonitoring,
    calculatedScores,
    showScoring,
    setShowScoring,
    startRecording,
    stopRecordingAndShowScore,
    toggleMicMonitoring,
    resetScores,
  };
}
