// ── Queue types ────────────────────────────────────────────────

export interface QueueEntry {
  queueId: string;
  songId: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  addedBy: string;
  addedBySocketId: string;
  addedAt: number;
}

export interface QueueStatePayload {
  sessionId: string;
  currentlyPlaying: QueueEntry | null;
  upcoming: QueueEntry[];
}

export interface PlaySongPayload {
  sessionId: string;
  entry: QueueEntry;
}

export interface AddToQueuePayload {
  songId: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
}

export interface RemoveFromQueuePayload {
  queueId: string;
}

export interface ReorderQueuePayload {
  queueId: string;
  newIndex: number;
}

export interface SwitchAudioPayload {
  songId: string;
  useInstrumental: boolean;
  instrumentalUrl: string | null;
}

// ── Socket.io event payloads ────────────────────────────────────

/** Client → Server */
export interface JoinSessionPayload {
  sessionId: string;
  role: "tv" | "singer";
  deviceName: string;
  tvSecret?: string;
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
  add_to_queue: (payload: AddToQueuePayload) => void;
  remove_from_queue: (payload: RemoveFromQueuePayload) => void;
  reorder_queue: (payload: ReorderQueuePayload) => void;
  switch_audio: (payload: SwitchAudioPayload) => void;
  skip_song: () => void;
  song_finished: () => void;
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
  queue_updated: (payload: QueueStatePayload) => void;
  play_song: (payload: PlaySongPayload) => void;
  switch_audio: (payload: SwitchAudioPayload) => void;
  audio_chunk: (data: Buffer) => void;
  audio_start: (payload: { socketId: string }) => void;
  audio_stop: (payload: { socketId: string }) => void;
  score_update: (data: string) => void;
  final_score: (data: string) => void;
  error: (payload: ErrorPayload) => void;
}
