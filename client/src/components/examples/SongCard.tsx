import SongCard from '../SongCard';

export default function SongCardExample() {
  return (
    <div className="p-8 bg-background grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SongCard
        id="1"
        title="Never Gonna Give You Up"
        artist="Rick Astley"
        thumbnailUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
        genre="Pop"
        gender="male"
        year={1987}
        onPlay={(id) => console.log('Playing:', id)}
      />
      <SongCard
        id="2"
        title="Rolling in the Deep"
        artist="Adele"
        thumbnailUrl="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
        genre="Soul"
        gender="female"
        year={2010}
        onPlay={(id) => console.log('Playing:', id)}
      />
      <SongCard
        id="3"
        title="Shallow"
        artist="Lady Gaga & Bradley Cooper"
        thumbnailUrl="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400"
        genre="Pop"
        gender="duet"
        year={2018}
        onPlay={(id) => console.log('Playing:', id)}
      />
    </div>
  );
}
