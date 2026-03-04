/** Root stack — every top-level screen lives here */
export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  Search: { query?: string } | undefined;
  Pair: undefined;
  Session: undefined;
};

/** Tab navigator nested inside Home */
export type HomeTabParamList = {
  Library: undefined;
  Playlists: undefined;
  Settings: undefined;
};

/** Session tab navigator (after pairing) */
export type SessionTabParamList = {
  Mic: undefined;
  SessionSearch: undefined;
  Queue: undefined;
  SessionInfo: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
