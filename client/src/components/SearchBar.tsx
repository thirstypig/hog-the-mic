import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onVideoLink: (url: string) => void;
}

export default function SearchBar({ onSearch, onVideoLink }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = value.match(youtubeRegex);

    if (match) {
      onVideoLink(value);
    } else {
      onSearch(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search songs or paste YouTube link..."
            className="pl-12 h-12 bg-card/50 backdrop-blur-md border-border/50 focus-visible:border-primary focus-visible:ring-primary text-base"
            data-testid="input-search"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
          data-testid="button-search"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
