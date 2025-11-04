import SearchBar from '../SearchBar';

export default function SearchBarExample() {
  return (
    <div className="p-8 bg-background">
      <SearchBar
        onSearch={(query) => console.log('Search:', query)}
        onVideoLink={(url) => console.log('Video URL:', url)}
      />
    </div>
  );
}
