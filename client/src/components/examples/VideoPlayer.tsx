import VideoPlayer from '../VideoPlayer';

export default function VideoPlayerExample() {
  return (
    <div className="p-8 bg-background">
      <VideoPlayer 
        videoId="dQw4w9WgXcQ"
        onReady={(player) => console.log('Player ready:', player)}
        onStateChange={(event) => console.log('State changed:', event)}
      />
    </div>
  );
}
