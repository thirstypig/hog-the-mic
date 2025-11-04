import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Search, Sliders, LogIn, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LRCLibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
}

export default function SimpleLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, login, logout } = useAuth();

  const getUserInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getUserName = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return 'User';
  };

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/lrclib/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('LRCLIB search failed');
      return response.json();
    },
    onSuccess: (results: LRCLibSearchResult[]) => {
      if (results.length === 0) {
        toast({
          title: 'No Songs Found',
          description: 'No songs with synced lyrics found. Try a different search.',
        });
      } else {
        // Navigate to advanced search with results
        setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    },
    onError: () => {
      toast({
        title: 'Search Failed',
        description: 'Unable to search songs. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation('/search')}
            data-testid="button-advanced-search"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Advanced Search
          </Button>

          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 h-9"
                      data-testid="button-user-menu"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={getUserName(user.firstName, user.lastName)} />
                        <AvatarFallback>{getUserInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{getUserName(user.firstName, user.lastName)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{getUserName(user.firstName, user.lastName)}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={login}
                  variant="default"
                  size="sm"
                  className="gap-2"
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content - Centered Search */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Brand Name */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="text-primary">Hog</span> The Mic
            </h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a song or artist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                  data-testid="input-search"
                  disabled={searchMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                disabled={!searchQuery.trim() || searchMutation.isPending}
                data-testid="button-search"
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>

          {/* Tagline */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              Find Your <span className="text-primary">Karaoke</span> Song
            </h2>
            <p className="text-lg text-muted-foreground">
              Search thousands of songs with synchronized lyrics
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-8 pt-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Songs Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Synced Lyrics</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by LRCLIB and YouTube
        </div>
      </footer>
    </div>
  );
}
