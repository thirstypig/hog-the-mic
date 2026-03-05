import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketChangeListeners: Array<(socket: Socket | null) => void> = [];

/** Subscribe to socket connect/disconnect changes */
export function onSocketChange(cb: (s: Socket | null) => void): () => void {
  socketChangeListeners.push(cb);
  return () => {
    socketChangeListeners = socketChangeListeners.filter((l) => l !== cb);
  };
}

function notifySocketChange() {
  for (const cb of socketChangeListeners) {
    cb(socket);
  }
}

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

  notifySocketChange();
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
    notifySocketChange();
  }
}
