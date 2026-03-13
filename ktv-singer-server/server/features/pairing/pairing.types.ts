import type { QueueEntry } from "ktv-singer-shared/pairing";

// Re-export all shared types so existing server imports don't break
export * from "ktv-singer-shared/pairing";

/** Ephemeral pairing session (in-memory, no DB) — server-internal only */
export interface PairingSession {
  id: string;
  tvSecret: string;
  createdAt: number;
  members: Record<string, SessionMember>;
  queue: QueueEntry[];
  currentlyPlaying: QueueEntry | null;
}

/** Session member info — server-internal only */
export interface SessionMember {
  socketId: string;
  role: "tv" | "singer";
  deviceName: string;
  joinedAt: number;
}
