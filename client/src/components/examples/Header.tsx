import Header from '../Header';

export default function HeaderExample() {
  return (
    <div className="bg-background">
      <Header
        onLibraryClick={() => console.log('Library clicked')}
        onSettingsClick={() => console.log('Settings clicked')}
      />
    </div>
  );
}
