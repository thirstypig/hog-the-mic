import { Music, Library, Settings, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface HeaderProps {
  onLibraryClick: () => void;
  onSettingsClick: () => void;
}

export default function Header({ onLibraryClick, onSettingsClick }: HeaderProps) {
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

  return (
    <header className="h-16 backdrop-blur-md bg-card/50 border-b border-border px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Hog The Mic
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLibraryClick}
          data-testid="button-library"
        >
          <Library className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
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
  );
}
