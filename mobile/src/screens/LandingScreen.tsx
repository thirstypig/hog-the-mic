import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KtvLogo } from "@common/components/KtvLogo";
import { colors } from "@theme/colors";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

export default function LandingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Centered content */}
      <View className="flex-1 items-center justify-center px-6">
        <KtvLogo size={64} color={colors.primary} />
        <Text className="text-3xl font-bold text-foreground mt-3 mb-2">
          <Text className="text-primary">KTV</Text> Singer
        </Text>
        <Text className="text-sm text-muted-foreground text-center mb-10">
          Sing your favorite songs with synchronized lyrics
        </Text>

        <Pressable
          className="w-full py-4 rounded-xl bg-primary mb-4"
          onPress={() => navigation.navigate("Pair")}
        >
          <Text className="text-lg text-primary-foreground font-bold text-center">
            Start Karaoke Session
          </Text>
          <Text className="text-xs text-primary-foreground/70 text-center mt-1">
            Host or join a session with your TV
          </Text>
        </Pressable>

        <Pressable
          className="w-full py-3 rounded-xl bg-card border border-border"
          onPress={() => navigation.navigate("Home")}
        >
          <Text className="text-sm text-muted-foreground font-semibold text-center">
            Song Library
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
