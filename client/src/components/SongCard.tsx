import { Play, User, Music } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SongCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  genre: string;
  gender: 'male' | 'female' | 'duet';
  year: number;
  playCount?: number;
  onPlay: (id: string) => void;
}

export default function SongCard({
  id,
  title,
  artist,
  thumbnailUrl,
  genre,
  gender,
  year,
  playCount = 0,
  onPlay,
}: SongCardProps) {
  const genderColors = {
    male: 'bg-primary/20 text-primary',
    female: 'bg-secondary/20 text-secondary',
    duet: 'bg-accent/20 text-accent',
  };

  return (
    <Card 
      className="group relative overflow-hidden hover-elevate cursor-pointer transition-all duration-300"
      onClick={() => onPlay(id)}
      data-testid={`card-song-${id}`}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Button
          size="icon"
          variant="default"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full"
          data-testid={`button-play-${id}`}
        >
          <Play className="w-6 h-6 fill-current" />
        </Button>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-title-${id}`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1" data-testid={`text-artist-${id}`}>
          {artist}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className={genderColors[gender]} data-testid={`badge-gender-${id}`}>
            <User className="w-3 h-3 mr-1" />
            {gender}
          </Badge>
          <Badge variant="outline" className="bg-accent/20 text-accent" data-testid={`badge-genre-${id}`}>
            {genre}
          </Badge>
          <Badge variant="outline" className="bg-muted/20 text-muted-foreground" data-testid={`badge-year-${id}`}>
            {year}
          </Badge>
          {playCount > 0 && (
            <Badge variant="outline" className="bg-primary/20 text-primary" data-testid={`badge-plays-${id}`}>
              <Music className="w-3 h-3 mr-1" />
              {playCount} {playCount === 1 ? 'play' : 'plays'}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
