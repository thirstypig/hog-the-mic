import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToasts, type Toast } from "@common/hooks/use-toast";

const DISMISS_MS = 3000;
const DISMISS_DESTRUCTIVE_MS = 4000;
const MAX_TOASTS = 3;

interface ToastItem {
  toast: Toast;
  opacity: Animated.Value;
}

export function ToastOverlay() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.toast.id === id);
      if (!item) return prev;

      Animated.timing(item.opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setItems((cur) => cur.filter((i) => i.toast.id !== id));
      });

      return prev;
    });

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToasts((toast) => {
      const opacity = new Animated.Value(0);
      const newItem: ToastItem = { toast, opacity };

      setItems((prev) => {
        const next = [...prev, newItem];
        // Evict oldest if over max
        if (next.length > MAX_TOASTS) {
          const evicted = next.shift();
          if (evicted) dismiss(evicted.toast.id);
        }
        return next;
      });

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss
      const delay =
        toast.variant === "destructive" ? DISMISS_DESTRUCTIVE_MS : DISMISS_MS;
      const timer = setTimeout(() => dismiss(toast.id), delay);
      timers.current.set(toast.id, timer);
    });

    return () => {
      unsubscribe();
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, [dismiss]);

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {items.map(({ toast, opacity }) => (
        <Animated.View key={toast.id} style={[styles.card, { opacity }]}>
          <View
            style={[
              styles.accent,
              {
                backgroundColor:
                  toast.variant === "destructive" ? "#ef4444" : "#22c55e",
              },
            ]}
          />
          <Pressable
            style={styles.content}
            onPress={() => dismiss(toast.id)}
          >
            <Text style={styles.title} numberOfLines={1}>
              {toast.title}
            </Text>
            {toast.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {toast.description}
              </Text>
            ) : null}
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    color: "#a1a1aa",
    fontSize: 12,
    marginTop: 2,
  },
});
