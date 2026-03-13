import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { apiUrl } from "@common/lib/api";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const login = () => {
    // On tvOS / mobile, open the login URL in the system browser.
    // The server will redirect back via deep link after OIDC completes.
    Linking.openURL(apiUrl("/login"));
  };

  const logout = () => {
    Linking.openURL(apiUrl("/logout"));
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
