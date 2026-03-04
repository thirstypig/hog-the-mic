import express, { type Request, Response, NextFunction } from "express";
import { execFile } from "child_process";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initRedis, closeRedis } from "./redis";

const app = express();

// CORS — allow the Expo web dev server (and any local dev origin) to reach the API
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Redis (optional — falls back to in-memory if REDIS_URL not set)
  initRedis();

  const { httpServer: server, io } = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Check for yt-dlp availability (non-fatal)
  await new Promise<void>((resolve) => {
    execFile("yt-dlp", ["--version"], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        log(`WARNING: yt-dlp not found — streaming will not work. Install with: brew install yt-dlp`);
      } else {
        log(`yt-dlp version: ${stdout.trim()}`);
      }
      resolve();
    });
  });

  // Serve both the API and the client on the configured port
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });

  // ── Graceful shutdown ───────────────────────────────────────
  let shuttingDown = false;

  function gracefulShutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`${signal} received — shutting down gracefully…`);

    // Close all socket.io connections, then stop HTTP server
    io.close(() => {
      log("Socket.IO connections closed");
      closeRedis().then(() => {
        server.close(() => {
          log("HTTP server closed");
          process.exit(0);
        });
      });
    });

    // Force exit after 10s if connections don't drain
    setTimeout(() => {
      log("Forcing shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
