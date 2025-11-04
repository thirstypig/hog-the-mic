import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, List, Trash2, Music } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Playlist, Song, PlaylistSong } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

interface PlaylistManagerProps {
  currentSong?: Song | null;
  onPlayPlaylist?: (songs: Song[], playlistName: string) => void;
}

export default function PlaylistManager({ currentSong, onPlayPlaylist }: PlaylistManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch user's playlists
  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
    enabled: !!user && !authLoading,
  });

  // Fetch songs in selected playlist
  const { data: playlistSongs = [] } = useQuery<PlaylistSong[]>({
    queryKey: ['/api/playlists', selectedPlaylist?.id, 'songs'],
    enabled: !!selectedPlaylist,
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/playlists', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setShowCreateDialog(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast({
        title: 'Playlist Created',
        description: 'Your new playlist has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create playlist. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setSelectedPlaylist(null);
      toast({
        title: 'Playlist Deleted',
        description: 'The playlist has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete playlist.',
        variant: 'destructive',
      });
    },
  });

  // Add song to playlist mutation
  const addSongMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const position = playlistSongs.length;
      const res = await apiRequest('POST', `/api/playlists/${playlistId}/songs`, { songId, position });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({
        title: 'Song Added',
        description: 'Song has been added to the playlist.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add song to playlist.',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a playlist name.',
        variant: 'destructive',
      });
      return;
    }

    createPlaylistMutation.mutate({
      name: newPlaylistName,
      description: newPlaylistDescription || undefined,
    });
  };

  const handleAddCurrentSong = (playlistId: string) => {
    if (!currentSong?.id) {
      toast({
        title: 'Error',
        description: 'No song is currently playing.',
        variant: 'destructive',
      });
      return;
    }

    addSongMutation.mutate({ playlistId, songId: currentSong.id });
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="default" data-testid="button-playlists">
            <List className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Playlists</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Playlists</DialogTitle>
            <DialogDescription>
              Please log in to create and manage playlists.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="default" data-testid="button-playlists">
            <List className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Playlists</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>My Playlists</DialogTitle>
            <DialogDescription>
              Create and manage your karaoke playlists
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="w-full"
              data-testid="button-create-playlist"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Playlist
            </Button>

            <ScrollArea className="h-[400px] pr-4">
              {playlistsLoading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : playlists.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No playlists yet. Create your first playlist to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center justify-between p-4 bg-card border rounded-lg hover-elevate"
                      data-testid={`playlist-${playlist.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-1" data-testid={`text-playlist-name-${playlist.id}`}>
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {currentSong && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddCurrentSong(playlist.id)}
                            disabled={addSongMutation.isPending}
                            data-testid={`button-add-to-${playlist.id}`}
                          >
                            <Music className="w-3 h-3 md:mr-2" />
                            <span className="hidden md:inline">Add Current Song</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePlaylistMutation.mutate(playlist.id)}
                          disabled={deletePlaylistMutation.isPending}
                          data-testid={`button-delete-${playlist.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a name and optional description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Karaoke Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                data-testid="input-playlist-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description (Optional)</Label>
              <Textarea
                id="playlist-description"
                placeholder="A collection of my favorite songs..."
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                data-testid="input-playlist-description"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                disabled={createPlaylistMutation.isPending}
                data-testid="button-submit-create"
              >
                Create Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
