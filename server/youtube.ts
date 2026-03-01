import { google } from 'googleapis';

export function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is required");
  }
  return google.youtube({ version: 'v3', auth: apiKey });
}

export async function searchYouTubeVideos(query: string, maxResults: number = 10) {
  const youtube = getYouTubeClient();

  const response = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['video'],
    maxResults,
    videoCategoryId: '10', // Music category
  });

  return response.data.items?.map(item => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    description: item.snippet?.description,
    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
    channelTitle: item.snippet?.channelTitle,
  })) || [];
}

export async function getVideoDetails(videoId: string) {
  const youtube = getYouTubeClient();

  const response = await youtube.videos.list({
    part: ['snippet', 'contentDetails'],
    id: [videoId],
  });

  const video = response.data.items?.[0];
  if (!video) return null;

  return {
    videoId: video.id,
    title: video.snippet?.title,
    description: video.snippet?.description,
    thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url,
    channelTitle: video.snippet?.channelTitle,
    duration: video.contentDetails?.duration,
  };
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
