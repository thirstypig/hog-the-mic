import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Mic, Search, ListMusic, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@theme/colors";
import { PairingProvider, usePairingContext } from "@features/pairing";
import type { SessionTabParamList } from "./types";

import MicScreen from "@screens/MicScreen";
import SessionSearchScreen from "@screens/SessionSearchScreen";
import QueueScreen from "@screens/QueueScreen";
import SessionInfoScreen from "@screens/SessionInfoScreen";

const Tab = createBottomTabNavigator<SessionTabParamList>();

function SessionTabs() {
  const insets = useSafeAreaInsets();
  const { upcoming } = usePairingContext();
  const queueCount = upcoming.length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      }}
    >
      <Tab.Screen
        name="Mic"
        component={MicScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Mic size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SessionSearch"
        component={SessionSearchScreen}
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ListMusic size={size} color={color} />
          ),
          tabBarBadge: queueCount > 0 ? queueCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen
        name="SessionInfo"
        component={SessionInfoScreen}
        options={{
          title: "Session",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function SessionTabNavigator() {
  return (
    <PairingProvider>
      <SessionTabs />
    </PairingProvider>
  );
}
