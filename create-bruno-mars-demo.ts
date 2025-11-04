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

const syncedLyrics = `[00:00.06] One, two, one, two, three
[00:04.45] Oh, yeah, yeah
[00:06.06] Oh, yeah, yeah, yeah, yeah (ooh)
[00:11.12] Oh, yeah, yeah
[00:12.69] Oh, yeah, yeah, yeah, yeah (ooh)
[00:17.03] Never had much faith in love or miracles (ooh)
[00:23.75] Never wanna put my heart on the line (ooh)
[00:30.24] But swimmin' in your water's something spiritual (ooh)
[00:36.79] I'm born again every time you spend the night (ooh)
[00:42.73] 'Cause your sex takes me to paradise
[00:45.92] Yeah, your sex takes me to paradise
[00:49.44] And it shows
[00:53.10] Yeah, yeah, yeah
[00:55.58] 'Cause you make me feel like
[00:58.87] I've been locked out of heaven
[01:02.92] For too long, for too long
[01:08.84] Yeah, you make me feel like
[01:12.12] I've been locked out of heaven
[01:16.21] For too long, for too long, oh-oh, oh-oh-oh
[01:26.09] Oh, yeah, yeah, yeah, yeah (ooh)
[01:30.81] Oh, yeah, yeah
[01:32.73] Oh, yeah, yeah, yeah, yeah (ooh)
[01:36.77] You bring me to my knees, you make me testify (ooh)
[01:43.75] You can make a sinner change his ways (ooh)
[01:49.42] Open up your gates 'cause I can't wait to see the light (ooh)
[01:57.02] And right there is where I wanna stay (ooh)
[02:02.68] 'Cause your sex takes me to paradise
[02:06.09] Yeah, your sex takes me to paradise
[02:09.20] And it shows
[02:13.23] Yeah, yeah, yeah
[02:15.66] 'Cause you make me feel like
[02:18.67] I've been locked out of heaven
[02:22.79] For too long, for too long
[02:29.02] Yeah, you make me feel like
[02:32.18] I've been locked out of heaven
[02:36.18] For too long, for too long, oh
[02:43.56] Oh, whoa, whoa, whoa, yeah, yeah, yeah
[02:49.33] Can I just stay here?
[02:51.83] Spend the rest of my days here?
[02:56.74] Oh, whoa, whoa, whoa, yeah, yeah, yeah
[03:02.47] Can I just stay here?
[03:05.35] Spend the rest of my days here?
[03:09.09] 'Cause you make me feel like
[03:12.18] I've been locked out of heaven
[03:15.93] For too long, for too long
[03:22.06] Yeah, you make me feel like
[03:25.50] I've been locked out of heaven
[03:29.27] For too long, for too long, oh-oh, oh-oh-oh
[03:39.48] Oh, yeah, yeah, yeah, yeah (ooh)
[03:44.21] Oh, yeah, yeah
[03:46.17] Oh, yeah, yeah, yeah, yeah (ooh)`;

const lyrics = parseLRCLyrics(syncedLyrics);

async function createBrunoMarsSong() {
  try {
    // Check if song already exists
    const existing = await db.query.songs.findFirst({
      where: (songs, { eq }) => eq(songs.videoId, 'e-fA-gBCkj0')
    });

    if (existing) {
      console.log('Song already exists:', existing.title);
      return;
    }

    // Insert the song
    const [song] = await db.insert(songs).values({
      videoId: 'e-fA-gBCkj0',
      title: 'Locked out of Heaven',
      artist: 'Bruno Mars',
      thumbnailUrl: 'https://i.ytimg.com/vi/e-fA-gBCkj0/hqdefault.jpg',
      genre: 'Pop',
      gender: 'male',
      year: 2012,
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

createBrunoMarsSong();
