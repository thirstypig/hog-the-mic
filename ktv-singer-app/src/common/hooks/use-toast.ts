/**
 * Lightweight toast hook for React Native.
 *
 * The web version used a reducer-based approach tied to a DOM Toaster
 * component. For RN we keep the same public API but back it with a simple
 * callback list so any native toast / alert UI can subscribe.
 */

import { useCallback, useRef } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastListener = (toast: Toast) => void;

const listeners: Set<ToastListener> = new Set();
let nextId = 0;

/** Subscribe to toast events (called from a <ToastProvider> component) */
export function subscribeToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitToast(toast: Toast) {
  listeners.forEach((fn) => fn(toast));
}

export function useToast() {
  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = String(++nextId);
      emitToast({ id, ...opts });
    },
    [],
  );

  return { toast };
}
