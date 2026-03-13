# ktv-singer-shared

Shared types, Drizzle ORM schemas, and Socket.IO contracts for the KTV Singer system.

## Contents

- `schema/` — Drizzle ORM table definitions (songs, users, playlists, plays, performances, sessions)
- `pairing/` — Socket.IO event types, queue types, and payload interfaces shared between server, mobile, and tvOS

## Usage

Referenced as a local dependency from sibling packages:

```json
{
  "dependencies": {
    "ktv-singer-shared": "file:../ktv-singer-shared"
  }
}
```

```ts
import { songs, type Song } from "ktv-singer-shared/schema";
import { type QueueEntry, type ClientToServerEvents } from "ktv-singer-shared/pairing";
```
