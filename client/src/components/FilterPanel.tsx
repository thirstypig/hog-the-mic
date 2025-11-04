import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterPanelProps {
  selectedGenders: string[];
  selectedGenres: string[];
  selectedDecades: string[];
  onGenderChange: (genders: string[]) => void;
  onGenreChange: (genres: string[]) => void;
  onDecadeChange: (decades: string[]) => void;
  onClearAll: () => void;
}

const genders = ['Male', 'Female', 'Duet'];
const genres = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'Electronic', 'Soul'];
const decades = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

export default function FilterPanel({
  selectedGenders,
  selectedGenres,
  selectedDecades,
  onGenderChange,
  onGenreChange,
  onDecadeChange,
  onClearAll,
}: FilterPanelProps) {
  const totalFilters = selectedGenders.length + selectedGenres.length + selectedDecades.length;

  const handleGenderToggle = (gender: string) => {
    const newGenders = selectedGenders.includes(gender)
      ? selectedGenders.filter((g) => g !== gender)
      : [...selectedGenders, gender];
    onGenderChange(newGenders);
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onGenreChange(newGenres);
  };

  const handleDecadeToggle = (decade: string) => {
    const newDecades = selectedDecades.includes(decade)
      ? selectedDecades.filter((d) => d !== decade)
      : [...selectedDecades, decade];
    onDecadeChange(newDecades);
  };

  return (
    <div className="w-full md:w-64 space-y-4" data-testid="filter-panel">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Filters</h3>
          {totalFilters > 0 && (
            <Badge variant="default" className="ml-2" data-testid="badge-filter-count">
              {totalFilters}
            </Badge>
          )}
        </div>
        {totalFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            data-testid="button-clear-filters"
          >
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <Accordion type="multiple" defaultValue={['gender', 'genre', 'decade']} className="px-4">
          <AccordionItem value="gender">
            <AccordionTrigger className="text-sm font-medium">
              Gender ({selectedGenders.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {genders.map((gender) => (
                  <div key={gender} className="flex items-center gap-2">
                    <Checkbox
                      id={`gender-${gender}`}
                      checked={selectedGenders.includes(gender)}
                      onCheckedChange={() => handleGenderToggle(gender)}
                      data-testid={`checkbox-gender-${gender.toLowerCase()}`}
                    />
                    <Label
                      htmlFor={`gender-${gender}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {gender}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="genre">
            <AccordionTrigger className="text-sm font-medium">
              Genre ({selectedGenres.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {genres.map((genre) => (
                  <div key={genre} className="flex items-center gap-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={() => handleGenreToggle(genre)}
                      data-testid={`checkbox-genre-${genre.toLowerCase().replace(' ', '-')}`}
                    />
                    <Label
                      htmlFor={`genre-${genre}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="decade">
            <AccordionTrigger className="text-sm font-medium">
              Decade ({selectedDecades.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {decades.map((decade) => (
                  <div key={decade} className="flex items-center gap-2">
                    <Checkbox
                      id={`decade-${decade}`}
                      checked={selectedDecades.includes(decade)}
                      onCheckedChange={() => handleDecadeToggle(decade)}
                      data-testid={`checkbox-decade-${decade}`}
                    />
                    <Label
                      htmlFor={`decade-${decade}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {decade}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      {totalFilters > 0 && (
        <div className="p-4 space-y-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {selectedGenders.map((gender) => (
              <Badge
                key={gender}
                variant="default"
                className="gap-1"
                data-testid={`active-filter-${gender.toLowerCase()}`}
              >
                {gender}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleGenderToggle(gender)}
                />
              </Badge>
            ))}
            {selectedGenres.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="gap-1"
                data-testid={`active-filter-${genre.toLowerCase().replace(' ', '-')}`}
              >
                {genre}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleGenreToggle(genre)}
                />
              </Badge>
            ))}
            {selectedDecades.map((decade) => (
              <Badge
                key={decade}
                variant="outline"
                className="gap-1 bg-accent/20 text-accent"
                data-testid={`active-filter-${decade}`}
              >
                {decade}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleDecadeToggle(decade)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
