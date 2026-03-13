import { Platform } from "react-native";

/**
 * tvOS focus styling utilities.
 *
 * On tvOS, the Siri Remote drives a focus engine — there is no touch or cursor.
 * Focusable elements must visually indicate when they are selected.
 */

/** Scale factor applied to a focused element on tvOS */
export const TV_FOCUS_SCALE = 1.05;

/** Border color shown around the focused element */
export const TV_FOCUS_BORDER_COLOR = "#22c55e";

/** Whether the current platform uses focus-based navigation */
export const isTVOS = Platform.isTV;

/**
 * Returns NativeWind class names for a focusable card/button.
 * On tvOS the OS-level focus engine handles the highlight automatically
 * when `hasTVPreferredFocus` or `isTVSelectable` is set, but we can
 * layer additional styling for the focused state.
 */
export function tvFocusClasses(focused: boolean): string {
  if (!isTVOS) return "";
  return focused
    ? "border-2 border-primary scale-105"
    : "border-2 border-transparent";
}
