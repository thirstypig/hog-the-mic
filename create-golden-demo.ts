import { db } from './server/db';
import { songs } from './shared/schema';

async function createGoldenSong() {
  try {
    // Check if song already exists
    const existing = await db.query.songs.findFirst({
      where: (songs, { eq }) => eq(songs.videoId, 'yebNIHKAC4A')
    });

    if (existing) {
      console.log('Song already exists:', existing.title);
      return;
    }

    // Insert the song without synced lyrics (can be added later via LRCLIB fetch in the app)
    const [song] = await db.insert(songs).values({
      videoId: 'yebNIHKAC4A',
      title: 'Golden',
      artist: 'HUNTR/X, EJAE, AUDREY NUNA, REI AMI & KPop Demon Hunters Cast',
      thumbnailUrl: 'https://i.ytimg.com/vi/yebNIHKAC4A/hqdefault.jpg',
      genre: 'K-Pop',
      gender: 'mixed',
      year: 2024,
      lyrics: [] as any, // Empty lyrics - can be fetched via LRCLIB in the app
      playCount: 0,
    }).returning();

    console.log('Created song:', song.title);
    console.log('Artist:', song.artist);
    console.log('Video ID:', song.videoId);
    console.log('Note: Lyrics not available in LRCLIB - can be added later through the app');
  } catch (error) {
    console.error('Error creating song:', error);
  }
  process.exit(0);
}

createGoldenSong();
