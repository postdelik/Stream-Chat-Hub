export type ChatPlatform = "twitch" | "youtube" | "mock";

export type OverlayPosition = "left" | "center" | "right";

export type ChatSource = {
  id: string;
  platform: Exclude<ChatPlatform, "mock">;
  channelName: string;
  enabled: boolean;
};

export type ChatMessage = {
  id: string;
  platform: ChatPlatform;
  channelName: string;
  authorName: string;
  text: string;
  timestamp: number;
};

export type OverlayFilters = {
  hideCommands: boolean;
  hideLinks: boolean;
  onlyWords: string;
  highlightWords: string;
};

/**
 * Оставляем алиас для старого settingsStore.ts.
 * Новый код использует OverlayFilters, старый файл ждёт OverlayFilterSettings.
 */
export type OverlayFilterSettings = OverlayFilters;

export type OverlaySettings = {
  width: number;
  height: number;
  fontSize: number;
  chatWidth: number;
  maxMessages: number;
  position: OverlayPosition;

  showPlatformIcon: boolean;
  showChannelName: boolean;
  showAuthorName: boolean;

  backgroundOpacity: number;
  borderRadius: number;
  messageGap: number;

  filters: OverlayFilters;
};

export type TwitchAuthState = {
  enabled: boolean;
  username: string | null;
  accessToken: string | null;
  scopes: string[];
  expiresAt: number | null;
};

export type SafeTwitchAuthState = {
  enabled: boolean;
  username: string | null;
  scopes: string[];
  expiresAt: number | null;
  hasToken: boolean;
};

export type AppSettings = {
  sources: ChatSource[];
  youtubeApiKey: string;
  overlay: OverlaySettings;
  twitchAuth?: TwitchAuthState;
};

export type TwitchConnectionStatus = {
  connected: boolean;
  channelNames: string[];
  error: string | null;
  authenticated: boolean;
  username: string | null;
};

/**
 * Поля сделаны шире, чтобы старый youtubeChat.ts не ломал сборку,
 * даже пока мы YouTube не используем.
 */
export type YouTubeConnectionSourceStatus = {
  channelName?: string;
  sourceId?: string;
  input?: string;
  videoId?: string | null;
  liveChatId?: string | null;
  title?: string | null;
  connected: boolean;
  error: string | null;
};

export type YouTubeConnectionStatus = {
  connected: boolean;
  sources: YouTubeConnectionSourceStatus[];
  error: string | null;
};