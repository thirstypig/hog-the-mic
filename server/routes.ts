import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./features/auth";
import { registerAuthRoutes } from "./features/auth";
import { registerSearchRoutes } from "./features/search";
import { registerSongsRoutes } from "./features/songs";
import { registerScoringRoutes, registerPlaysRoutes } from "./features/scoring";
import { registerPlaylistRoutes } from "./features/playlist";
import { registerVocalSeparationRoutes } from "./features/vocal-separation";
import { registerStreamingRoutes } from "./features/streaming";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (must come first — installs session + passport middleware)
  await setupAuth(app);

  // Register feature routes
  registerAuthRoutes(app);
  registerSearchRoutes(app);
  registerSongsRoutes(app);
  registerScoringRoutes(app);
  registerPlaysRoutes(app);
  registerPlaylistRoutes(app);
  registerVocalSeparationRoutes(app);
  registerStreamingRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
