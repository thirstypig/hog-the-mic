import { Trophy, TrendingUp, Clock, Music } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ScoreBreakdown {
  pitch: number;
  timing: number;
  rhythm: number;
}

interface ScoringModalProps {
  open: boolean;
  onClose: () => void;
  totalScore: number;
  breakdown: ScoreBreakdown;
  songTitle: string;
  onTryAgain: () => void;
  onNextSong: () => void;
}

export default function ScoringModal({
  open,
  onClose,
  totalScore,
  breakdown,
  songTitle,
  onTryAgain,
  onNextSong,
}: ScoringModalProps) {
  const getFeedback = (score: number) => {
    if (score >= 90) return { text: 'Legendary Performance!', color: 'text-chart-4' };
    if (score >= 75) return { text: 'Great Job!', color: 'text-primary' };
    if (score >= 60) return { text: 'Nice Effort!', color: 'text-secondary' };
    return { text: 'Keep Practicing!', color: 'text-accent' };
  };

  const feedback = getFeedback(totalScore);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg backdrop-blur-2xl bg-card/95 border-border" data-testid="modal-scoring">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Performance Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(totalScore / 100) * 351.86} 351.86`}
                  className="transition-all duration-1000"
                  style={{
                    filter: 'drop-shadow(0 0 8px hsl(var(--primary)))',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold" data-testid="text-total-score">
                    {totalScore}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </div>
            <p className={`text-xl font-semibold ${feedback.color}`} data-testid="text-feedback">
              {feedback.text}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-1" data-testid="text-song-title">
              {songTitle}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Score Breakdown
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <span>Pitch Accuracy</span>
                  </div>
                  <span className="font-mono font-semibold" data-testid="text-pitch-score">
                    {breakdown.pitch}%
                  </span>
                </div>
                <Progress value={breakdown.pitch} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>Timing</span>
                  </div>
                  <span className="font-mono font-semibold" data-testid="text-timing-score">
                    {breakdown.timing}%
                  </span>
                </div>
                <Progress value={breakdown.timing} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span>Rhythm</span>
                  </div>
                  <span className="font-mono font-semibold" data-testid="text-rhythm-score">
                    {breakdown.rhythm}%
                  </span>
                </div>
                <Progress value={breakdown.rhythm} className="h-2" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onTryAgain}
              data-testid="button-try-again"
            >
              Try Again
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={onNextSong}
              data-testid="button-next-song"
            >
              Next Song
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
