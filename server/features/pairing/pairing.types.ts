/** Ephemeral pairing session (in-memory, no DB) */
export interface PairingSession {
  id: string;
  createdAt: number;
  members: Map<string, SessionMember>;
}

export interface SessionMember {
  socketId: string;
  role: "tv" | "singer";
  deviceName: string;
  joinedAt: number;
}

// ── Socket.io event payloads ────────────────────────────────────

/** Client → Server */
export interface JoinSessionPayload {
  sessionId: string;
  role: "tv" | "singer";
  deviceName: string;
}

/** Server → Client: a singer connected */
export interface SingerJoinedPayload {
  socketId: string;
  deviceName: string;
}

/** Server → Client: a singer disconnected */
export interface SingerLeftPayload {
  socketId: string;
  deviceName: string;
}

/** Server → Client: full session state snapshot */
export interface SessionStatePayload {
  sessionId: string;
  singers: Array<{ socketId: string; deviceName: string }>;
  tvConnected: boolean;
}

/** Server → joining client on successful pair */
export interface PairedPayload {
  sessionId: string;
  role: "tv" | "singer";
}

/** Server → Client on error */
export interface ErrorPayload {
  message: string;
}

// ── Socket.io event maps ────────────────────────────────────────

export interface ClientToServerEvents {
  join_session: (payload: JoinSessionPayload) => void;
  audio_chunk: (data: Buffer) => void;
  audio_start: () => void;
  audio_stop: () => void;
  score_update: (data: string) => void;
  final_score: (data: string) => void;
}

export interface ServerToClientEvents {
  paired: (payload: PairedPayload) => void;
  singer_joined: (payload: SingerJoinedPayload) => void;
  singer_left: (payload: SingerLeftPayload) => void;
  session_state: (payload: SessionStatePayload) => void;
  audio_chunk: (data: Buffer) => void;
  audio_start: (payload: { socketId: string }) => void;
  audio_stop: (payload: { socketId: string }) => void;
  score_update: (data: string) => void;
  final_score: (data: string) => void;
  error: (payload: ErrorPayload) => void;
}
