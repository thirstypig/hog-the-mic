import { useState } from 'react';
import FilterPanel from '../FilterPanel';

export default function FilterPanelExample() {
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['Male']);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Pop', 'Rock']);
  const [selectedDecades, setSelectedDecades] = useState<string[]>(['2000s']);

  return (
    <div className="p-8 bg-background">
      <FilterPanel
        selectedGenders={selectedGenders}
        selectedGenres={selectedGenres}
        selectedDecades={selectedDecades}
        onGenderChange={setSelectedGenders}
        onGenreChange={setSelectedGenres}
        onDecadeChange={setSelectedDecades}
        onClearAll={() => {
          setSelectedGenders([]);
          setSelectedGenres([]);
          setSelectedDecades([]);
        }}
      />
    </div>
  );
}
