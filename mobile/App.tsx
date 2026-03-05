import "./src/global.css";
import { type ReactNode } from "react";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { queryClient } from "@common/lib/queryClient";
import { AuthProvider } from "@common/auth";
import { useAuth } from "@features/auth";
import { ToastOverlay } from "@common/components/ToastOverlay";
import { AppNavigator } from "@navigation/index";

function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthProvider value={auth}>{children}</AuthProvider>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProviderWrapper>
          <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <AppNavigator />
            <ToastOverlay />
          </View>
        </AuthProviderWrapper>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
