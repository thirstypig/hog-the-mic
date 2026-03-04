import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { randomUUID } from "crypto";
import { sessions } from "./pairing.routes";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionMember,
  PairingSession,
  QueueEntry,
} from "./pairing.types";

export function setupPairingSocket(httpServer: Server) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: "/socket.io",
      cors: { origin: "*", methods: ["GET", "POST"] },
    },
  );

  const pairing = io.of("/pairing");

  /** Map socketId → { sessionId, role } for cleanup on disconnect */
  const socketSessionMap = new Map<
    string,
    { sessionId: string; role: "tv" | "singer"; deviceName: string }
  >();

  pairing.on("connection", (socket) => {
    console.log(`[pairing] connected: ${socket.id}`);

    // ── join_session ──────────────────────────────────────────
    socket.on("join_session", (payload) => {
      const { sessionId, role, deviceName } = payload;

      const session = sessions.get(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session not found" });
        return;
      }

      // Only one TV per session
      if (role === "tv") {
        let existingTVSocketId: string | null = null;
        session.members.forEach((m) => {
          if (m.role === "tv") existingTVSocketId = m.socketId;
        });
        if (existingTVSocketId) {
          session.members.delete(existingTVSocketId);
          socketSessionMap.delete(existingTVSocketId);
        }
      }

      // Register member
      const member: SessionMember = {
        socketId: socket.id,
        role,
        deviceName,
        joinedAt: Date.now(),
      };
      session.members.set(socket.id, member);
      socketSessionMap.set(socket.id, { sessionId, role, deviceName });

      // Join the socket.io room
      const room = `session:${sessionId}`;
      socket.join(room);

      // Confirm to the joining client
      socket.emit("paired", { sessionId, role });

      // Notify the room about the new singer
      if (role === "singer") {
        socket.to(room).emit("singer_joined", {
          socketId: socket.id,
          deviceName,
        });
      }

      // Broadcast current session state to everyone in the room
      emitSessionState(sessionId);

      // Send current queue state to the newly joined client
      emitQueueUpdated(sessionId);
    });

    // ── Queue events ─────────────────────────────────────────

    socket.on("add_to_queue", (payload) => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;

      const session = sessions.get(info.sessionId);
      if (!session) return;

      const entry: QueueEntry = {
        queueId: randomUUID(),
        songId: payload.songId,
        videoId: payload.videoId,
        title: payload.title,
        artist: payload.artist,
        thumbnailUrl: payload.thumbnailUrl,
        addedBy: info.deviceName,
        addedBySocketId: socket.id,
        addedAt: Date.now(),
      };

      // If nothing playing and queue empty, start playing immediately
      if (!session.currentlyPlaying && session.queue.length === 0) {
        session.currentlyPlaying = entry;
        pairing.to(`session:${info.sessionId}`).emit("play_song", {
          sessionId: info.sessionId,
          entry,
        });
      } else {
        session.queue.push(entry);
      }

      emitQueueUpdated(info.sessionId);
    });

    socket.on("remove_from_queue", (payload) => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;

      const session = sessions.get(info.sessionId);
      if (!session) return;

      session.queue = session.queue.filter(
        (e) => e.queueId !== payload.queueId,
      );
      emitQueueUpdated(info.sessionId);
    });

    socket.on("skip_song", () => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      advanceQueue(info.sessionId);
    });

    socket.on("song_finished", () => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      // Only accept from TV role
      if (info.role !== "tv") return;
      advanceQueue(info.sessionId);
    });

    // ── Audio relay (Phase 2 prep — passthrough) ──────────────
    socket.on("audio_chunk", (data) => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket.to(`session:${info.sessionId}`).emit("audio_chunk", data);
    });

    socket.on("audio_start", () => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket
        .to(`session:${info.sessionId}`)
        .emit("audio_start", { socketId: socket.id });
    });

    socket.on("audio_stop", () => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket
        .to(`session:${info.sessionId}`)
        .emit("audio_stop", { socketId: socket.id });
    });

    // ── Score relay (Phase 3 prep — passthrough) ──────────────
    socket.on("score_update", (data) => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket.to(`session:${info.sessionId}`).emit("score_update", data);
    });

    socket.on("final_score", (data) => {
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket.to(`session:${info.sessionId}`).emit("final_score", data);
    });

    // ── disconnect ────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[pairing] disconnected: ${socket.id}`);

      const info = socketSessionMap.get(socket.id);
      if (!info) return;

      const session = sessions.get(info.sessionId);
      if (session) {
        session.members.delete(socket.id);

        if (info.role === "singer") {
          pairing
            .to(`session:${info.sessionId}`)
            .emit("singer_left", {
              socketId: socket.id,
              deviceName: info.deviceName,
            });
        }

        emitSessionState(info.sessionId);

        // Clean up empty sessions
        if (session.members.size === 0) {
          sessions.delete(info.sessionId);
        }
      }

      socketSessionMap.delete(socket.id);
    });
  });

  function emitSessionState(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const singers: Array<{ socketId: string; deviceName: string }> = [];
    let tvConnected = false;
    session.members.forEach((m) => {
      if (m.role === "singer") {
        singers.push({ socketId: m.socketId, deviceName: m.deviceName });
      }
      if (m.role === "tv") {
        tvConnected = true;
      }
    });

    pairing.to(`session:${sessionId}`).emit("session_state", {
      sessionId,
      singers,
      tvConnected,
    });
  }

  function emitQueueUpdated(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    pairing.to(`session:${sessionId}`).emit("queue_updated", {
      sessionId,
      currentlyPlaying: session.currentlyPlaying,
      upcoming: session.queue,
    });
  }

  function advanceQueue(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    if (session.queue.length > 0) {
      const next = session.queue.shift()!;
      session.currentlyPlaying = next;
      pairing.to(`session:${sessionId}`).emit("play_song", {
        sessionId,
        entry: next,
      });
    } else {
      session.currentlyPlaying = null;
    }

    emitQueueUpdated(sessionId);
  }
}
