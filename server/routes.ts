import type { Express } from "express";
import { createServer, type Server } from "http";
import type { Server as SocketIOServer } from "socket.io";
import { setupAuth } from "./features/auth";
import { registerAuthRoutes } from "./features/auth";
import { registerSearchRoutes } from "./features/search";
import { registerSongsRoutes } from "./features/songs";
import { registerScoringRoutes, registerPlaysRoutes } from "./features/scoring";
import { registerPlaylistRoutes } from "./features/playlist";
import { registerVocalSeparationRoutes } from "./features/vocal-separation";
import { registerStreamingRoutes } from "./features/streaming";
import { registerPairingRoutes, setupPairingSocket, createSessionStore } from "./features/pairing";

export async function registerRoutes(app: Express): Promise<{ httpServer: Server; io: SocketIOServer }> {
  // Health check (no auth)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Setup authentication (must come first — installs session + passport middleware)
  await setupAuth(app);

  // Create session store (Redis if available, else in-memory)
  const sessionStore = createSessionStore();

  // Register feature routes
  registerAuthRoutes(app);
  registerSearchRoutes(app);
  registerSongsRoutes(app);
  registerScoringRoutes(app);
  registerPlaysRoutes(app);
  registerPlaylistRoutes(app);
  registerVocalSeparationRoutes(app);
  registerStreamingRoutes(app);
  registerPairingRoutes(app, sessionStore);

  const httpServer = createServer(app);

  // Attach socket.io for real-time pairing
  const io = setupPairingSocket(httpServer, sessionStore);

  return { httpServer, io };
}
