import { useState } from "react";
import { View, Text, TextInput, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search } from "lucide-react-native";
import { useAuthContext } from "@common/auth";
import { useToast } from "@common/hooks/use-toast";
import { apiUrl } from "@common/lib/api";
import { KtvLogo } from "@common/components/KtvLogo";
import { colors } from "@theme/colors";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

export default function LandingScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation<Nav>();
  const { user, isLoading, login, logout } = useAuthContext();
  const { toast } = useToast();

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        apiUrl(`/api/lrclib/search?q=${encodeURIComponent(q)}`),
      );
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();

      if (results.length === 0) {
        toast({
          title: "No Songs Found",
          description: "No songs with synced lyrics found. Try a different search.",
        });
      } else {
        navigation.navigate("Search", { query: q });
      }
    } catch {
      toast({
        title: "Search Failed",
        description: "Unable to search songs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header bar */}
      <View className="flex-row items-center justify-end px-tv-4 py-tv-2">
        <Pressable
          className="mr-tv-2 px-tv-2 py-tv-1 rounded-tv-md bg-primary"
          onPress={() => navigation.navigate("Pair")}
          {...(Platform.isTV && { isTVSelectable: true })}
        >
          <Text className="text-tv-sm text-primary-foreground font-bold">
            Connect to TV
          </Text>
        </Pressable>

        <Pressable
          className="mr-tv-2 px-tv-2 py-tv-1 rounded-tv-md bg-muted"
          onPress={() => navigation.navigate("Home")}
          {...(Platform.isTV && { isTVSelectable: true })}
        >
          <Text className="text-tv-sm text-foreground">Library</Text>
        </Pressable>

        {!isLoading && (
          user ? (
            <Pressable
              className="px-tv-2 py-tv-1 rounded-tv-md bg-muted"
              onPress={logout}
              {...(Platform.isTV && { isTVSelectable: true })}
            >
              <Text className="text-tv-sm text-foreground">Log Out</Text>
            </Pressable>
          ) : (
            <Pressable
              className="px-tv-2 py-tv-1 rounded-tv-md bg-primary"
              onPress={login}
              {...(Platform.isTV && { isTVSelectable: true })}
            >
              <Text className="text-tv-sm text-primary-foreground font-bold">
                Log In
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Centered content */}
      <View className="flex-1 items-center justify-center px-tv-8">
        <KtvLogo size={80} color={colors.primary} />
        <Text className="text-tv-3xl font-bold text-foreground mt-tv-2 mb-tv-4">
          <Text className="text-primary">KTV</Text> Singer
        </Text>

        {/* Search bar */}
        <View className="flex-row w-full max-w-2xl items-center gap-tv-2">
          <View className="flex-1 flex-row items-center bg-card border border-border rounded-tv-md px-tv-3 py-tv-2">
            <Search size={24} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-tv-2 text-tv-base text-foreground"
              placeholder="Search for a song or artist..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!isSearching}
            />
          </View>
          <Pressable
            className="px-tv-4 py-tv-2 rounded-tv-md bg-primary"
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            {...(Platform.isTV && { isTVSelectable: true, hasTVPreferredFocus: true })}
          >
            <Text className="text-tv-base text-primary-foreground font-bold">
              {isSearching ? "Searching..." : "Search"}
            </Text>
          </Pressable>
        </View>

        {/* Tagline */}
        <Text className="text-tv-xl font-bold text-foreground mt-tv-6">
          Find Your <Text className="text-primary">Karaoke</Text> Song
        </Text>
        <Text className="text-tv-sm text-muted-foreground mt-tv-1">
          Search thousands of songs with synchronized lyrics
        </Text>
      </View>

      {/* Footer */}
      <View className="border-t border-border py-tv-2">
        <Text className="text-tv-xs text-muted-foreground text-center">
          Powered by LRCLIB and YouTube
        </Text>
      </View>
    </View>
  );
}
