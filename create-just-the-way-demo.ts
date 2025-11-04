import { db } from './server/db';
import { songs } from './shared/schema';

// Parse LRC format lyrics to app format
function parseLRCLyrics(lrcText: string): { time: number; text: string }[] {
  const lines = lrcText.trim().split('\n');
  const lyrics: { time: number; text: string }[] = [];
  
  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+\.\d+)\]\s*(.+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      const time = minutes * 60 + seconds;
      lyrics.push({ time, text });
    }
  }
  
  return lyrics;
}

const syncedLyrics = `[00:17.62] Oh, her eyes, her eyes
[00:19.73] Make the stars look like they're not shinin'
[00:22.38] Her hair, her hair
[00:24.15] Falls perfectly without her trying
[00:26.94] She's so beautiful
[00:29.40] And I tell her everyday
[00:34.39] Yeah, I know, I know
[00:37.22] When I compliment her she won't believe me
[00:39.58] And it's so, it's so
[00:41.65] Sad to think that she don't see what I see
[00:44.42] But every time she asks me, "Do I look okay?"
[00:48.01] I say
[00:51.42] When I see your face
[00:55.89] There's not a thing that I would change
[01:00.57] 'Cause you're amazing
[01:03.65] Just the way you are
[01:09.14] And when you smile
[01:13.51] The whole world stops and stares for a while
[01:18.06] 'Cause, girl, you're amazing
[01:21.20] Just the way you are
[01:26.98] Yeah
[01:28.56] Her lips, her lips
[01:30.18] I could kiss them all day if she'd let me
[01:32.74] Her laugh, her laugh
[01:34.58] She hates, but I think it's so sexy
[01:37.32] She's so beautiful
[01:39.95] And I tell her everyday
[01:44.96] Oh, you know, you know, you know
[01:47.31] I'd never ask you to change
[01:49.85] If perfect's what you're searching for
[01:52.25] Then just stay the same
[01:54.33] So don't even bother asking if you look okay
[01:58.38] You know, I'll say
[02:01.74] When I see your face
[02:06.29] There's not a thing that I would change
[02:10.82] 'Cause you're amazing
[02:14.04] Just the way you are
[02:19.68] And when you smile
[02:23.86] The whole world stops and stares for a while
[02:28.53] 'Cause, girl, you're amazing
[02:31.73] Just the way you are
[02:37.18] The way you are
[02:41.35] The way you are
[02:46.15] Girl, you're amazing
[02:49.37] Just the way you are
[02:54.62] When I see your face
[02:59.21] There's not a thing that I would change
[03:03.81] 'Cause you're amazing
[03:06.94] Just the way you are
[03:12.36] And when you smile
[03:16.92] The whole world stops and stares for a while
[03:21.42] 'Cause, girl, you're amazing
[03:24.63] Just the way you are
[03:29.81] Yeah`;

const lyrics = parseLRCLyrics(syncedLyrics);

async function createJustTheWaySong() {
  try {
    // Check if song already exists
    const existing = await db.query.songs.findFirst({
      where: (songs, { eq }) => eq(songs.videoId, 'LjhCEhWiKXk')
    });

    if (existing) {
      console.log('Song already exists:', existing.title);
      return;
    }

    // Insert the song
    const [song] = await db.insert(songs).values({
      videoId: 'LjhCEhWiKXk',
      title: 'Just the Way You Are',
      artist: 'Bruno Mars',
      thumbnailUrl: 'https://i.ytimg.com/vi/LjhCEhWiKXk/hqdefault.jpg',
      genre: 'Pop',
      gender: 'male',
      year: 2010,
      lyrics: lyrics as any,
      playCount: 0,
    }).returning();

    console.log('Created song:', song.title);
    console.log('Video ID:', song.videoId);
    console.log('Lyrics count:', lyrics.length);
  } catch (error) {
    console.error('Error creating song:', error);
  }
  process.exit(0);
}

createJustTheWaySong();
