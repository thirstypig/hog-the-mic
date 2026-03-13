import type { Express } from "express";

export function registerTechRoutes(app: Express) {
  app.get("/tech", (_req, res) => {
    res.send(techPageHtml());
  });
}

function techPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KTV Singer — Tech Stack</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #e0e0e8;
      line-height: 1.6;
      min-height: 100vh;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 60px 24px;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #888;
      font-size: 1.1rem;
      margin-bottom: 48px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 48px;
    }
    .stat-card {
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 24px;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #a78bfa;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #888;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #c4b5fd;
      margin-bottom: 16px;
      margin-top: 40px;
    }
    h2:first-of-type { margin-top: 0; }
    .section {
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }
    .breakdown {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #0a0a0f;
      border-radius: 8px;
    }
    .breakdown-label { color: #aaa; }
    .breakdown-value { color: #e0e0e8; font-weight: 600; font-variant-numeric: tabular-nums; }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .tool-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #0a0a0f;
      border-radius: 8px;
      border: 1px solid #1a1a2a;
    }
    .tool-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #1e1e2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .tool-name { font-weight: 600; font-size: 0.95rem; }
    .tool-desc { font-size: 0.8rem; color: #888; }
    .integration-list { list-style: none; }
    .integration-list li {
      padding: 12px 16px;
      border-bottom: 1px solid #1a1a2a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .integration-list li:last-child { border-bottom: none; }
    .integration-name { font-weight: 600; }
    .integration-role { font-size: 0.85rem; color: #888; }
    .badge {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-db { background: #1e3a1e; color: #4ade80; }
    .badge-auth { background: #3a2e1e; color: #fbbf24; }
    .badge-rt { background: #1e2e3a; color: #60a5fa; }
    .badge-media { background: #3a1e3a; color: #c084fc; }
    .badge-ui { background: #1e3a3a; color: #2dd4bf; }
    .badge-build { background: #2a2a2a; color: #aaa; }
    .feature-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
      list-style: none;
    }
    .feature-list li {
      padding: 10px 14px;
      background: #0a0a0f;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid #1a1a2a;
    }
    .feature-list li span { color: #888; font-size: 0.8rem; display: block; margin-top: 2px; }
    .built-with {
      text-align: center;
      color: #555;
      font-size: 0.85rem;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #1a1a2a;
    }
    @media (max-width: 600px) {
      .breakdown { grid-template-columns: 1fr; }
      h1 { font-size: 1.8rem; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>KTV Singer</h1>
    <p class="subtitle">YouTube-powered karaoke system — technical overview</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">12,110</div>
        <div class="stat-label">Lines of Code</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">142</div>
        <div class="stat-label">Source Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">46</div>
        <div class="stat-label">Git Commits</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">~5M</div>
        <div class="stat-label">Est. Tokens Used</div>
      </div>
    </div>

    <h2>Codebase Breakdown</h2>
    <div class="section">
      <div class="breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">Server (TypeScript)</span>
          <span class="breakdown-value">3,476 lines</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Mobile (TypeScript/TSX)</span>
          <span class="breakdown-value">4,275 lines</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">tvOS (Swift)</span>
          <span class="breakdown-value">4,208 lines</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Shared Schemas</span>
          <span class="breakdown-value">151 lines</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">TypeScript Files</span>
          <span class="breakdown-value">99 files</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">React Components (TSX)</span>
          <span class="breakdown-value">19 files</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Swift Files</span>
          <span class="breakdown-value">24 files</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Languages</span>
          <span class="breakdown-value">3 (TS, TSX, Swift)</span>
        </div>
      </div>
    </div>

    <h2>Tools &amp; Technologies</h2>
    <div class="section">
      <div class="tool-grid">
        <div class="tool-card">
          <div class="tool-icon">🤖</div>
          <div><div class="tool-name">Claude Code (Opus)</div><div class="tool-desc">AI-assisted development</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🟢</div>
          <div><div class="tool-name">Node.js + Express</div><div class="tool-desc">REST API server</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">⚛️</div>
          <div><div class="tool-name">React Native + Expo</div><div class="tool-desc">iOS/Android mobile app</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🍎</div>
          <div><div class="tool-name">SwiftUI</div><div class="tool-desc">Native tvOS app</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🔷</div>
          <div><div class="tool-name">TypeScript</div><div class="tool-desc">Type-safe JS everywhere</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🗄️</div>
          <div><div class="tool-name">Drizzle ORM</div><div class="tool-desc">Type-safe SQL queries</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🔌</div>
          <div><div class="tool-name">Socket.IO</div><div class="tool-desc">Real-time communication</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">📦</div>
          <div><div class="tool-name">esbuild</div><div class="tool-desc">Server bundler</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🎵</div>
          <div><div class="tool-name">yt-dlp</div><div class="tool-desc">YouTube stream extraction</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">📱</div>
          <div><div class="tool-name">XcodeGen</div><div class="tool-desc">tvOS project generation</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">🎨</div>
          <div><div class="tool-name">NativeWind</div><div class="tool-desc">Tailwind CSS for React Native</div></div>
        </div>
        <div class="tool-card">
          <div class="tool-icon">✅</div>
          <div><div class="tool-name">Zod</div><div class="tool-desc">Runtime validation</div></div>
        </div>
      </div>
    </div>

    <h2>Integrations</h2>
    <div class="section">
      <ul class="integration-list">
        <li>
          <div><div class="integration-name">Supabase (PostgreSQL)</div><div class="integration-role">Primary database — songs, users, playlists, plays, sessions</div></div>
          <span class="badge badge-db">Database</span>
        </li>
        <li>
          <div><div class="integration-name">Supabase Auth (tvOS)</div><div class="integration-role">User authentication on Apple TV via supabase-swift SDK</div></div>
          <span class="badge badge-auth">Auth</span>
        </li>
        <li>
          <div><div class="integration-name">Google OIDC (Passport.js)</div><div class="integration-role">Optional OAuth login for web/mobile sessions</div></div>
          <span class="badge badge-auth">Auth</span>
        </li>
        <li>
          <div><div class="integration-name">YouTube (via yt-dlp)</div><div class="integration-role">Video streaming — extract direct playable URLs from YouTube</div></div>
          <span class="badge badge-media">Media</span>
        </li>
        <li>
          <div><div class="integration-name">LRCLIB</div><div class="integration-role">Synchronized lyrics database — LRC format with timestamps</div></div>
          <span class="badge badge-media">Media</span>
        </li>
        <li>
          <div><div class="integration-name">Socket.IO</div><div class="integration-role">Real-time device pairing, queue sync, audio streaming</div></div>
          <span class="badge badge-rt">Real-time</span>
        </li>
        <li>
          <div><div class="integration-name">Redis (optional)</div><div class="integration-role">Session store and caching — falls back to in-memory in dev</div></div>
          <span class="badge badge-db">Database</span>
        </li>
        <li>
          <div><div class="integration-name">AVPlayer / AVAudioEngine</div><div class="integration-role">tvOS video playback + real-time mic audio decoding</div></div>
          <span class="badge badge-media">Media</span>
        </li>
        <li>
          <div><div class="integration-name">Expo Camera</div><div class="integration-role">QR code scanning for device pairing</div></div>
          <span class="badge badge-ui">UI</span>
        </li>
        <li>
          <div><div class="integration-name">Expo AV</div><div class="integration-role">Microphone recording and audio capture on mobile</div></div>
          <span class="badge badge-media">Media</span>
        </li>
      </ul>
    </div>

    <h2>Server Feature Modules</h2>
    <div class="section">
      <ul class="feature-list">
        <li>auth <span>Google OIDC + Passport.js</span></li>
        <li>search <span>YouTube + LRCLIB lyrics</span></li>
        <li>songs <span>CRUD + metadata</span></li>
        <li>scoring <span>Play tracking + scores</span></li>
        <li>playlist <span>User playlists</span></li>
        <li>vocal-separation <span>Vocal isolation</span></li>
        <li>streaming <span>yt-dlp URL extraction</span></li>
        <li>pairing <span>Device pairing + queue</span></li>
      </ul>
    </div>

    <h2>Architecture</h2>
    <div class="section">
      <div style="font-family: monospace; font-size: 0.85rem; color: #aaa; white-space: pre; overflow-x: auto; line-height: 1.8;">
┌─────────────┐    Socket.IO     ┌──────────────┐    Socket.IO     ┌─────────────┐
│   iPhone    │◄────────────────►│   Express    │◄────────────────►│  Apple TV   │
│  (Expo RN)  │    REST API      │   Server     │    REST API      │   (SwiftUI) │
└─────────────┘                  └──────┬───────┘                  └─────────────┘
                                        │                                  │
                                 ┌──────┴───────┐                  AVPlayer (video)
                                 │   Supabase   │                  AVAudioEngine
                                 │  PostgreSQL  │                    (mic audio)
                                 └──────────────┘
                                        │
                                 ┌──────┴───────┐
                                 │   yt-dlp     │──► YouTube CDN
                                 │   LRCLIB     │──► Lyrics DB
                                 └──────────────┘</div>
    </div>

    <div class="built-with">
      Built with Claude Code (Opus) — entirely AI-assisted development
    </div>
  </div>
</body>
</html>`;
}
