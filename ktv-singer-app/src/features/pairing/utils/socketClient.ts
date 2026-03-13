import { io, type Socket } from "socket.io-client";

export type { Socket };

let socket: Socket | null = null;

/** Connect to the Express server's /pairing namespace */
export function connectSocket(serverURL: string): Socket {
  // Disconnect existing connection if any
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(`${serverURL}/pairing`, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

/** Get the current socket instance (may be null) */
export function getSocket(): Socket | null {
  return socket;
}

/** Disconnect and clear the socket */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
