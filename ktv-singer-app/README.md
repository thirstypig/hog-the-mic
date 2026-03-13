# ktv-singer-app

Expo React Native mobile client for the KTV Singer karaoke system (iOS, Android, web).

## Setup

```bash
npm install
npm start           # Expo dev server on port 3040
npm run ios         # iOS simulator
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server (port 3040) |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android |
| `npm run check` | TypeScript type check |

## Features

- Device pairing via QR code scanning
- Song queue management (search, add, reorder, remove)
- Microphone streaming to TV via Socket.IO
- YouTube + LRCLIB search with genre pills
- Session hosting with QR code display

## Dependencies

- `ktv-singer-shared` — shared Drizzle schemas and Socket.IO type contracts
