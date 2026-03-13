/** Matches server PairedPayload */
export interface PairedPayload {
  sessionId: string;
  role: "tv" | "singer";
}

/** Matches server SingerJoinedPayload */
export interface SingerJoinedPayload {
  socketId: string;
  deviceName: string;
}

/** Matches server SingerLeftPayload */
export interface SingerLeftPayload {
  socketId: string;
  deviceName: string;
}

/** Matches server SessionStatePayload */
export interface SessionStatePayload {
  sessionId: string;
  singers: Array<{ socketId: string; deviceName: string }>;
  tvConnected: boolean;
}

/** QR code payload embedded in the QR image */
export interface QRPayload {
  serverURL: string;
  sessionId: string;
}

export type PairingStatus =
  | "idle"
  | "scanning"
  | "connecting"
  | "paired"
  | "error";
