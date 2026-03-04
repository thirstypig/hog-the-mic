import type { Song } from "@shared/schema";

/** Root stack — every top-level screen lives here */
export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  Player: { song: Song };
  Search: { query?: string } | undefined;
  Pair: undefined;
};

/** Tab navigator nested inside Home */
export type HomeTabParamList = {
  Library: undefined;
  Playlists: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
