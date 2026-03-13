import { useRef, useState, useCallback } from "react";
import {
  Pressable,
  type PressableProps,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@common/lib/utils";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FocusableCardProps extends PressableProps {
  className?: string;
  focusedClassName?: string;
  children: React.ReactNode;
}

/**
 * A Pressable wrapper that responds to tvOS focus events with a
 * scale-up animation and a green border highlight.
 *
 * On non-TV platforms it just renders a plain Pressable.
 */
export default function FocusableCard({
  className,
  focusedClassName = "border-primary",
  children,
  onPress,
  ...rest
}: FocusableCardProps) {
  const [focused, setFocused] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(focused ? 1.05 : 1, { duration: 150 }),
      },
    ],
  }));

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  return (
    <AnimatedPressable
      className={cn(
        "rounded-tv-md border-2 border-transparent bg-card",
        focused && focusedClassName,
        className,
      )}
      style={animatedStyle}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPress={onPress}
      // tvOS: make the element selectable via the Siri Remote
      {...(Platform.isTV && { isTVSelectable: true })}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
