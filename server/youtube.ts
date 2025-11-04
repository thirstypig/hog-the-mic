import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=youtube',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('YouTube not connected');
  }
  return accessToken;
}

export async function getUncachableYouTubeClient() {
  // Check if user provided their own YouTube API key
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (apiKey) {
    // Use API key authentication (higher quota, simpler setup)
    return google.youtube({ 
      version: 'v3', 
      auth: apiKey 
    });
  } else {
    // Fall back to Replit Connector OAuth
    const accessToken = await getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth: oauth2Client });
  }
}

export async function searchYouTubeVideos(query: string, maxResults: number = 10) {
  const youtube = await getUncachableYouTubeClient();
  
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
  const youtube = await getUncachableYouTubeClient();
  
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
