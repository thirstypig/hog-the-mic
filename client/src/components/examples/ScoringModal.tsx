import { useState } from 'react';
import ScoringModal from '../ScoringModal';
import { Button } from '@/components/ui/button';

export default function ScoringModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-modal">
        Show Score
      </Button>
      <ScoringModal
        open={open}
        onClose={() => setOpen(false)}
        totalScore={87}
        breakdown={{ pitch: 92, timing: 85, rhythm: 84 }}
        songTitle="Never Gonna Give You Up - Rick Astley"
        onTryAgain={() => {
          console.log('Try again');
          setOpen(false);
        }}
        onNextSong={() => {
          console.log('Next song');
          setOpen(false);
        }}
      />
    </div>
  );
}
