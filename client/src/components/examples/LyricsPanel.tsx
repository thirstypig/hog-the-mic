import { useState, useEffect } from 'react';
import LyricsPanel from '../LyricsPanel';

const mockLyrics = [
  { time: 0, text: "We're no strangers to love" },
  { time: 3, text: "You know the rules and so do I" },
  { time: 6, text: "A full commitment's what I'm thinking of" },
  { time: 10, text: "You wouldn't get this from any other guy" },
  { time: 14, text: "I just wanna tell you how I'm feeling" },
  { time: 18, text: "Gotta make you understand" },
  { time: 22, text: "Never gonna give you up" },
  { time: 25, text: "Never gonna let you down" },
];

export default function LyricsPanelExample() {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev + 1) % 30);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-96 bg-background">
      <LyricsPanel lines={mockLyrics} currentTime={currentTime} isPlaying={true} />
    </div>
  );
}
