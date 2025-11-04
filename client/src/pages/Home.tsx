import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import VideoPlayer from '@/components/VideoPlayer';
import LyricsPanel from '@/components/LyricsPanel';
import SongCard from '@/components/SongCard';
import FilterPanel from '@/components/FilterPanel';
import ScoringModal from '@/components/ScoringModal';
import PlaylistManager from '@/components/PlaylistManager';
import { Button } from '@/components/ui/button';
import { Filter, Mic, PanelBottom, PanelRight, Wand2, Loader2, MicOff, Minus, Plus, RotateCcw, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Song } from '@shared/schema';
import { VocalAnalyzer } from '@/lib/audioAnalyzer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LRCLibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
}

interface SearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

export default function Home() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [player, setPlayer] = useState<any>(null);
  const [lrclibResults, setLrclibResults] = useState<LRCLibSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visibleResults, setVisibleResults] = useState(12);
  const [isRecording, setIsRecording] = useState(false);
  const [calculatedScores, setCalculatedScores] = useState({
    totalScore: 0,
    pitchScore: 0,
    timingScore: 0,
    rhythmScore: 0,
  });
  const vocalAnalyzerRef = useRef<VocalAnalyzer | null>(null);
  const { toast } = useToast();
  const [lyricsPosition, setLyricsPosition] = useState<'bottom' | 'right'>('right');
  const [volume, setVolume] = useState(100);
  const [gaudioStatus, setGaudioStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [isMicMonitoring, setIsMicMonitoring] = useState(false);
  const [lyricsOffset, setLyricsOffset] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

  // Check for search query in URL and auto-search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query && !lrclibResults.length) {
      searchMutation.mutate(query);
    }
  }, []);

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/lrclib/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('LRCLIB search failed');
      return { results: await response.json(), query };
    },
    onSuccess: ({ results, query }: { results: LRCLibSearchResult[], query: string }) => {
      // Smart ranking algorithm
      const rankResults = (results: LRCLibSearchResult[], searchQuery: string) => {
        const queryLower = searchQuery.toLowerCase().trim();
        
        return results.map(result => {
          let score = 0;
          
          const fullArtist = result.artistName.toLowerCase().trim();
          const trackName = result.trackName.toLowerCase().trim();
          const albumName = result.albumName?.toLowerCase().trim() || '';
          
          // Get primary artist by taking everything before "feat.", ",", "&", "featuring", etc.
          const primaryArtist = result.artistName
            .split(/\s*(?:feat\.?|ft\.?|featuring|,|&)\s*/i)[0]
            .toLowerCase()
            .trim();
          
          // Check if query matches the PRIMARY artist (starts with query or exact match)
          const isPrimaryArtist = 
            primaryArtist === queryLower || 
            primaryArtist.startsWith(queryLower) ||
            fullArtist.startsWith(queryLower);
          
          // Check if artist name contains "feat." or similar (indicating featured artist)
          const isFeatured = /(?:feat\.?|ft\.?|featuring)/i.test(result.artistName);
          
          // Priority 1: Primary artist exact match or starts with query
          if (isPrimaryArtist) {
            score += 1000;
            if (primaryArtist === queryLower) {
              score += 500; // Exact match bonus
            }
          }
          
          // Priority 2: Track name matches search query
          if (trackName.includes(queryLower) || queryLower.includes(trackName)) {
            score += 800;
            if (trackName === queryLower) {
              score += 300; // Exact track match bonus
            }
          }
          
          // Priority 3: Artist name contains query but not as primary
          if (!isPrimaryArtist && fullArtist.includes(queryLower)) {
            score += 400; // Lower priority for featured artists
          }
          
          // Priority 4: Album name matches
          if (albumName && (albumName === queryLower || albumName.includes(queryLower))) {
            score += 200;
          }
          
          // Heavy penalty for featured artist appearances when query matches a later artist
          if (isFeatured && !isPrimaryArtist && fullArtist.includes(queryLower)) {
            score -= 600; // Strong penalty for "feat. [query]"
          }
          
          return { ...result, searchScore: score };
        }).sort((a, b) => b.searchScore - a.searchScore);
      };
      
      const rankedResults = rankResults(results, query);
      setLrclibResults(rankedResults);
      setShowSearchResults(true);
      setVisibleResults(12); // Reset to initial count for new search
      
      if (results.length === 0) {
        toast({
          title: 'No Songs Found',
          description: 'No songs with synced lyrics found in the database. Try a different search.',
        });
      }
    },
  });

  const videoDetailsMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/youtube/video-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error('Failed to get video details');
      return response.json();
    },
    onSuccess: async (videoDetails: any) => {
      const response = await fetch(`/api/songs/video/${videoDetails.videoId}`);
      if (response.ok) {
        const song = await response.json();
        setCurrentSong(song);
        setShowSearchResults(false);
        
        // Increment play count
        await fetch(`/api/songs/${song.id}/play`, { method: 'POST' });
        queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      } else {
        // Try to fetch synchronized lyrics from LRCLIB
        let lyrics = [];
        try {
          const lyricsResponse = await fetch(
            `/api/lyrics?track=${encodeURIComponent(videoDetails.title)}&artist=${encodeURIComponent(videoDetails.channelTitle)}`
          );
          if (lyricsResponse.ok) {
            lyrics = await lyricsResponse.json();
            toast({
              title: 'Synced Lyrics Found!',
              description: 'Automatically loaded synchronized lyrics for this song.',
            });
          }
        } catch (error) {
          console.log('No synced lyrics found, using empty lyrics');
        }

        // If lyrics were found, save to database
        if (lyrics.length > 0) {
          try {
            const saveResponse = await fetch('/api/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoId: videoDetails.videoId,
                title: videoDetails.title,
                artist: videoDetails.channelTitle,
                thumbnailUrl: videoDetails.thumbnail,
                genre: 'Unknown',
                gender: 'male',
                year: new Date().getFullYear(),
                lyrics,
              }),
            });
            
            if (saveResponse.ok) {
              const savedSong = await saveResponse.json();
              setCurrentSong(savedSong);
              queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
              
              // Increment play count
              await fetch(`/api/songs/${savedSong.id}/play`, { method: 'POST' });
              queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
              
              toast({
                title: 'Song Saved!',
                description: 'This song with lyrics has been added to your library.',
              });
              setShowSearchResults(false);
              return;
            }
          } catch (error) {
            console.error('Failed to save song:', error);
          }
        }

        setCurrentSong({
          id: '',
          videoId: videoDetails.videoId,
          title: videoDetails.title,
          artist: videoDetails.channelTitle,
          thumbnailUrl: videoDetails.thumbnail,
          genre: 'Unknown',
          gender: 'male',
          year: new Date().getFullYear(),
          lyrics,
          playCount: 0,
        } as Song);
        setShowSearchResults(false);
      }
    },
  });

  const savePerformanceMutation = useMutation({
    mutationFn: async (data: {
      songId: string;
      totalScore: number;
      pitchScore: number;
      timingScore: number;
      rhythmScore: number;
    }) => {
      const response = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save performance');
      return response.json();
    },
  });

  const gaudioSeparateMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await fetch(`/api/songs/${songId}/gaudio-separate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start vocal separation');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.status === 'processing') {
        setGaudioStatus('processing');
        toast({
          title: 'Processing Started!',
          description: 'Creating karaoke track with AI vocal removal...',
        });
        // Poll for status
        if (currentSong?.id) {
          checkGaudioStatus(currentSong.id);
        }
      } else if (data.status === 'completed') {
        setGaudioStatus('completed');
        toast({
          title: 'Karaoke Track Ready!',
          description: 'Instrumental track is ready to play.',
        });
      }
    },
    onError: (error: Error) => {
      setGaudioStatus('idle');
      toast({
        title: 'Feature Not Available',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const checkGaudioStatus = async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}/gaudio-status`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        setGaudioStatus('completed');
        queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
        toast({
          title: 'Karaoke Track Ready!',
          description: 'Your instrumental track is ready to play!',
        });
      } else if (data.status === 'processing') {
        // Poll again in 10 seconds
        setTimeout(() => checkGaudioStatus(songId), 10000);
      }
    } catch (error) {
      console.error('Failed to check Gaudio status:', error);
    }
  };

  const handleSearch = (query: string) => {
    setCurrentSong(null); // Clear current song to show search results
    searchMutation.mutate(query);
  };

  const handleVideoLink = (url: string) => {
    videoDetailsMutation.mutate(url);
  };

  const handlePlaySong = async (id: string) => {
    const song = songs.find((s) => s.id === id);
    if (song) {
      // Load saved lyrics offset for this song
      setLyricsOffset(song.lyricsOffset || 0);
      
      // Increment play count
      await fetch(`/api/songs/${id}/play`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      
      // Set Gaudio status based on song state
      if (song.instrumentalUrl) {
        setGaudioStatus('completed');
      } else if (song.gaudioJobId) {
        setGaudioStatus('processing');
        // Check status
        checkGaudioStatus(song.id);
      } else {
        setGaudioStatus('idle');
      }

      // Try to fetch fresh synced lyrics from LRCLIB if not already present
      let updatedSong = { ...song };
      if (!song.lyrics || song.lyrics.length === 0) {
        try {
          const lyricsResponse = await fetch(
            `/api/lyrics?track=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`
          );
          if (lyricsResponse.ok) {
            const lyrics = await lyricsResponse.json();
            updatedSong.lyrics = lyrics;
            
            // Save the lyrics back to storage
            try {
              await fetch(`/api/songs/${song.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lyrics }),
              });
              console.log('Lyrics saved to storage for:', song.title);
            } catch (saveError) {
              console.error('Failed to save lyrics to storage:', saveError);
            }

            toast({
              title: 'Synced Lyrics Loaded!',
              description: 'Using latest synchronized lyrics from LRCLIB.',
            });
          }
        } catch (error) {
          console.log('Using existing lyrics, LRCLIB fetch failed');
        }
      }

      setCurrentSong(updatedSong);
      setCurrentTime(0);
      setShowSearchResults(false);
    }
  };

  const handlePlayLRCLibResult = async (result: LRCLibSearchResult) => {
    try {
      // Step 1: Search YouTube for this specific song
      toast({
        title: 'Finding YouTube Video...',
        description: `Searching for ${result.trackName} by ${result.artistName}`,
      });

      const youtubeQuery = `${result.trackName} ${result.artistName}`;
      const youtubeResponse = await fetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
      
      if (!youtubeResponse.ok) {
        throw new Error('YouTube search failed');
      }

      const youtubeResults: SearchResult[] = await youtubeResponse.json();
      
      if (youtubeResults.length === 0) {
        toast({
          title: 'No Video Found',
          description: 'Could not find a YouTube video for this song.',
          variant: 'destructive',
        });
        return;
      }

      // Use the first (best match) result
      const videoResult = youtubeResults[0];

      // Step 2: Check if this song is already in database
      const existingResponse = await fetch(`/api/songs/video/${videoResult.videoId}`);
      if (existingResponse.ok) {
        const existingSong = await existingResponse.json();
        setCurrentSong(existingSong);
        setShowSearchResults(false);
        
        // Increment play count
        await fetch(`/api/songs/${existingSong.id}/play`, { method: 'POST' });
        queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
        return;
      }

      // Step 3: Fetch guaranteed synced lyrics from LRCLIB
      const lyricsResponse = await fetch(
        `/api/lyrics?track=${encodeURIComponent(result.trackName)}&artist=${encodeURIComponent(result.artistName)}&duration=${result.duration}`
      );
      
      if (!lyricsResponse.ok) {
        toast({
          title: 'Lyrics Error',
          description: 'Could not load lyrics for this song.',
          variant: 'destructive',
        });
        return;
      }

      const lyrics = await lyricsResponse.json();

      // Step 4: Save song to database
      const saveResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoResult.videoId,
          title: result.trackName,
          artist: result.artistName,
          thumbnailUrl: videoResult.thumbnail,
          genre: 'Unknown',
          gender: 'male',
          year: new Date().getFullYear(),
          lyrics,
        }),
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save song');
      }

      const savedSong = await saveResponse.json();
      setCurrentSong(savedSong);
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      
      // Increment play count
      await fetch(`/api/songs/${savedSong.id}/play`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      
      toast({
        title: 'Song Ready!',
        description: 'Playing with synchronized lyrics.',
      });
      setShowSearchResults(false);
    } catch (error) {
      console.error('Failed to play LRCLIB result:', error);
      toast({
        title: 'Error',
        description: 'Failed to load this song. Please try another.',
        variant: 'destructive',
      });
    }
  };

  const handlePlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
    if (playerInstance.setVolume) {
      playerInstance.setVolume(volume);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player && player.setVolume) {
      player.setVolume(newVolume);
    }
  };

  const handlePlayerStateChange = (event: any) => {
    // YouTube Player States: 
    // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = video cued
    const playerState = event.data;
    
    // When video ends (state 0), auto-advance to next song in playlist
    if (playerState === 0 && currentPlaylist.length > 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < currentPlaylist.length) {
        const nextSong = currentPlaylist[nextIndex];
        setCurrentPlaylistIndex(nextIndex);
        handlePlaySong(nextSong.id);
        toast({
          title: 'Auto-Advancing',
          description: `Now playing: ${nextSong.title}`,
        });
      } else {
        // Reached end of playlist
        setCurrentPlaylist([]);
        setCurrentPlaylistIndex(0);
        toast({
          title: 'Playlist Complete',
          description: 'You\'ve reached the end of the playlist!',
        });
      }
    }
  };


  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
        const state = player.getPlayerState();
        setIsPlaying(state === 1);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  const handleSaveScore = (scores: {
    totalScore: number;
    pitchScore: number;
    timingScore: number;
    rhythmScore: number;
  }) => {
    if (currentSong?.id) {
      savePerformanceMutation.mutate({
        songId: currentSong.id,
        ...scores,
      });
    }
  };

  const startRecording = async () => {
    if (!vocalAnalyzerRef.current) {
      vocalAnalyzerRef.current = new VocalAnalyzer();
    }

    const success = await vocalAnalyzerRef.current.initialize();
    if (success) {
      setIsRecording(true);
      toast({
        title: 'Microphone Active',
        description: 'Your performance is being analyzed!',
      });

      const interval = setInterval(() => {
        if (vocalAnalyzerRef.current) {
          vocalAnalyzerRef.current.detectPitch();
          if (currentSong?.lyrics && currentSong.lyrics.length > 0) {
            let activeIndex = -1;
            for (let i = 0; i < currentSong.lyrics.length; i++) {
              if (currentTime >= currentSong.lyrics[i].time) {
                activeIndex = i;
              }
            }
            if (activeIndex >= 0) {
              vocalAnalyzerRef.current.recordTiming(
                currentSong.lyrics[activeIndex].time,
                currentTime
              );
            }
          }
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecordingAndShowScore = () => {
    if (vocalAnalyzerRef.current) {
      const scores = vocalAnalyzerRef.current.calculateScores();
      setCalculatedScores(scores);
      vocalAnalyzerRef.current.cleanup();
      vocalAnalyzerRef.current = null;
    }
    setIsRecording(false);
    setIsMicMonitoring(false);
    setShowScoring(true);
  };

  const toggleMicMonitoring = async () => {
    if (!vocalAnalyzerRef.current) {
      vocalAnalyzerRef.current = new VocalAnalyzer();
      const initialized = await vocalAnalyzerRef.current.initialize();
      
      if (!initialized) {
        toast({
          title: 'Microphone Access Required',
          description: 'Please allow microphone access to use this feature.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (isMicMonitoring) {
      vocalAnalyzerRef.current.disableMonitoring();
      setIsMicMonitoring(false);
      toast({
        title: 'Mic Monitoring OFF',
        description: 'Your voice is no longer playing through speakers.',
      });
    } else {
      vocalAnalyzerRef.current.enableMonitoring();
      setIsMicMonitoring(true);
      toast({
        title: 'Mic Monitoring ON',
        description: 'You can now hear yourself through the speakers while singing!',
      });
    }
  };

  const saveLyricsOffset = async () => {
    if (!currentSong?.id) return;
    
    try {
      const response = await fetch(`/api/songs/${currentSong.id}/lyrics-offset`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: lyricsOffset }),
      });
      
      if (!response.ok) throw new Error('Failed to save offset');
      
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      
      toast({
        title: 'Timing Saved!',
        description: `Lyrics timing (${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s) saved for everyone.`,
      });
    } catch (error) {
      console.error('Failed to save lyrics offset:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save lyrics timing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (vocalAnalyzerRef.current) {
        vocalAnalyzerRef.current.cleanup();
      }
    };
  }, []);

  const filteredSongs = songs.filter((song) => {
    if (selectedGenders.length > 0 && !selectedGenders.some(g => g.toLowerCase() === song.gender)) {
      return false;
    }
    if (selectedGenres.length > 0 && !selectedGenres.includes(song.genre)) {
      return false;
    }
    if (selectedDecades.length > 0) {
      const decade = `${Math.floor(song.year / 10) * 10}s`;
      if (!selectedDecades.includes(decade)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header
        onLibraryClick={() => {
          setShowSearchResults(false);
          setCurrentSong(null);
        }}
        onSettingsClick={() => console.log('Settings')}
      />

      <main className="pb-48 md:pb-64">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <SearchBar onSearch={handleSearch} onVideoLink={handleVideoLink} />
            </div>
            <PlaylistManager currentSong={currentSong} />
          </div>

          {currentSong ? (
            <div className={lyricsPosition === 'right' ? 'flex gap-6' : 'space-y-6'}>
              <div className={lyricsPosition === 'right' ? 'flex-1' : 'w-full'}>
                <VideoPlayer
                  videoId={currentSong.videoId}
                  onReady={handlePlayerReady}
                  onStateChange={handlePlayerStateChange}
                />
                <div className="space-y-4 mt-6">
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setLyricsPosition(lyricsPosition === 'bottom' ? 'right' : 'bottom')}
                      data-testid="button-toggle-lyrics-position"
                      className="flex-shrink-0"
                    >
                      {lyricsPosition === 'bottom' ? (
                        <>
                          <PanelRight className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Lyrics Right</span>
                        </>
                      ) : (
                        <>
                          <PanelBottom className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Lyrics Bottom</span>
                        </>
                      )}
                    </Button>
                    {currentSong.id && (
                      <>
                        {currentSong.instrumentalUrl ? (
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => {
                              toast({
                                title: 'Karaoke Track Available!',
                                description: 'Play the instrumental version below.',
                              });
                            }}
                            data-testid="button-karaoke-ready"
                            className="flex-shrink-0"
                          >
                            <Wand2 className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Karaoke Ready</span>
                          </Button>
                        ) : gaudioStatus === 'processing' ? (
                          <Button
                            variant="outline"
                            size="default"
                            disabled
                            data-testid="button-karaoke-processing"
                            className="flex-shrink-0"
                          >
                            <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                            <span className="hidden md:inline">Creating...</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => currentSong.id && gaudioSeparateMutation.mutate(currentSong.id)}
                            disabled={gaudioSeparateMutation.isPending}
                            data-testid="button-create-karaoke"
                            className="flex-shrink-0"
                          >
                            <Wand2 className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Karaoke</span>
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant={isMicMonitoring ? "default" : "outline"}
                      size="default"
                      onClick={toggleMicMonitoring}
                      data-testid="button-toggle-mic-monitoring"
                      className="flex-shrink-0"
                    >
                      {isMicMonitoring ? (
                        <>
                          <Mic className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Mic ON</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Mic OFF</span>
                        </>
                      )}
                    </Button>
                    {currentSong.lyrics && currentSong.lyrics.length > 0 && (
                      <>
                        {!isRecording ? (
                          <Button
                            variant="default"
                            size="lg"
                            onClick={startRecording}
                            data-testid="button-start-recording"
                          >
                            <Mic className="w-5 h-5 mr-2" />
                            Start Vocal Analysis
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={stopRecordingAndShowScore}
                            data-testid="button-show-score"
                            className="animate-pulse"
                          >
                            <Mic className="w-5 h-5 mr-2" />
                            End Performance & View Score
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {currentSong.lyrics && currentSong.lyrics.length > 0 && (
                    <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
                      <span className="text-sm text-muted-foreground">Lyrics Timing:</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLyricsOffset(prev => Math.max(prev - 0.5, -20))}
                        data-testid="button-lyrics-earlier"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-mono w-20 text-center" data-testid="text-lyrics-offset">
                        {lyricsOffset > 0 ? '+' : ''}{lyricsOffset.toFixed(1)}s
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLyricsOffset(prev => Math.min(prev + 0.5, 20))}
                        data-testid="button-lyrics-later"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLyricsOffset(0)}
                        data-testid="button-lyrics-reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="default"
                        onClick={saveLyricsOffset}
                        disabled={lyricsOffset === (currentSong.lyricsOffset || 0)}
                        data-testid="button-save-timing"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Timing
                      </Button>
                    </div>
                  )}

                  {/* More by this Artist */}
                  {(() => {
                    const moreSongs = songs
                      .filter(song => 
                        song.artist.toLowerCase() === currentSong.artist.toLowerCase() && 
                        song.id !== currentSong.id
                      )
                      .slice(0, 3);
                    
                    if (moreSongs.length > 0) {
                      return (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold mb-4">More by {currentSong.artist}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {moreSongs.map(song => (
                              <div
                                key={song.id}
                                onClick={() => handlePlaySong(song.id)}
                                className="flex items-center gap-3 p-3 bg-card border rounded-lg hover-elevate cursor-pointer transition-all"
                                data-testid={`more-song-${song.id}`}
                              >
                                <img 
                                  src={song.thumbnailUrl || ''} 
                                  alt={song.title}
                                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1" data-testid={`text-more-title-${song.id}`}>
                                    {song.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {song.genre} • {song.year}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              {lyricsPosition === 'right' && (
                <LyricsPanel
                  lines={currentSong.lyrics || []}
                  currentTime={currentTime + lyricsOffset}
                  isPlaying={isPlaying}
                  position="right"
                />
              )}
            </div>
          ) : showSearchResults ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">Songs with Synced Lyrics</h2>
              <p className="text-muted-foreground mb-4">
                Found {lrclibResults.length} {lrclibResults.length === 1 ? 'song' : 'songs'} with verified synchronized lyrics. Click to play with YouTube.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lrclibResults.slice(0, visibleResults).map((result, index) => (
                  <div
                    key={result.id}
                    onClick={() => handlePlayLRCLibResult(result)}
                    className="relative p-6 bg-card border rounded-lg hover-elevate cursor-pointer transition-all"
                    data-testid={`lrclib-result-${result.id}`}
                  >
                    <h3 className="text-xl font-bold mb-1 line-clamp-2" data-testid={`text-track-${result.id}`}>
                      {result.trackName}
                    </h3>
                    <p className="text-base text-muted-foreground mb-2" data-testid={`text-artist-${result.id}`}>
                      {result.artistName}
                    </p>
                    {result.albumName && (
                      <p className="text-xs text-muted-foreground/50 mb-2" data-testid={`text-album-${result.id}`}>
                        Album: {result.albumName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded" data-testid={`badge-duration-${result.id}`}>
                        {Math.floor(result.duration / 60)}:{String(Math.floor(result.duration % 60)).padStart(2, '0')}
                      </span>
                      {index < 3 && (
                        <span className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded" data-testid={`badge-top-${result.id}`}>
                          Top Match
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {visibleResults < lrclibResults.length && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleResults(prev => prev + 12)}
                    data-testid="button-load-more"
                  >
                    Load More ({lrclibResults.length - visibleResults} more {lrclibResults.length - visibleResults === 1 ? 'song' : 'songs'})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="hidden md:block">
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

              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {filteredSongs.length === songs.length
                      ? 'All Songs'
                      : `Filtered Songs (${filteredSongs.length})`}
                  </h2>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="md:hidden" data-testid="button-filters-mobile">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
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
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      id={song.id}
                      title={song.title}
                      artist={song.artist}
                      thumbnailUrl={song.thumbnailUrl || ''}
                      genre={song.genre}
                      gender={song.gender as 'male' | 'female' | 'duet'}
                      year={song.year}
                      playCount={song.playCount}
                      onPlay={handlePlaySong}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {currentSong && lyricsPosition === 'bottom' && (
        <LyricsPanel
          lines={currentSong.lyrics || []}
          currentTime={currentTime + lyricsOffset}
          isPlaying={isPlaying}
          position="bottom"
        />
      )}

      <ScoringModal
        open={showScoring}
        onClose={() => setShowScoring(false)}
        totalScore={calculatedScores.totalScore}
        breakdown={{
          pitch: calculatedScores.pitchScore,
          timing: calculatedScores.timingScore,
          rhythm: calculatedScores.rhythmScore,
        }}
        songTitle={currentSong?.title || 'Song'}
        onTryAgain={() => {
          setShowScoring(false);
          setCalculatedScores({ totalScore: 0, pitchScore: 0, timingScore: 0, rhythmScore: 0 });
          if (player) {
            player.seekTo(0);
            player.playVideo();
          }
        }}
        onNextSong={() => {
          handleSaveScore(calculatedScores);
          setShowScoring(false);
          setCurrentSong(null);
          setCalculatedScores({ totalScore: 0, pitchScore: 0, timingScore: 0, rhythmScore: 0 });
        }}
      />
    </div>
  );
}
